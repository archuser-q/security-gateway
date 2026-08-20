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
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  createFileRoute,
  useNavigate,
  useParams,
} from '@tanstack/react-router';
import { useEffect } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useBoolean } from 'react-use';

import { getPluginConfigQueryOptions, getRouteQueryOptions, getServiceQueryOptions, getUpstreamQueryOptions } from '@/apis/hooks';
import { putRouteReq } from '@/apis/routes';
import { getSSLListReq } from '@/apis/ssls';
import { RouteLinkAnchor } from '@/components/Btn';
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
import { FormTOCBox } from '@/components/form-slice/FormSection';
import { FormSectionGeneral } from '@/components/form-slice/FormSectionGeneral';
import { DeleteResourceBtn } from '@/components/page/DeleteResourceBtn';
import PageHeader from '@/components/page/PageHeader';
import { API_ROUTES, PAGE_SIZE_MAX } from '@/config/constant';
import { req } from '@/config/req';
import { type APISIXType } from '@/types/schema/apisix';
import { nodeCount } from '@/utils/upstreamHelpers';

// So khớp Host của Route với SNI của 1 SSL cert - hỗ trợ wildcard 1 cấp
// kiểu "*.docker.localhost" (khớp "a.docker.localhost", KHÔNG khớp
// "a.b.docker.localhost"), đúng quy ước wildcard cert phổ biến. Đây là
// suy luận tự làm phía client (APISIX Route không có field tham chiếu
// thẳng tới SSL), nên chỉ mang tính gợi ý, không thay được cho việc
// APISIX thực sự chọn cert nào lúc bắt tay TLS.
const matchesSni = (host: string, sniPattern: string): boolean => {
  if (!host || !sniPattern) return false;
  if (sniPattern === host) return true;
  if (sniPattern.startsWith('*.')) {
    const suffix = sniPattern.slice(1); // ".docker.localhost"
    if (!host.endsWith(suffix)) return false;
    const prefix = host.slice(0, host.length - suffix.length);
    return prefix.length > 0 && !prefix.includes('.');
  }
  return false;
};

type Props = {
  readOnly: boolean;
  setReadOnly: (v: boolean) => void;
  id: string;
};

const FlowBox = (props: { label: string; children: React.ReactNode }) => (
  <Card withBorder radius="md" p="sm" miw={170}>
    <Text size="xs" c="dimmed" tt="uppercase" mb={4}>
      {props.label}
    </Text>
    {props.children}
  </Card>
);

const FlowArrow = () => (
  <Text size="xl" c="dimmed" px={4} style={{ alignSelf: 'center' }}>
    →
  </Text>
);

