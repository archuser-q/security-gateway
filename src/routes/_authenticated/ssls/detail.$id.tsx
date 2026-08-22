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
import { Badge, Button,Card, CopyButton, Divider, Grid, Group, Skeleton, Stack, Text  } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useMutation, useSuspenseQuery } from '@tanstack/react-query';
import {
  createFileRoute,
  useNavigate,
  useParams,
} from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useBoolean } from 'react-use';

import { getSSLQueryOptions } from '@/apis/hooks';
import { putSSLReq } from '@/apis/ssls';
import { FormSubmitBtn } from '@/components/form/Btn';
import { FormPartSSL } from '@/components/form-slice/FormPartSSL';
import {
  produceToSSLForm,
  SSLPutSchema,
  type SSLPutType,
} from '@/components/form-slice/FormPartSSL/schema';
import { FormTOCBox } from '@/components/form-slice/FormSection';
import { FormSectionGeneral } from '@/components/form-slice/FormSectionGeneral';
import { DeleteResourceBtn } from '@/components/page/DeleteResourceBtn';
import PageHeader from '@/components/page/PageHeader';
import { API_SSLS } from '@/config/constant';
import { req } from '@/config/req';
import type { APISIXType } from '@/types/schema/apisix';
import { computeCertFingerprints, parseCertInfo } from '@/utils/certParser';
import { pipeProduce } from '@/utils/producer';

type Props = {
  readOnly: boolean;
  setReadOnly: (v: boolean) => void;
};

const formatDateTime = (d: Date) =>
  `${d.getUTCHours().toString().padStart(2, '0')}:${d.getUTCMinutes().toString().padStart(2, '0')} ${d.getUTCDate()}/${d.getUTCMonth() + 1}/${d.getUTCFullYear()} UTC`;

/** 1 dòng label/value dùng chung cho các khối Issued To/By/Validity/Technical Details, giống bố cục của Traefik. */
const InfoRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <Group justify="space-between" py={6} wrap="nowrap" gap="md">
    <Text size="sm" c="dimmed" style={{ flexShrink: 0 }}>
      {label}
    </Text>
    <Text size="sm" ta="right" style={{ wordBreak: 'break-all' }}>
      {value}
    </Text>
  </Group>
);

const InfoSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <Card withBorder radius="md" p="md" mb="md">
    <Text fw={600} size="sm" mb="xs">
      {title}
    </Text>
    <Divider mb="xs" />
    <Stack gap={0}>{children}</Stack>
  </Card>
);

/** Hex ngắn gọn + nút copy - dùng cho 2 dòng vân tay SHA-256, vì chuỗi hex 64 ký tự khó đọc/khó bấm chọn tay. */
const FingerprintRow = ({ label, value }: { label: string; value: string | null }) => (
  <Group justify="space-between" py={6} wrap="nowrap" gap="md">
    <Text size="sm" c="dimmed" style={{ flexShrink: 0 }}>
      {label}
    </Text>
    <Group gap={4} wrap="nowrap">
      <Text size="sm" ff="monospace" style={{ wordBreak: 'break-all' }}>
        {value ?? '-'}
      </Text>
      {value && (
        <CopyButton value={value}>
          {({ copied, copy }) => (
            <Button size="compact-xs" variant="subtle" onClick={copy}>
              {copied ? '✓' : 'Copy'}
            </Button>
          )}
        </CopyButton>
      )}
    </Group>
  </Group>
);

