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

import { putConsumerGroupReq } from '@/apis/consumer_groups';
import { getConsumerGroupQueryOptions } from '@/apis/hooks';
import { FormSubmitBtn } from '@/components/form/Btn';
import { FormPartPluginConfig } from '@/components/form-slice/FormPartPluginConfig';
import { FormTOCBox } from '@/components/form-slice/FormSection';
import { FormSectionGeneral } from '@/components/form-slice/FormSectionGeneral';
import { ConsumerGroupImpactPanel } from '@/components/page/ConsumerGroupImpactPanel';
import { DeleteResourceBtn } from '@/components/page/DeleteResourceBtn';
import PageHeader from '@/components/page/PageHeader';
import { API_CONSUMER_GROUPS } from '@/config/constant';
import { req } from '@/config/req';
import { APISIX, type APISIXType } from '@/types/schema/apisix';

const formatConfigValue = (v: unknown): string => {
  if (v === null || v === undefined || v === '') return '-';
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
};

// ConsumerGroup CHÍNH LÀ PluginConfig (chỉ thiếu field name), nên tóm
// tắt ở đây giữ nguyên đúng bố cục đã làm cho Plugin Config Detail -
// không phải trùng lặp code vô nghĩa, mà vì 2 resource gần như giống hệt
// nhau về bản chất, chỉ khác chỗ nó gắn cho Consumer chứ không gắn cho
// Route/Service.
const ConsumerGroupSummaryCard = ({
  data,
}: {
  data: APISIXType['ConsumerGroup'] | undefined;
}) => {
  if (!data) return null;
  const pluginNames = Object.keys(data.plugins ?? {});

  return (
    <Card withBorder radius="md" p="md" mb="md">
      <Stack gap={2}>
        <Text size="xs" c="dimmed">
          ID
        </Text>
        <Text fw={600} size="sm">
          {data.id}
        </Text>
      </Stack>
      <Group gap={4} wrap="wrap" mt="xs">
        {pluginNames.length === 0 ? (
          <Text size="sm" c="dimmed">
            -
          </Text>
        ) : (
          pluginNames.map((name) => (
            <Badge key={name} variant="light" color="teal" size="sm">
              {name}
            </Badge>
          ))
        )}
      </Group>
    </Card>
  );
};

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

type Props = {
  id: string;
  readOnly: boolean;
  setReadOnly: (v: boolean) => void;
};

const ConsumerGroupDetailForm = (props: Props) => {
  const { id, readOnly, setReadOnly } = props;
  const { t } = useTranslation();

  const consumerGroupQuery = useSuspenseQuery(getConsumerGroupQueryOptions(id));
  const { data } = consumerGroupQuery;

  const putConsumerGroup = useMutation({
    mutationFn: (d: APISIXType['ConsumerGroupPut']) =>
      putConsumerGroupReq(req, d),
    async onSuccess() {
      notifications.show({
        message: t('info.edit.success', { name: t('consumerGroups.singular') }),
        color: 'green',
      });
      consumerGroupQuery.refetch();
      setReadOnly(true);
    },
  });

  const form = useForm({
    resolver: zodResolver(APISIX.ConsumerGroupPut),
    shouldUnregister: true,
    shouldFocusError: true,
    mode: 'all',
    disabled: readOnly,
  });

  useEffect(() => {
    form.reset(data.value);
  }, [form, data.value]);

  if (!data) return <Skeleton height={200} />;

  return (
    <>
      <ConsumerGroupSummaryCard data={data.value} />
      <ConsumerGroupImpactPanel
        groupId={data.value.id}
        groupPluginNames={Object.keys(data.value.plugins ?? {})}
      />
      <PluginParamsList plugins={data.value.plugins} />
      <FormProvider {...form}>
      <form
        onSubmit={form.handleSubmit((d) =>
          putConsumerGroup.mutateAsync({ ...d, id })
        )}
      >
        <FormSectionGeneral readOnly />
        <FormPartPluginConfig basicProps={{ showName: false }} />
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
  const { id } = useParams({ from: '/_authenticated/consumer_groups/detail/$id' });
  const { t } = useTranslation();
  const [readOnly, setReadOnly] = useBoolean(true);
  const navigate = useNavigate();

  return (
    <>
      <PageHeader
        title={t('info.edit.title', { name: t('consumerGroups.singular') })}
        {...(readOnly && {
          title: t('info.detail.title', { name: t('consumerGroups.singular') }),
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
                name={t('consumerGroups.singular')}
                target={id}
                api={`${API_CONSUMER_GROUPS}/${id}`}
                onSuccess={() => navigate({ to: '/consumer_groups' })}
              />
            </Group>
          ),
        })}
      />
      <FormTOCBox>
        <ConsumerGroupDetailForm
          id={id}
          readOnly={readOnly}
          setReadOnly={setReadOnly}
        />
      </FormTOCBox>
    </>
  );
}

export const Route = createFileRoute('/_authenticated/consumer_groups/detail/$id/')({
  component: RouteComponent,
});
