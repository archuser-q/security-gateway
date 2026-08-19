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
import { Badge, Button, Card, Group, Skeleton, Stack, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  useMutation,
  useQuery,
  useSuspenseQuery,
} from '@tanstack/react-query';
import {
  createFileRoute,
  useNavigate,
  useParams,
} from '@tanstack/react-router';
import { useEffect } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useBoolean } from 'react-use';

import { getServiceQueryOptions, getUpstreamQueryOptions } from '@/apis/hooks';
import { putServiceReq } from '@/apis/services';
import { FormSubmitBtn } from '@/components/form/Btn';
import { FormPartService } from '@/components/form-slice/FormPartService';
import { FormTOCBox } from '@/components/form-slice/FormSection';
import { FormSectionGeneral } from '@/components/form-slice/FormSectionGeneral';
import { DeleteResourceBtn } from '@/components/page/DeleteResourceBtn';
import PageHeader from '@/components/page/PageHeader';
import { API_SERVICES } from '@/config/constant';
import { req } from '@/config/req';
import { APISIX, type APISIXType } from '@/types/schema/apisix';
import { produceRmUpstreamWhenHas } from '@/utils/form-producer';
import { pipeProduce } from '@/utils/producer';
import { nodeCount } from '@/utils/upstreamHelpers';

type Props = {
  readOnly: boolean;
  setReadOnly: (v: boolean) => void;
};

// Thẻ tóm tắt nhanh cho Service, cùng phong cách với RouteSummaryCard
// bên Route Detail - hiện Status/Hosts/kiểu upstream/số node ngay trước
// form dài, không phải kéo xuống mục Upstream trong TOC mới thấy.
const ServiceSummaryCard = (props: {
  data: APISIXType['RespServiceDetail'] | undefined;
}) => {
  const { t } = useTranslation();
  const value = props.data?.value;

  // Service cũng có thể tham chiếu upstream qua ID thay vì khai báo
  // inline - fetch thêm khi cần, giống cách RouteFlowDiagram đã làm.
  const upstreamId = !value?.upstream ? value?.upstream_id : undefined;
  const upstreamByIdQuery = useQuery({
    ...getUpstreamQueryOptions(upstreamId ?? ''),
    enabled: !!upstreamId,
  });
  const resolvedUpstream = value?.upstream ?? upstreamByIdQuery.data?.value;
  const isUpstreamLoading = upstreamByIdQuery.isLoading;

  if (!value) return null;

  return (
    <Card withBorder radius="md" p="md" mb="md">
      <Group gap="xl" wrap="wrap">
        <Stack gap={2}>
          <Text size="xs" c="dimmed">
            {t('form.basic.status')}
          </Text>
          {value.status === 0 ? (
            <Badge color="gray" variant="light">
              {t('form.basic.statusOption.0')}
            </Badge>
          ) : (
            <Badge color="teal" variant="light">
              {t('form.basic.statusOption.1')}
            </Badge>
          )}
        </Stack>
        <Stack gap={2}>
          <Text size="xs" c="dimmed">
            Hosts
          </Text>
          <Group gap={4}>
            {value.hosts?.length
              ? value.hosts.map((h) => (
                  <Badge key={h} variant="outline" size="sm">
                    {h}
                  </Badge>
                ))
              : '-'}
          </Group>
        </Stack>
        <Stack gap={2}>
          <Text size="xs" c="dimmed">
            Upstream Type
          </Text>
          {isUpstreamLoading ? (
            <Skeleton height={16} width={70} />
          ) : (
            <Text fw={600}>{resolvedUpstream?.type ?? '-'}</Text>
          )}
        </Stack>
        <Stack gap={2}>
          <Text size="xs" c="dimmed">
            Nodes
          </Text>
          {isUpstreamLoading ? (
            <Skeleton height={16} width={30} />
          ) : (
            <Text fw={600}>{nodeCount(resolvedUpstream?.nodes)}</Text>
          )}
        </Stack>
        {resolvedUpstream?.pass_host && (
          <Stack gap={2}>
            <Text size="xs" c="dimmed">
              Pass Host
            </Text>
            <Badge variant="outline" size="sm">
              {resolvedUpstream.pass_host}
            </Badge>
          </Stack>
        )}
      </Group>
    </Card>
  );
};

const ServiceDetailForm = (props: Props) => {
  const { readOnly, setReadOnly } = props;
  const { t } = useTranslation();
  const { id } = useParams({ from: '/_authenticated/services/detail/$id' });

  const serviceQuery = useSuspenseQuery(getServiceQueryOptions(id));
  const { data: serviceData, isLoading, refetch } = serviceQuery;

  const form = useForm({
    resolver: zodResolver(APISIX.ServicePut),
    shouldUnregister: true,
    shouldFocusError: true,
    mode: 'all',
    disabled: readOnly,
  });

  useEffect(() => {
    if (serviceData?.value && !isLoading) {
      form.reset(serviceData.value);
    }
  }, [serviceData, form, isLoading]);

  const putService = useMutation({
    mutationFn: (d: APISIXType['ServicePut']) =>
      putServiceReq(
        req,
        pipeProduce(produceRmUpstreamWhenHas('upstream_id'))(d)
      ),
    async onSuccess() {
      notifications.show({
        message: t('info.edit.success', { name: t('services.singular') }),
        color: 'green',
      });
      await refetch();
      setReadOnly(true);
    },
  });

  if (isLoading) {
    return <Skeleton height={400} />;
  }

  return (
    <FormProvider {...form}>
      <ServiceSummaryCard data={serviceData} />
      <form onSubmit={form.handleSubmit((d) => putService.mutateAsync(d))}>
        <FormSectionGeneral />
        <FormPartService />
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
  );
};

function RouteComponent() {
  const { t } = useTranslation();
  const [readOnly, setReadOnly] = useBoolean(true);
  const { id } = useParams({ from: '/_authenticated/services/detail/$id' });
  const navigate = useNavigate();

  return (
    <>
      <PageHeader
        title={t('info.edit.title', { name: t('services.singular') })}
        {...(readOnly && {
          title: t('info.detail.title', { name: t('services.singular') }),
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
                name={t('services.singular')}
                target={id}
                api={`${API_SERVICES}/${id}`}
                onSuccess={() => navigate({ to: '/services' })}
              />
            </Group>
          ),
        })}
      />
      <FormTOCBox>
        <ServiceDetailForm readOnly={readOnly} setReadOnly={setReadOnly} />
      </FormTOCBox>
    </>
  );
}

export const Route = createFileRoute('/_authenticated/services/detail/$id/')({
  component: RouteComponent,
});