// Cùng phong cách với Route/Service/Upstream Detail - tóm tắt nhanh
// trước form dài. Dùng lại đúng certParser.ts đã viết cho SSL list,
// không viết lại logic đọc DER lần 2. Bố cục 5 khối (Issued To/Issued
// By/Validity/Technical Details/SHA-256 Fingerprints) phỏng theo đúng
// trang Certificate detail của Traefik.
const SSLSummaryCard = (props: {
  data: APISIXType['SSL'] | undefined;
}) => {
  const { t } = useTranslation();
  const value = props.data;
  const [fingerprints, setFingerprints] = useState<{
    certificate: string;
    publicKey: string;
  } | null>(null);

  useEffect(() => {
    if (!value?.cert) {
      setFingerprints(null);
      return;
    }
    let cancelled = false;
    computeCertFingerprints(value.cert).then((fp) => {
      if (!cancelled) setFingerprints(fp);
    });
    return () => {
      cancelled = true;
    };
  }, [value?.cert]);

  if (!value) return null;

  const certInfo = value.cert ? parseCertInfo(value.cert) : null;
  const sniDisplay =
    value.sni || (value.snis?.length ? value.snis.join(', ') : '-');

  const daysLeft = certInfo
    ? Math.floor(
        (certInfo.notAfter.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      )
    : null;
  const expiryColor =
    daysLeft === null ? 'gray' : daysLeft < 0 ? 'red' : daysLeft <= 30 ? 'orange' : 'green';
  const expiryLabel =
    daysLeft === null
      ? '-'
      : daysLeft < 0
        ? t('certDetail.expired')
        : t('certDetail.daysLeft', { count: daysLeft });

  const keySizeLabel = certInfo?.publicKey.bits ? `${certInfo.publicKey.bits} bits` : '-';

  return (
    <>
      <Card withBorder radius="md" p="md" mb="md">
        <Group gap="xl" wrap="wrap">
          <Stack gap={2}>
            <Text size="xs" c="dimmed">
              {t('certDetail.status')}
            </Text>
            {value.status === 0 ? (
              <Badge color="gray" variant="light">
                {t('table.disabled')}
              </Badge>
            ) : (
              <Badge color="teal" variant="light">
                {t('table.enabled')}
              </Badge>
            )}
          </Stack>
          <Stack gap={2}>
            <Text size="xs" c="dimmed">
              {t('certDetail.type')}
            </Text>
            <Badge color={value.type === 'client' ? 'violet' : 'blue'} variant="light">
              {value.type === 'client' ? t('certDetail.typeClient') : t('certDetail.typeServer')}
            </Badge>
          </Stack>
          <Stack gap={2}>
            <Text size="xs" c="dimmed">
              {t('certDetail.sniMatch')}
            </Text>
            <Text fw={600} size="sm" truncate="end" maw={220}>
              {sniDisplay}
            </Text>
          </Stack>
          <Stack gap={2}>
            <Text size="xs" c="dimmed">
              {t('certDetail.commonNameInCert')}
            </Text>
            <Text fw={600} size="sm">
              {certInfo?.subject.cn ?? '-'}
            </Text>
          </Stack>
          <Stack gap={2}>
            <Text size="xs" c="dimmed">
              {t('certDetail.validUntil')}
            </Text>
            <Text fw={600} size="sm">
              {certInfo
                ? `${certInfo.notAfter.getUTCDate()}/${certInfo.notAfter.getUTCMonth() + 1}/${certInfo.notAfter.getUTCFullYear()}`
                : '-'}
            </Text>
          </Stack>
          <Stack gap={2}>
            <Text size="xs" c="dimmed">
              {t('certDetail.expiry')}
            </Text>
            <Badge color={expiryColor} variant="light">
              {expiryLabel}
            </Badge>
          </Stack>
        </Group>
        {value.type === 'client' && (
          <Text size="xs" c="dimmed" mt="xs">
            {t('certDetail.clientTypeNote')}
          </Text>
        )}
      </Card>

      {certInfo && (
        <Grid mb="md">
          <Grid.Col span={{ base: 12, md: 6 }}>
            <InfoSection title={t('certDetail.issuedTo')}>
              <InfoRow label="Common Name" value={certInfo.subject.cn ?? '-'} />
              <InfoRow
                label="Subject Alternative Names"
                value={certInfo.sans.length ? certInfo.sans.join(', ') : '-'}
              />
              <InfoRow label="Organization" value={certInfo.subject.o ?? '-'} />
              <InfoRow label="Country" value={certInfo.subject.c ?? '-'} />
            </InfoSection>
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <InfoSection title={t('certDetail.issuedBy')}>
              <InfoRow label="Common Name" value={certInfo.issuer.cn ?? '-'} />
              <InfoRow label="Organization" value={certInfo.issuer.o ?? '-'} />
              <InfoRow label="Country" value={certInfo.issuer.c ?? '-'} />
            </InfoSection>
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <InfoSection title={t('certDetail.validity')}>
              <InfoRow label="Valid From" value={formatDateTime(certInfo.notBefore)} />
              <InfoRow label="Valid Until" value={formatDateTime(certInfo.notAfter)} />
              <InfoRow label="Expiry" value={<Badge color={expiryColor} variant="light">{expiryLabel}</Badge>} />
            </InfoSection>
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <InfoSection title={t('certDetail.technicalDetails')}>
              <InfoRow label="Version" value={`v${certInfo.version}`} />
              <InfoRow label="Serial Number" value={certInfo.serialNumberDecimal ?? '-'} />
              <InfoRow label="Key Type" value={certInfo.publicKey.algorithm} />
              <InfoRow label="Key Size" value={keySizeLabel} />
              <InfoRow label="Signature Algorithm" value={certInfo.signatureAlgorithm} />
            </InfoSection>
          </Grid.Col>
          <Grid.Col span={12}>
            <InfoSection title={t('certDetail.fingerprints')}>
              <FingerprintRow label="Certificate" value={fingerprints?.certificate ?? null} />
              <FingerprintRow label="Public Key" value={fingerprints?.publicKey ?? null} />
            </InfoSection>
          </Grid.Col>
          {(value.ssl_protocols?.length || value.client) && (
            <Grid.Col span={12}>
              <InfoSection title={t('certDetail.apisixConfigTitle')}>
                {value.ssl_protocols?.length ? (
                  <InfoRow
                    label={t('certDetail.allowedProtocols')}
                    value={value.ssl_protocols.join(', ')}
                  />
                ) : null}
                {value.client && (
                  <>
                    <InfoRow
                      label={t('certDetail.mtlsCa')}
                      value={value.client.ca ? t('certDetail.mtlsCaSet') : '-'}
                    />
                    {typeof value.client.depth === 'number' && (
                      <InfoRow label={t('certDetail.mtlsDepth')} value={value.client.depth} />
                    )}
                  </>
                )}
              </InfoSection>
            </Grid.Col>
          )}
        </Grid>
      )}
    </>
  );
};

const SSLDetailForm = (props: Props & { id: string }) => {
  const { id, readOnly, setReadOnly } = props;
  const { t } = useTranslation();
  const {
    data: { value: sslData },
    isLoading,
    refetch,
  } = useSuspenseQuery(getSSLQueryOptions(id));

  const form = useForm({
    resolver: zodResolver(SSLPutSchema),
    shouldUnregister: true,
    mode: 'all',
    disabled: readOnly,
  });

  const putSSL = useMutation({
    mutationFn: (d: SSLPutType) => putSSLReq(req, pipeProduce()(d)),
    async onSuccess() {
      notifications.show({
        message: t('info.edit.success', { name: t('ssls.singular') }),
        color: 'green',
      });
      await refetch();
      setReadOnly(true);
    },
  });

  useEffect(() => {
    if (sslData && !isLoading) {
      const base = produceToSSLForm(sslData);
      form.reset(base);
      form.setValue('create_time', sslData.create_time);
      form.setValue('update_time', sslData.update_time);
    }
  }, [sslData, form, isLoading]);

  if (isLoading) {
    return <Skeleton height={400} />;
  }

  return (
    <>
      <SSLSummaryCard data={sslData} />
      <FormTOCBox>
        <FormProvider {...form}>
          <form
            onSubmit={form.handleSubmit((d) =>
              putSSL.mutateAsync(pipeProduce()(d))
            )}
          >
            <FormSectionGeneral readOnly />
            <FormPartSSL />
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
      </FormTOCBox>
    </>
  );
};

function RouteComponent() {
  const { t } = useTranslation();
  const { id } = useParams({ from: '/_authenticated/ssls/detail/$id' });
  const [readOnly, setReadOnly] = useBoolean(true);
  const navigate = useNavigate();

  return (
    <>
      <PageHeader
        title={t('info.edit.title', { name: t('ssls.singular') })}
        {...(readOnly && {
          title: t('info.detail.title', { name: t('ssls.singular') }),
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
                name={t('ssls.singular')}
                target={id}
                api={`${API_SSLS}/${id}`}
                onSuccess={() => navigate({ to: '/ssls' })}
              />
            </Group>
          ),
        })}
      />
      <SSLDetailForm id={id} readOnly={readOnly} setReadOnly={setReadOnly} />
    </>
  );
}

export const Route = createFileRoute('/_authenticated/ssls/detail/$id')({
  component: RouteComponent,
});
