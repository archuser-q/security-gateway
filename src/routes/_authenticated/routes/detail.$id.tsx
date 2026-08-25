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
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  createFileRoute,
  Link,
  useNavigate,
  useParams,
} from '@tanstack/react-router';
import { IconExternalLink, IconServer2, IconWorld } from '@tabler/icons-react';
import { useEffect } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useBoolean } from 'react-use';

import { getRouteQueryOptions } from '@/apis/hooks';
import { putRouteReq } from '@/apis/routes';
import { FormSubmitBtn } from '@/components/form/Btn';
import { FormPartRoute } from '@/components/form-slice/FormPartRoute';
import {
  RoutePutSchema,
  type RoutePutType,
} from '@/components/form-slice/FormPartRoute/schema';
import {
  produceRoute,
  produceVarsToForm,
} from '@/components/form-slice/FormPartRoute/util';
import { produceToUpstreamForm } from '@/components/form-slice/FormPartUpstream/util';
import { Flow, FlowRow, type FlowBoxItem } from '@/components/form-slice/Flow';
import { FormTOCBox } from '@/components/form-slice/FormSection';
import { FormSectionGeneral } from '@/components/form-slice/FormSectionGeneral';
import { DeleteResourceBtn } from '@/components/page/DeleteResourceBtn';
import PageHeader from '@/components/page/PageHeader';
import { API_ROUTES } from '@/config/constant';
import { req } from '@/config/req';
import { type APISIXType } from '@/types/schema/apisix';

type Props = {
  readOnly: boolean;
  setReadOnly: (v: boolean) => void;
  id: string;
};

const RouteDetailForm = (props: Props) => {
  const { readOnly, setReadOnly, id } = props;
  const { t } = useTranslation();

  const routeQuery = useQuery(getRouteQueryOptions(id));
  const { data: routeData, isLoading, refetch } = routeQuery;

  const form = useForm({
    resolver: zodResolver(RoutePutSchema),
    shouldUnregister: false,
    shouldFocusError: true,
    mode: 'all',
    disabled: readOnly,
  });

  useEffect(() => {
    if (routeData?.value && !isLoading) {
      const upstreamProduced = produceToUpstreamForm(
        routeData.value.upstream || {},
        routeData.value
      );
      form.reset(produceVarsToForm(upstreamProduced));
    }
  }, [routeData, form, isLoading]);

  const putRoute = useMutation({
    mutationFn: (d: RoutePutType) =>
      putRouteReq(req, produceRoute(d) as APISIXType['Route']),
    async onSuccess() {
      notifications.show({
        message: t('info.edit.success', { name: t('routes.singular') }),
        color: 'green',
      });
      await refetch();
      setReadOnly(true);
    },
  });

  if (isLoading) {
    return <Skeleton height={400} />;
  }

  const route = routeData?.value;
  const isEnabled = route?.status !== 0;
  const service_id = route?.service_id;
  const upstream_id = route?.upstream_id;
  const upstream = route?.upstream;
  const hasUpstream = !!upstream_id || !!upstream;

  const boxes: FlowBoxItem[] = route
    ? [
        {
          key: 'route',
          title: t('routes.singular'),
          content: (
            <>
              <div className="font-mono text-sm font-semibold text-gray-800">
                {route.uri || '-'}
              </div>
              <div className="flex flex-wrap gap-1.5">
                <span
                  className={`inline-block rounded-md px-2 py-0.5 text-[11px] font-bold tracking-wide ${
                    isEnabled ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {isEnabled
                    ? t('form.basic.statusOption.1').toUpperCase()
                    : t('form.basic.statusOption.0').toUpperCase()}
                </span>
                {(route.methods ?? []).map((m) => (
                  <span
                    key={m}
                    className="inline-block rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-bold tracking-wide text-blue-700"
                  >
                    {m}
                  </span>
                ))}
              </div>
              <FlowRow label={t('form.routes.priority', 'Priority')} value={route.priority} />
            </>
          ),
        },
        ...(service_id
          ? [
              {
                key: 'service',
                title: t('sources.services'),
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
                content: (
                  <>
                    {upstream_id ? (
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
                    )}
                    {upstream?.type && (
                      <div className="flex flex-wrap gap-1.5">
                        <span className="inline-block rounded-md bg-violet-50 px-2 py-0.5 text-[11px] font-bold tracking-wide text-violet-700">
                          {upstream.type.toUpperCase()}
                        </span>
                        {upstream.scheme && (
                          <span className="inline-block rounded-md bg-gray-100 px-2 py-0.5 text-[11px] font-bold tracking-wide text-gray-600">
                            {upstream.scheme.toUpperCase()}
                          </span>
                        )}
                      </div>
                    )}
                  </>
                ),
              },
            ]
          : []),
      ]
    : [];

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit((d) => putRoute.mutateAsync(d))}>
        {route && <Flow title={t('sources.overview')} boxes={boxes} />}
        <FormSectionGeneral readOnly />
        <FormPartRoute />
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

type RouteDetailProps = Pick<Props, 'id'> & {
  onDeleteSuccess: () => void;
};
export const RouteDetail = (props: RouteDetailProps) => {
  const { id, onDeleteSuccess } = props;
  const { t } = useTranslation();
  const [readOnly, setReadOnly] = useBoolean(true);

  return (
    <>
      <PageHeader
        title={t('info.edit.title', { name: t('routes.singular') })}
        {...(readOnly && {
          title: t('info.detail.title', { name: t('routes.singular') }),
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
                name={t('routes.singular')}
                target={id}
                api={`${API_ROUTES}/${id}`}
                onSuccess={onDeleteSuccess}
              />
            </Group>
          ),
        })}
      />
      <FormTOCBox>
        <RouteDetailForm
          readOnly={readOnly}
          setReadOnly={setReadOnly}
          id={id}
        />
      </FormTOCBox>
    </>
  );
};

function RouteComponent() {
  const { id } = useParams({ from: '/_authenticated/routes/detail/$id' });
  const navigate = useNavigate();
  return (
    <RouteDetail id={id} onDeleteSuccess={() => navigate({ to: '/routes' })} />
  );
}

export const Route = createFileRoute('/_authenticated/routes/detail/$id')({
  component: RouteComponent,
});