// Sơ đồ luồng xử lý Route -> Plugins -> Service -> Upstream, lấy cảm hứng
// từ khối Entrypoints -> Router -> Middlewares -> Service của Traefik.
// Khác với Traefik, mọi box ở đây đều dựng từ dữ liệu APISIX có thật
// (route.plugins, route.service_id, route.upstream/upstream_id, ...),
// không có khái niệm "Entrypoint" vì APISIX không có khái niệm này.
// Box ROUTE gộp luôn Status/Methods/Priority (tránh trùng URI với card
// tóm tắt riêng).
const RouteFlowDiagram = (props: {
  route: APISIXType['Route'] | undefined;
}) => {
  const { t } = useTranslation();
  const route = props.route;
  const serviceId = route?.service_id;

  const serviceQuery = useQuery({
    ...getServiceQueryOptions(serviceId ?? ''),
    enabled: !!serviceId,
  });
  const service = serviceQuery.data?.value;

  // Route ưu tiên upstream của chính nó; nếu route không khai báo thì
  // mới rơi xuống dùng upstream của Service - đúng thứ tự ưu tiên thật
  // của APISIX, không phải suy đoán.
  const routeUpstreamId = !route?.upstream ? route?.upstream_id : undefined;
  const routeUpstreamByIdQuery = useQuery({
    ...getUpstreamQueryOptions(routeUpstreamId ?? ''),
    enabled: !!routeUpstreamId,
  });

  const serviceUpstreamId =
    !route?.upstream && !routeUpstreamId && !service?.upstream
      ? service?.upstream_id
      : undefined;
  const serviceUpstreamByIdQuery = useQuery({
    ...getUpstreamQueryOptions(serviceUpstreamId ?? ''),
    enabled: !!serviceUpstreamId,
  });

  const resolvedUpstream =
    route?.upstream ??
    routeUpstreamByIdQuery.data?.value ??
    service?.upstream ??
    serviceUpstreamByIdQuery.data?.value ??
    null;

  // Chỉ có ID để dẫn link khi upstream đến từ 1 resource Upstream riêng
  // (route_upstream_id hoặc service.upstream_id) - upstream khai INLINE
  // ngay trong route/service thì không có trang chi tiết riêng để trỏ tới.
  const resolvedUpstreamId = routeUpstreamId || serviceUpstreamId || undefined;

  const isUpstreamLoading =
    routeUpstreamByIdQuery.isLoading || serviceUpstreamByIdQuery.isLoading;

  // BUG đã sửa: trước đây chỉ đọc route.plugins (plugin gắn trực tiếp
  // vào route), bỏ sót hoàn toàn trường hợp plugin đến từ 1 Plugin
  // Config được tham chiếu qua route.plugin_config_id - đúng case bạn
  // vừa test (gắn "limit-req-demo" qua Plugin Config ID chứ không gắn
  // plugin trực tiếp), nên trước đó khối Plugins không hiện ra dù đã có.
  // Query này phải đặt TRƯỚC dòng `if (!route) return null` bên dưới,
  // giống mọi useQuery khác trong component - Hook không được gọi có
  // điều kiện, kể cả khi route đang undefined ở lần render đầu.
  const pluginConfigId = route?.plugin_config_id;
  const pluginConfigQuery = useQuery({
    ...getPluginConfigQueryOptions(pluginConfigId ?? ''),
    enabled: !!pluginConfigId,
  });

  if (!route) return null;

  const inlinePluginNames = Object.keys(route.plugins ?? {});
  const referencedPluginNames = Object.keys(pluginConfigQuery.data?.value.plugins ?? {});
  // Service cũng có field plugins riêng (service.plugins), APISIX áp
  // dụng nó cho MỌI route trỏ tới service đó lúc chạy thật - trước đó bỏ
  // sót hoàn toàn nguồn này. Thứ tự merge đúng theo docs chính thức của
  // APISIX: Route > Plugin Config > Service - nếu 1 plugin trùng tên ở
  // nhiều nơi, chỉ nơi ưu tiên cao nhất thực sự chạy. Tách riêng phần
  // "đang hoạt động thật" và "bị ghi đè" để không hiện sai, đồng thời
  // vẫn báo cho người dùng biết vì sao plugin họ đặt trên Service không
  // thấy tác dụng.
  const servicePluginNames = Object.keys(service?.plugins ?? {});
  const activeServicePluginNames = servicePluginNames.filter(
    (n) => !inlinePluginNames.includes(n) && !referencedPluginNames.includes(n)
  );
  const overriddenServicePluginNames = servicePluginNames.filter(
    (n) => inlinePluginNames.includes(n) || referencedPluginNames.includes(n)
  );
  const showPluginsBox =
    inlinePluginNames.length > 0 || !!pluginConfigId || servicePluginNames.length > 0;

  const uriDisplay =
    route.uri || (route.uris?.length ? route.uris.join(', ') : '-');

  return (
    <Card withBorder radius="md" p="md" mb="md">
      <Text size="xs" c="dimmed" mb="sm">
        {t('routeFlow.title')}
      </Text>
      <Group gap={0} wrap="wrap" align="stretch">
        <FlowBox label={t('routes.singular')}>
          <Stack gap={4}>
            <Text fw={600} size="sm" truncate="end" maw={220}>
              {uriDisplay}
            </Text>
            <Group gap={4}>
              {route.status === 0 ? (
                <Badge size="sm" color="gray" variant="light">
                  {t('form.basic.statusOption.0')}
                </Badge>
              ) : (
                <Badge size="sm" color="teal" variant="light">
                  {t('form.basic.statusOption.1')}
                </Badge>
              )}
              {route.methods?.map((m) => (
                <Badge key={m} size="sm" variant="outline">
                  {m}
                </Badge>
              ))}
            </Group>
            <Text size="xs" c="dimmed">
              {t('form.routes.priority')}: {route.priority ?? 0}
            </Text>
          </Stack>
        </FlowBox>

        {showPluginsBox && (
          <>
            <FlowArrow />
            <FlowBox label={t('form.plugins.label')}>
              <Stack gap={4}>
                {inlinePluginNames.length > 0 && (
                  <Group gap={4}>
                    {inlinePluginNames.map((name) => (
                      <Badge key={name} size="sm" variant="outline">
                        {name}
                      </Badge>
                    ))}
                  </Group>
                )}
                {pluginConfigId &&
                  (pluginConfigQuery.isLoading ? (
                    <Skeleton height={20} width={90} />
                  ) : (
                    <>
                      <Group gap={4}>
                        {referencedPluginNames.map((name) => (
                          <Badge key={name} size="sm" variant="outline" color="teal">
                            {name}
                          </Badge>
                        ))}
                      </Group>
                      <Text size="xs" c="dimmed">
                        {t('form.plugins.viaPrefix')}{' '}
                        <RouteLinkAnchor
                          to="/plugin_configs/detail/$id"
                          params={{ id: pluginConfigId }}
                          size="xs"
                        >
                          {pluginConfigQuery.data?.value.name || pluginConfigId}
                        </RouteLinkAnchor>
                      </Text>
                    </>
                  ))}
                {activeServicePluginNames.length > 0 && (
                  <>
                    <Group gap={4}>
                      {activeServicePluginNames.map((name) => (
                        <Badge key={name} size="sm" variant="outline" color="grape">
                          {name}
                        </Badge>
                      ))}
                    </Group>
                    <Text size="xs" c="dimmed">
                      {t('form.plugins.viaPrefix')}{' '}
                      <RouteLinkAnchor
                        to="/services/detail/$id"
                        params={{ id: serviceId ?? '' }}
                        size="xs"
                      >
                        {service?.name || serviceId}
                      </RouteLinkAnchor>
                    </Text>
                  </>
                )}
                {overriddenServicePluginNames.length > 0 && (
                  <Text size="xs" c="orange">
                    {t('routeFlow.overriddenByHigherPriority', {
                      names: overriddenServicePluginNames.join(', '),
                    })}
                  </Text>
                )}
              </Stack>
            </FlowBox>
          </>
        )}

        {serviceId && (
          <>
            <FlowArrow />
            <FlowBox label={t('services.singular')}>
              {serviceQuery.isLoading ? (
                <Skeleton height={20} width={90} />
              ) : (
                <RouteLinkAnchor
                  to="/services/detail/$id"
                  params={{ id: serviceId }}
                  fw={600}
                  size="sm"
                >
                  {service?.name || serviceId}
                </RouteLinkAnchor>
              )}
            </FlowBox>
          </>
        )}

        <FlowArrow />
        <FlowBox label={t('upstreams.singular')}>
          {isUpstreamLoading ? (
            <Skeleton height={20} width={90} />
          ) : resolvedUpstream ? (
            <Stack gap={2}>
              {resolvedUpstreamId ? (
                <RouteLinkAnchor
                  to="/upstreams/detail/$id"
                  params={{ id: resolvedUpstreamId }}
                  fw={600}
                  size="sm"
                >
                  {t('routeFlow.nodeCount', { count: nodeCount(resolvedUpstream.nodes) })}
                </RouteLinkAnchor>
              ) : (
                <Text fw={600} size="sm">
                  {t('routeFlow.nodeCount', { count: nodeCount(resolvedUpstream.nodes) })}
                </Text>
              )}
              <Group gap={4}>
                {resolvedUpstream.type && (
                  <Badge size="sm" variant="outline">
                    {resolvedUpstream.type}
                  </Badge>
                )}
                {resolvedUpstream.scheme && (
                  <Badge size="sm" variant="outline" color="grape">
                    {resolvedUpstream.scheme}
                  </Badge>
                )}
              </Group>
            </Stack>
          ) : (
            <Text size="sm" c="dimmed">
              {t('routeFlow.notConfigured')}
            </Text>
          )}
        </FlowBox>
      </Group>
    </Card>
  );
};

