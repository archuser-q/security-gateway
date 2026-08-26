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
import { Button, Group, Skeleton } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useMutation, useQuery, useSuspenseQuery } from '@tanstack/react-query';
import {
  createFileRoute,
  Link,
  useNavigate,
  useParams,
} from '@tanstack/react-router';
import { IconExternalLink, IconServer } from '@tabler/icons-react';
import { useEffect } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useBoolean } from 'react-use';

import { getServiceQueryOptions, getUpstreamQueryOptions } from '@/apis/hooks';
import { putServiceReq } from '@/apis/services';
import { FormSubmitBtn } from '@/components/form/Btn';
import { FormPartService } from '@/components/form-slice/FormPartService';
import { FormSection, FormTOCBox } from '@/components/form-slice/FormSection';
import { FormSectionGeneral } from '@/components/form-slice/FormSectionGeneral';
import { DeleteResourceBtn } from '@/components/page/DeleteResourceBtn';
import PageHeader from '@/components/page/PageHeader';
import { API_SERVICES } from '@/config/constant';
import { req } from '@/config/req';
import { APISIX, type APISIXType } from '@/types/schema/apisix';
import { produceRmUpstreamWhenHas } from '@/utils/form-producer';
import { pipeProduce } from '@/utils/producer';

type Props = {
  readOnly: boolean;
  setReadOnly: (v: boolean) => void;
};

const normalizeNodes = (nodes: unknown): { host: string; port: number }[] => {
  if (!nodes) return [];
  if (Array.isArray(nodes)) {
    return (nodes as { host: string; port: number }[]).map(({ host, port }) => ({ host, port }));
  }
  return Object.keys(nodes as Record<string, number>).map((key) => {
    const lastColon = key.lastIndexOf(':');
    const host = lastColon >= 0 ? key.slice(0, lastColon) : key;
    const port = lastColon >= 0 ? Number(key.slice(lastColon + 1)) : 0;
    return { host, port };
  });
};

const SummaryField = ({ label, children }: { label: string; children?: React.ReactNode }) => (
  <div className="flex flex-col gap-1.5">
    <span className="text-xs font-semibold text-gray-500">{label}</span>
    <span className="text-[15px] text-gray-900">
      {children === undefined || children === null || children === '' ? (
        <span className="text-gray-300">-</span>
      ) : (
        children
      )}
    </span>
  </div>
);

/** Key/value row inside the "Upstream" info card. `bold` controls only this row's value weight — every row is normal weight except Nodes. */
const InfoRow = ({
  label,
  value,
  bold = false,
}: {
  label: string;
  value?: React.ReactNode;
  bold?: boolean;
}) => (
  <div className="flex justify-between border-b border-gray-100 py-2 last:border-b-0">
    <span className="text-[13.5px] text-gray-500">{label}</span>
    <span className={`text-[13.5px] text-gray-900 ${bold ? 'font-semibold' : 'font-normal'}`}>
      {value === undefined || value === null || value === '' ? (
        <span className="text-gray-300">-</span>
      ) : (
        value
      )}
    </span>
  </div>
);

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

  const service = serviceData?.value;
  const upstreamId = service?.upstream_id;
  const { data: referencedUpstream } = useQuery({
    ...getUpstreamQueryOptions(upstreamId as string),
    enabled: !!upstreamId && !service?.upstream,
  });

  if (isLoading) {
    return <Skeleton height={400} />;
  }

  const upstream = service?.upstream ?? referencedUpstream?.value;
  const isEnabled = service?.status !== 0;
  const nodes = normalizeNodes(upstream?.nodes);
  const scheme = upstream?.scheme || 'http';
  const hasHealthCheck = !!upstream?.checks;
  const timeout = upstream?.timeout;
  const timeoutLabel = timeout
    ? [
        timeout.connect !== undefined ? `connect ${timeout.connect}s` : null,
        timeout.send !== undefined ? `send ${timeout.send}s` : null,
        timeout.read !== undefined ? `read ${timeout.read}s` : null,
      ]
        .filter(Boolean)
        .join(' / ')
    : undefined;

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit((d) => putService.mutateAsync(d))}>
        {service && (
          <FormSection legend={t('sources.overview')}>
            <div>
              <div className="mb-5 grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-x-8 gap-y-4">
                <SummaryField label={t('form.basic.status')}>
                  <span
                    className={`inline-block w-fit rounded-md px-2.5 py-0.5 text-[11.5px] font-bold tracking-wide ${
                      isEnabled ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {isEnabled
                      ? t('form.basic.statusOption.1').toUpperCase()
                      : t('form.basic.statusOption.0').toUpperCase()}
                  </span>
                </SummaryField>
                <SummaryField label={t('form.upstreams.type')}>{upstream?.type}</SummaryField>
                <SummaryField label={t('form.upstreams.scheme')}>{upstream?.scheme}</SummaryField>
                <SummaryField label={t('form.upstreams.passHost')}>
                  {upstream?.pass_host}
                </SummaryField>
              </div>

              {upstream && (
                <div className="rounded-xl border border-gray-200 bg-white px-5 py-4">
                  <span className="mb-3 inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold tracking-wide text-emerald-600">
                    <IconServer size={13} stroke={2} />
                    {t('form.upstreams.title').toUpperCase()}
                  </span>
                  {[
                    {
                      label: t('form.upstreams.upstreamId'),
                      value: upstreamId ? (
                        <Link
                          to="/upstreams/detail/$id"
                          params={{ id: upstreamId }}
                          className="inline-flex items-center gap-1 text-teal-600 hover:text-teal-700 hover:underline"
                        >
                          {upstreamId}
                          <IconExternalLink size={12} stroke={2} />
                        </Link>
                      ) : undefined,
                    },
                    { label: t('form.upstreams.upstreamHost'), value: upstream.upstream_host },
                    {
                      label: `${t('form.upstreams.nodes.title')} (${nodes.length})`,
                      bold: true,
                      value:
                        nodes.length > 0 ? (
                          <div className="flex flex-col items-end gap-1">
                            {nodes.map((n, i) => (
                              <span
                                key={`${n.host}:${n.port}-${i}`}
                                className="font-mono text-[13px] font-semibold text-gray-900"
                              >
                                {scheme}://{n.host}:{n.port}
                              </span>
                            ))}
                          </div>
                        ) : undefined,
                    },
                    { label: t('form.upstreams.retries'), value: upstream.retries },
                    { label: t('form.upstreams.retryTimeout'), value: upstream.retry_timeout },
                    { label: t('form.upstreams.timeout.title'), value: timeoutLabel },
                    {
                      label: t('form.upstreams.checks.title'),
                      value: hasHealthCheck ? t('table.enabled') : t('table.disabled'),
                    },
                  ]
                    .filter((row) => row.value !== undefined && row.value !== null && row.value !== '')
                    .map((row) => (
                      <InfoRow key={row.label} label={row.label} value={row.value} bold={row.bold} />
                    ))}
                </div>
              )}
            </div>
          </FormSection>
        )}
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
