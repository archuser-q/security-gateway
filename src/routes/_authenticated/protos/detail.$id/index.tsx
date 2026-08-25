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

import { getProtoQueryOptions } from '@/apis/hooks';
import { putProtoReq } from '@/apis/protos';
import { FormSubmitBtn } from '@/components/form/Btn';
import { FormPartProto } from '@/components/form-slice/FormPartProto';
import { FormTOCBox } from '@/components/form-slice/FormSection';
import { FormSectionGeneral } from '@/components/form-slice/FormSectionGeneral';
import { Overview } from '@/components/form-slice/Overview';
import { DeleteResourceBtn } from '@/components/page/DeleteResourceBtn';
import PageHeader from '@/components/page/PageHeader';
import { API_PROTOS } from '@/config/constant';
import { req } from '@/config/req';
import { APISIX, type APISIXType } from '@/types/schema/apisix';
import { pipeProduce } from '@/utils/producer';

const parseProto = (content: string) => {
  const syntaxMatch = content.match(/syntax\s*=\s*"([^"]+)"/);
  const packageMatch = content.match(/package\s+([\w.]+)\s*;/);
  const serviceNames = [...content.matchAll(/service\s+(\w+)\s*\{/g)].map((m) => m[1]);
  const messageCount = [...content.matchAll(/message\s+\w+\s*\{/g)].length;
  const rpcCount = [...content.matchAll(/rpc\s+\w+\s*\(/g)].length;
  return { syntax: syntaxMatch?.[1], pkg: packageMatch?.[1], serviceNames, messageCount, rpcCount };
};

type ProtoFormProps = {
  id: string;
  readOnly: boolean;
  setReadOnly: (v: boolean) => void;
};

const ProtoDetailForm = ({ id, readOnly, setReadOnly }: ProtoFormProps) => {
  const { t } = useTranslation();
  const {
    data: protoData,
    isLoading,
    refetch,
  } = useSuspenseQuery(getProtoQueryOptions(id));

  const form = useForm<APISIXType['ProtoPut']>({
    resolver: zodResolver(APISIX.ProtoPut),
    shouldUnregister: true,
    mode: 'all',
    disabled: readOnly,
  });

  const putProto = useMutation({
    mutationFn: (d: APISIXType['ProtoPut']) => putProtoReq(req, pipeProduce()(d)),
    async onSuccess() {
      notifications.show({
        message: t('info.edit.success', { name: t('protos.singular') }),
        color: 'green',
      });
      await refetch();
      setReadOnly(true);
    },
  });

  useEffect(() => {
    if (protoData?.value) {
      form.reset(protoData.value);
    }
  }, [protoData, form]);

  if (isLoading) {
    return <Skeleton height={400} />;
  }

  const proto = protoData?.value;
  const parsed = proto?.content ? parseProto(proto.content) : undefined;

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit((d) => putProto.mutateAsync(d))}>
        {parsed && (
          <Overview
            title={t('sources.overview')}
            fields={[
              { label: 'Syntax', value: parsed.syntax ?? '-', bold: false },
              { label: 'Package', value: parsed.pkg ?? '-' },
              {
                label: `Services (${parsed.serviceNames.length})`,
                bold: false,
                value:
                  parsed.serviceNames.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {parsed.serviceNames.map((name) => (
                        <span
                          key={name}
                          className="inline-block rounded-md bg-indigo-50 px-2.5 py-0.5 font-mono text-[12.5px] font-semibold text-indigo-700"
                        >
                          {name}
                        </span>
                      ))}
                    </div>
                  ) : (
                    '-'
                  ),
              },
              { label: 'Messages', value: parsed.messageCount || '-', bold: false },
              { label: 'RPC Methods', value: parsed.rpcCount || '-', bold: false },
            ]}
          />
        )}
        <FormSectionGeneral readOnly />
        <FormPartProto allowUpload={!readOnly} />
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
  const { id } = useParams({ from: '/_authenticated/protos/detail/$id/' });
  const { t } = useTranslation();
  const [readOnly, setReadOnly] = useBoolean(true);
  const navigate = useNavigate();

  return (
    <>
      <PageHeader
        title={t('info.edit.title', { name: t('protos.singular') })}
        {...(readOnly && {
          title: t('info.detail.title', { name: t('protos.singular') }),
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
                name={t('protos.singular')}
                target={id}
                api={`${API_PROTOS}/${id}`}
                onSuccess={() => navigate({ to: '/protos' })}
              />
            </Group>
          ),
        })}
      />
      <FormTOCBox>
        <ProtoDetailForm
          id={id}
          readOnly={readOnly}
          setReadOnly={setReadOnly}
        />
      </FormTOCBox>
    </>
  );
}

export const Route = createFileRoute('/_authenticated/protos/detail/$id/')({
  component: RouteComponent,
});