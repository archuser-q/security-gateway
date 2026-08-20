/**
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { zodResolver } from '@hookform/resolvers/zod';
import { Badge, Button, Card, Grid, Group, Skeleton, Stack, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useMutation, useSuspenseQuery } from '@tanstack/react-query';
import {
  createFileRoute,
  useNavigate,
  useParams,
} from '@tanstack/react-router';
import { useEffect } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useBoolean } from 'react-use';

import { getPluginConfigQueryOptions } from '@/apis/hooks';
import { putPluginConfigReq } from '@/apis/plugin_configs';
import { FormSubmitBtn } from '@/components/form/Btn';
import { FormPartPluginConfig } from '@/components/form-slice/FormPartPluginConfig';
import { FormTOCBox } from '@/components/form-slice/FormSection';
import { FormSectionGeneral } from '@/components/form-slice/FormSectionGeneral';
import { DeleteResourceBtn } from '@/components/page/DeleteResourceBtn';
import PageHeader from '@/components/page/PageHeader';
import { API_PLUGIN_CONFIGS } from '@/config/constant';
import { req } from '@/config/req';
import { APISIX, type APISIXType } from '@/types/schema/apisix';

const formatConfigValue = (v: unknown): string => {
  if (v === null || v === undefined || v === '') return '-';
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
};

// Traefik hiện thẳng Average/Period/Burst (tham số riêng của middleware
// ratelimit) ngay đầu trang chi tiết, không bắt người xem phải bấm thêm.
// Plugin Config của APISIX có thể chứa NHIỀU plugin cùng lúc (khác với
// Traefik chỉ 1 type/middleware), nên ở đây liệt kê từng plugin thành 1
// khối riêng, mỗi khối hiện hết key/value cấu hình của đúng plugin đó -
// giữ đúng tinh thần "xem được ngay, không cần bấm vào tab Plugins".
const PluginParamsList = ({
  plugins,
}: {
  plugins?: Record<string, Record<string, unknown>>;
}) => {
  const entries = Object.entries(plugins ?? {});
  if (entries.length === 0) return null;

  return (
    <Grid mb="md">
      {entries.map(([name, config]) => (
        <Grid.Col key={name} span={{ base: 12, md: 6 }}>
          <Card withBorder radius="md" p="md">
            <Badge variant="light" color="teal" size="sm" mb="xs">
              {name}
            </Badge>
            <Stack gap={0}>
              {Object.entries(config).length === 0 ? (
                <Text size="sm" c="dimmed">
                  -
                </Text>
              ) : (
                Object.entries(config).map(([key, val]) => (
                  <Group key={key} justify="space-between" py={4} wrap="nowrap" gap="md">
                    <Text size="sm" c="dimmed" style={{ flexShrink: 0 }}>
                      {key}
                    </Text>
                    <Text size="sm" ta="right" style={{ wordBreak: 'break-all' }}>
                      {formatConfigValue(val)}
                    </Text>
                  </Group>
                ))
              )}
            </Stack>
          </Card>
        </Grid.Col>
      ))}
    </Grid>
  );
};

// Cùng phong cách tóm tắt nhanh đã dùng cho Route/SSL. Không có Status
// (Plugin Config không thật sự có trạng thái bật/tắt như Route/SSL, xem
// giải thích trong chat) nên khối tóm tắt chỉ còn ID/Name/Desc + danh
// sách plugin - giống phần "Type" trên đầu trang Middleware detail của
// Traefik, chỉ khác là liệt kê nhiều plugin thay vì 1 type.
const PluginConfigSummaryCard = ({
  data,
}: {
  data: APISIXType['PluginConfig'] | undefined;
}) => {
  const { t } = useTranslation();
  if (!data) return null;
  const pluginNames = Object.keys(data.plugins ?? {});

  return (
    <Card withBorder radius="md" p="md" mb="md">
      <Group gap="xl" wrap="wrap" align="flex-start">
        <Stack gap={2}>
          <Text size="xs" c="dimmed">
            ID
          </Text>
          <Text fw={600} size="sm">
            {data.id}
          </Text>
        </Stack>
        {data.name && (
          <Stack gap={2}>
            <Text size="xs" c="dimmed">
              {t('form.basic.name')}
            </Text>
            <Text fw={600} size="sm">
              {data.name}
            </Text>
          </Stack>
        )}
        <Stack gap={2} style={{ flex: 1, minWidth: 200 }}>
          <Text size="xs" c="dimmed">
            {t('pluginConfigs.pluginsCount', { count: pluginNames.length })}
          </Text>
          <Group gap={4} wrap="wrap">
            {pluginNames.length === 0 ? (
              <Text size="sm">-</Text>
            ) : (
              pluginNames.map((name) => (
                <Badge key={name} variant="light" color="teal" size="sm">
                  {name}
                </Badge>
              ))
            )}
          </Group>
        </Stack>
      </Group>
    </Card>
  );
};

type Props = {
  id: string;
  readOnly: boolean;
  setReadOnly: (v: boolean) => void;
};

const PluginConfigDetailForm = (props: Props) => {
  const { id, readOnly, setReadOnly } = props;
  const { t } = useTranslation();

  const pluginConfigQuery = useSuspenseQuery(getPluginConfigQueryOptions(id));
  const { data } = pluginConfigQuery;
  const initialValue = data.value;

  const putPluginConfig = useMutation({
    mutationFn: (d: APISIXType['PluginConfigPut']) =>
      putPluginConfigReq(req, d),
    async onSuccess() {
      notifications.show({
        message: t('info.edit.success', { name: t('pluginConfigs.singular') }),
        color: 'green',
      });
      pluginConfigQuery.refetch();
      setReadOnly(true);
    },
  });

  const form = useForm({
    resolver: zodResolver(APISIX.PluginConfigPut),
    shouldUnregister: true,
    shouldFocusError: true,
    mode: 'all',
    disabled: readOnly,
  });

  // Reset form when initialValue changes
  useEffect(() => {
    form.reset(initialValue);
  }, [form, initialValue]);

  if (!data) return <Skeleton height={200} />;

  return (
    <>
      <PluginConfigSummaryCard data={initialValue} />
      <PluginParamsList plugins={initialValue.plugins} />
      <FormProvider {...form}>
        <form onSubmit={form.handleSubmit((d) => putPluginConfig.mutateAsync(d))}>
          <FormSectionGeneral readOnly />
          <FormPartPluginConfig />
          {!readOnly && (
            <Group>
              <FormSubmitBtn>{t('form.btn.save')}</FormSubmitBtn>
              <Button variant="outline" onClick={() => setReadOnly(true)}>
                {t('form.btn.cancel')}
              </Button>
            </Group>
          )}
        </form>
      </FormProvider>
    </>
  );
};

function RouteComponent() {
  const { id } = useParams({ from: '/_authenticated/plugin_configs/detail/$id' });
  const { t } = useTranslation();
  const [readOnly, setReadOnly] = useBoolean(true);
  const navigate = useNavigate();

  return (
    <>
      <PageHeader
        title={t('info.edit.title', { name: t('pluginConfigs.singular') })}
        {...(readOnly && {
          title: t('info.detail.title', { name: t('pluginConfigs.singular') }),
          extra: (
            <Group>
              <Button
                onClick={() => setReadOnly(false)}
                size="compact-sm"
                variant="gradient"
              >
                {t('form.btn.edit')}
              </Button>
              <DeleteResourceBtn
                mode="detail"
                name={t('pluginConfigs.singular')}
                target={id}
                api={`${API_PLUGIN_CONFIGS}/${id}`}
                onSuccess={() => navigate({ to: '/plugin_configs' })}
              />
            </Group>
          ),
        })}
      />
      <FormTOCBox>
        <PluginConfigDetailForm
          id={id}
          readOnly={readOnly}
          setReadOnly={setReadOnly}
        />
      </FormTOCBox>
    </>
  );
}

export const Route = createFileRoute('/_authenticated/plugin_configs/detail/$id/')({
  component: RouteComponent,
});
