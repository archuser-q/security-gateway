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
import { Button, Card, Group, Stack, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useMutation, useSuspenseQuery } from '@tanstack/react-query';
import {
  createFileRoute,
  useNavigate,
  useParams,
} from '@tanstack/react-router';
import { FormProvider, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useBoolean } from 'react-use';

import { getSecretQueryOptions } from '@/apis/hooks';
import { putSecretReq } from '@/apis/secrets';
import { FormSubmitBtn } from '@/components/form/Btn';
import { FormPartSecret } from '@/components/form-slice/FormPartSecret';
import { FormTOCBox } from '@/components/form-slice/FormSection';
import { FormSectionGeneral } from '@/components/form-slice/FormSectionGeneral';
import { DeleteResourceBtn } from '@/components/page/DeleteResourceBtn';
import { MaskedValue } from '@/components/page/MaskedValue';
import PageHeader from '@/components/page/PageHeader';
import { SecretManagerBadge } from '@/components/page/SecretManagerBadge';
import { SecretUsageCheatSheet } from '@/components/page/SecretUsageCheatSheet';
import { API_SECRETS } from '@/config/constant';
import { req } from '@/config/req';
import { APISIX, type APISIXType } from '@/types/schema/apisix';
import { pipeProduce } from '@/utils/producer';

type Props = {
  readOnly: boolean;
  setReadOnly: (v: boolean) => void;
};

/** 1 dòng label/value - cùng mẫu InfoRow đã dùng ở SSL Detail. */
const InfoRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <Group justify="space-between" py={6} wrap="nowrap" gap="md">
    <Text size="sm" c="dimmed" style={{ flexShrink: 0 }}>
      {label}
    </Text>
    <div style={{ textAlign: 'right' }}>{value}</div>
  </Group>
);

// Không có gì từ Traefik để tham khảo (Traefik không quản lý kết nối
// secret-manager qua dashboard). Thiết kế gốc: card tóm tắt hiện đúng
// field theo từng provider (Vault/AWS/GCP), field nhạy cảm (token,
// secret key, private key) mặc định che qua MaskedValue - lẽ thường của
// dữ liệu nhạy cảm chứ không sao chép từ đâu.
const SecretSummaryCard = ({ data }: { data: APISIXType['Secret'] | undefined }) => {
  const { t } = useTranslation();
  if (!data) return null;

  return (
    <Card withBorder radius="md" p="md" mb="md">
      <Group gap="xl" wrap="wrap" mb="sm">
        <Stack gap={2}>
          <Text size="xs" c="dimmed">
            {t('form.secrets.manager')}
          </Text>
          <SecretManagerBadge manager={data.manager} />
        </Stack>
        <Stack gap={2}>
          <Text size="xs" c="dimmed">
            ID
          </Text>
          <Text fw={600} size="sm">
            {data.id}
          </Text>
        </Stack>
      </Group>
      <Stack gap={0}>
        {data.manager === 'vault' && (
          <>
            <InfoRow label={t('form.secrets.vault.uri')} value={data.uri || '-'} />
            <InfoRow label={t('form.secrets.vault.prefix')} value={data.prefix || '-'} />
            <InfoRow
              label={t('form.secrets.vault.token')}
              value={<MaskedValue value={data.token} />}
            />
            {data.namespace && (
              <InfoRow label={t('form.secrets.vault.namespace')} value={data.namespace} />
            )}
          </>
        )}
        {data.manager === 'aws' && (
          <>
            <InfoRow
              label={t('form.secrets.aws.access_key_id')}
              value={<MaskedValue value={data.access_key_id} />}
            />
            <InfoRow
              label={t('form.secrets.aws.secret_access_key')}
              value={<MaskedValue value={data.secret_access_key} />}
            />
            {data.session_token && (
              <InfoRow
                label={t('form.secrets.aws.session_token')}
                value={<MaskedValue value={data.session_token} />}
              />
            )}
            {data.region && (
              <InfoRow label={t('form.secrets.aws.region')} value={data.region} />
            )}
            {data.endpoint_url && (
              <InfoRow label={t('form.secrets.aws.endpoint_url')} value={data.endpoint_url} />
            )}
          </>
        )}
        {data.manager === 'gcp' && (
          <>
            {data.auth_file && (
              <InfoRow label={t('form.secrets.gcp.auth_file')} value={data.auth_file} />
            )}
            {data.auth_config && (
              <>
                <InfoRow
                  label={t('form.secrets.gcp.client_email')}
                  value={data.auth_config.client_email || '-'}
                />
                <InfoRow
                  label={t('form.secrets.gcp.private_key')}
                  value={<MaskedValue value={data.auth_config.private_key} />}
                />
                <InfoRow
                  label={t('form.secrets.gcp.project_id')}
                  value={data.auth_config.project_id || '-'}
                />
              </>
            )}
            {typeof data.ssl_verify === 'boolean' && (
              <InfoRow
                label={t('form.secrets.gcp.ssl_verify')}
                value={data.ssl_verify ? t('table.enabled') : t('table.disabled')}
              />
            )}
          </>
        )}
      </Stack>
    </Card>
  );
};

const SecretDetailForm = (props: Props) => {
  const { readOnly, setReadOnly } = props;
  const { t } = useTranslation();
  const { manager, id } = useParams({
    from: '/_authenticated/secrets/detail/$manager/$id',
  });

  const { data: secretData, refetch } = useSuspenseQuery(
    getSecretQueryOptions({
      id,
      manager: manager as APISIXType['Secret']['manager'],
    })
  );

  const form = useForm<APISIXType['Secret']>({
    resolver: zodResolver(APISIX.Secret),
    defaultValues: secretData.value as APISIXType['Secret'],
    mode: 'all',
    disabled: readOnly,
  });

  const putSecret = useMutation({
    mutationFn: (d: APISIXType['Secret']) =>
      putSecretReq(req, pipeProduce()(d)),
    async onSuccess() {
      notifications.show({
        message: t('info.edit.success', {
          name: t('secrets.singular'),
        }),
        color: 'green',
      });

      await refetch();
      setReadOnly(true);
    },
  });

  return (
    <>
      <SecretSummaryCard data={secretData.value} />
      <SecretUsageCheatSheet manager={secretData.value.manager} id={secretData.value.id} />
      <FormProvider {...form}>
      <form onSubmit={form.handleSubmit((d) => putSecret.mutateAsync(d))}>
        <FormSectionGeneral readOnly />
        <FormPartSecret readOnlyManager />

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
  const { t } = useTranslation();
  const [readOnly, setReadOnly] = useBoolean(true);
  const { manager, id } = useParams({ from: '/_authenticated/secrets/detail/$manager/$id' });
  const navigate = useNavigate();

  return (
    <>
      <PageHeader
        title={t('info.edit.title', { name: t('secrets.singular') })}
        {...(readOnly && {
          title: t('info.detail.title', { name: t('secrets.singular') }),
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
                name={t('secrets.singular')}
                target={id}
                api={`${API_SECRETS}/${manager}/${id}`}
                onSuccess={() => navigate({ to: '/secrets' })}
              />
            </Group>
          ),
        })}
      />
      <FormTOCBox>
        <SecretDetailForm readOnly={readOnly} setReadOnly={setReadOnly} />
      </FormTOCBox>
    </>
  );
}

export const Route = createFileRoute('/_authenticated/secrets/detail/$manager/$id/')({
  component: RouteComponent,
});
