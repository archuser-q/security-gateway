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
import { Button, Group,Skeleton } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  createFileRoute,
  Link,
  useNavigate,
  useParams,
} from '@tanstack/react-router';
import { IconExternalLink, IconLock, IconServer2, IconWorld } from '@tabler/icons-react';
import { useEffect } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useBoolean } from 'react-use';

import { getStreamRouteQueryOptions } from '@/apis/hooks';
import { putStreamRouteReq } from '@/apis/stream_routes';
import { FormSubmitBtn } from '@/components/form/Btn';
import { FormPartStreamRoute } from '@/components/form-slice/FormPartStreamRoute';
import { Flow, FlowRow, type FlowBoxItem } from '@/components/form-slice/Flow';
import { FormTOCBox } from '@/components/form-slice/FormSection';
import { FormSectionGeneral } from '@/components/form-slice/FormSectionGeneral';
import { DeleteResourceBtn } from '@/components/page/DeleteResourceBtn';
import PageHeader from '@/components/page/PageHeader';
import { StreamRoutesErrorComponent } from '@/components/page-slice/stream_routes/ErrorComponent';
import { API_STREAM_ROUTES } from '@/config/constant';
import { req } from '@/config/req';
import { observer } from 'mobx-react-lite';
import { StreamRoutePutSchema, type StreamRoutePutType } from '@/components/form-slice/FormPartStreamRoute/schema';

type Props = {
  readOnly: boolean;
  setReadOnly: (v: boolean) => void;
  id: string;
};

const StreamRouteDetailForm = observer((props: Props) => {
  const { readOnly, setReadOnly, id } = props;
  const { t } = useTranslation();

  const streamRouteQuery = useQuery(getStreamRouteQueryOptions(id));
  const { data: streamRouteData, isLoading, refetch } = streamRouteQuery;

  const form = useForm({
    resolver: zodResolver(StreamRoutePutSchema),
    shouldUnregister: true,
    shouldFocusError: true,
    mode: 'all',
    disabled: readOnly,
  });

  useEffect(() => {
    if (streamRouteData?.value && !isLoading) {
      form.reset(streamRouteData.value);
    }
  }, [streamRouteData, form, isLoading]);

  const putStreamRoute = useMutation({
    mutationFn: (d: StreamRoutePutType) =>
      putStreamRouteReq(req, d),
    async onSuccess() {
      notifications.show({
        message: t('info.edit.success', { name: t('streamRoutes.singular') }),
        color: 'green',
      });
      await refetch();
      setReadOnly(true);
    },
  });

  if (isLoading) {
    return <Skeleton height={400} />;
  }

  const route = streamRouteData?.value;
  const { server_addr, server_port, remote_addr, sni, service_id, upstream_id, upstream } =
    route ?? {};
  const isUdp = upstream?.scheme === 'udp';
  const hasUpstream = !!upstream_id || !!upstream;

  const boxes: FlowBoxItem[] = [
    {
      key: 'port',
      title: t('form.streamRoutes.serverPort'),
      content: (
        <span className="font-mono text-lg font-semibold text-gray-800">
          {server_port ? `:${server_port}` : <span className="text-gray-300">-</span>}
        </span>
      ),
    },
    {
      key: 'router',
      title: isUdp ? 'UDP Router' : 'TCP Router',
      content: (
        <>
          <FlowRow label={t('form.streamRoutes.serverAddr')} value={server_addr} />
          <FlowRow label={t('form.streamRoutes.remoteAddr')} value={remote_addr} />
        </>
      ),
    },
    ...(service_id
      ? [
          {
            key: 'service',
            title: t('form.streamRoutes.server'),
            content: (
              <Link
                to="/services/detail/$id"
                params={{ id: service_id }}
                className="inline-flex items-center gap-2 text-sm font-semibold text-teal-600 hover:text-teal-700 hover:underline"
              >
                <IconServer2 size={16} className="text-teal-600" />
                {service_id}
                <IconExternalLink size={12} stroke={2} />
              </Link>
            ),
          },
        ]
      : []),
    ...(hasUpstream
      ? [
          {
            key: 'upstream',
            title: t('form.upstreams.title'),
            content: upstream_id ? (
              <Link
                to="/upstreams/detail/$id"
                params={{ id: upstream_id }}
                className="inline-flex items-center gap-2 text-sm font-semibold text-teal-600 hover:text-teal-700 hover:underline"
              >
                <IconWorld size={16} className="text-teal-600" />
                {upstream_id}
                <IconExternalLink size={12} stroke={2} />
              </Link>
            ) : (
              <div className="flex items-center gap-2">
                <IconWorld size={16} className="text-teal-600" />
                <span className="text-sm font-semibold text-gray-800">
                  {t('form.upstreams.title')}
                </span>
              </div>
            ),
          },
        ]
      : []),
  ];

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit((d) => putStreamRoute.mutateAsync(d))}>
        {route && (
          <Flow
            title={t('sources.overview')}
            boxes={boxes}
            extra={
              !isUdp ? (
                <div className="mt-4 rounded-xl border border-gray-200 bg-white p-4">
                  <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <IconLock size={16} className="text-emerald-600" />
                    TLS
                  </div>
                  {sni ? (
                    <FlowRow label={t('form.streamRoutes.sni')} value={sni} />
                  ) : (
                    <p className="py-2 text-center text-sm text-gray-400">No TLS configured</p>
                  )}
                </div>
              ) : undefined
            }
          />
        )}
        <FormSectionGeneral readOnly />
        <FormPartStreamRoute />
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
});

type StreamRouteDetailProps = Pick<Props, 'id'> & {
  onDeleteSuccess: () => void;
};

export const StreamRouteDetail = observer((props: StreamRouteDetailProps) => {
  const { id, onDeleteSuccess } = props;
  const { t } = useTranslation();
  const [readOnly, setReadOnly] = useBoolean(true);

  return (
    <>
      <PageHeader
        title={t('info.edit.title', { name: t('streamRoutes.singular') })}
        {...(readOnly && {
          title: t('info.detail.title', { name: t('streamRoutes.singular') }),
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
                name={t('streamRoutes.singular')}
                target={id}
                api={`${API_STREAM_ROUTES}/${id}`}
                onSuccess={onDeleteSuccess}
              />
            </Group>
          ),
        })}
      />
      <FormTOCBox>
        <StreamRouteDetailForm
          readOnly={readOnly}
          setReadOnly={setReadOnly}
          id={id}
        />
      </FormTOCBox>
    </>
  );
});

function RouteComponent() {
  const { id } = useParams({ from: '/_authenticated/stream_routes/detail/$id' });
  const navigate = useNavigate();
  return (
    <StreamRouteDetail
      id={id}
      onDeleteSuccess={() => navigate({ to: '/stream_routes' })}
    />
  );
}

export const Route = createFileRoute('/_authenticated/stream_routes/detail/$id')({
  component: RouteComponent,
  errorComponent: StreamRoutesErrorComponent,
});