// Route và SSL trong APISIX tách rời hoàn toàn - không có field tham
// chiếu trực tiếp, chỉ khớp ngầm lúc runtime qua Host/SNI. Traefik
// không hiện cert cụ thể ở Router detail (chỉ hiện tên TLS Options +
// Passthrough, khác khái niệm) vì kiến trúc của nó không cần - nhưng
// APISIX thì đáng thêm: dễ xảy ra tình huống khai Host cho Route nhưng
// quên tạo SSL khớp domain, TLS lỗi khi chạy thật mà dashboard không
// cảnh báo gì trước. Khối này CHỈ mang tính gợi ý (so khớp phía client),
// không phải xác nhận chính thức - luôn kèm dòng disclaimer.
const RouteTlsSection = ({ route }: { route: APISIXType['Route'] | undefined }) => {
  const { t } = useTranslation();
  const hosts = route?.host ? [route.host] : (route?.hosts ?? []);

  const sslListQuery = useQuery({
    queryKey: ['route_tls_ssl_scan'],
    queryFn: () => getSSLListReq(req, { page: 1, page_size: PAGE_SIZE_MAX }),
    enabled: hosts.length > 0,
  });

  if (hosts.length === 0) {
    return null;
  }

  const matches = hosts.map((host) => {
    const cert = (sslListQuery.data?.list ?? []).find((item) => {
      const candidates = [item.value.sni, ...(item.value.snis ?? [])].filter(
        (v): v is string => !!v
      );
      return candidates.some((sni) => matchesSni(host, sni));
    });
    return { host, cert };
  });

  return (
    <Card withBorder radius="md" p="md" mb="md">
      <Text fw={600} size="sm" mb="xs">
        {t('routeFlow.tlsTitle')}
      </Text>
      {sslListQuery.isLoading ? (
        <Skeleton height={24} />
      ) : (
        <Stack gap={6}>
          {matches.map(({ host, cert }) => (
            <Group key={host} justify="space-between" wrap="nowrap" gap="md">
              <Text size="sm" ff="monospace">
                {host}
              </Text>
              {cert ? (
                <RouteLinkAnchor
                  to="/ssls/detail/$id"
                  params={{ id: cert.value.id }}
                  size="sm"
                >
                  {cert.value.sni || cert.value.id}
                </RouteLinkAnchor>
              ) : (
                <Badge color="orange" variant="light" size="sm">
                  {t('routeFlow.noMatchingSsl')}
                </Badge>
              )}
            </Group>
          ))}
        </Stack>
      )}
      <Text size="xs" c="dimmed" mt="sm">
        {t('routeFlow.tlsDisclaimer')}
      </Text>
    </Card>
  );
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

  return (
    <>
      <RouteFlowDiagram route={routeData?.value} />
      <RouteTlsSection route={routeData?.value} />
      <FormProvider {...form}>
        <form onSubmit={form.handleSubmit((d) => putRoute.mutateAsync(d))}>
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
    </>
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
