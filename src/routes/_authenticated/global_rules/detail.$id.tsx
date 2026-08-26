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
import { Button, Group } from '@mantine/core';
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

import { putGlobalRuleReq } from '@/apis/global_rules';
import { getGlobalRuleQueryOptions } from '@/apis/hooks';
import { FormSubmitBtn } from '@/components/form/Btn';
import { FormPartGlobalRules } from '@/components/form-slice/FormPartGlobalRules';
import { FormTOCBox } from '@/components/form-slice/FormSection';
import { FormSectionGeneral } from '@/components/form-slice/FormSectionGeneral';
import { Overview } from '@/components/form-slice/Overview';
import { DeleteResourceBtn } from '@/components/page/DeleteResourceBtn';
import PageHeader from '@/components/page/PageHeader';
import { API_GLOBAL_RULES } from '@/config/constant';
import { req } from '@/config/req';
import { APISIX, type APISIXType } from '@/types/schema/apisix';

type Props = {
  readOnly: boolean;
  setReadOnly: (v: boolean) => void;
};
const GlobalRuleDetailForm = (props: Props) => {
  const { readOnly, setReadOnly } = props;
  const { t } = useTranslation();
  const { id } = useParams({ from: '/_authenticated/global_rules/detail/$id' });
  const detailReq = useSuspenseQuery(getGlobalRuleQueryOptions(id));

  const form = useForm({
    resolver: zodResolver(APISIX.GlobalRulePut),
    shouldUnregister: true,
    shouldFocusError: true,
    defaultValues: {},
    mode: 'onChange',
    disabled: readOnly,
  });

  useEffect(() => {
    if (detailReq.data?.value) {
      form.reset(detailReq.data.value);
    }
  }, [detailReq.data, form]);

  const putGlobalRule = useMutation({
    mutationFn: (d: APISIXType['GlobalRulePut']) => putGlobalRuleReq(req, d),
    async onSuccess() {
      notifications.show({
        message: t('info.edit.success', { name: t('globalRules.singular') }),
        color: 'green',
      });
      await detailReq.refetch();
      setReadOnly(true);
    },
  });

  const rule = detailReq.data?.value;
  const pluginNames = rule?.plugins ? Object.keys(rule.plugins) : [];
  const updatedLabel = rule?.update_time
    ? new Date(Number(rule.update_time) * 1000).toLocaleString()
    : '-';

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit((d) => putGlobalRule.mutateAsync(d))}>
        <Overview
          title={t('sources.overview')}
          fields={[
            {
              label: `${t('form.plugins.label')} (${pluginNames.length})`,
              value:
                pluginNames.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {pluginNames.map((name) => (
                      <span
                        key={name}
                        className="inline-block rounded-md bg-orange-50 px-2.5 py-0.5 font-mono text-[12.5px] font-semibold text-orange-700"
                      >
                        {name}
                      </span>
                    ))}
                  </div>
                ) : (
                  '-'
                ),
            },
            { label: t('form.info.update_time'), value: updatedLabel },
          ]}
        />
        <FormSectionGeneral readOnly />
        <FormPartGlobalRules />
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
  const { id } = useParams({ from: '/_authenticated/global_rules/detail/$id' });
  const { t } = useTranslation();
  const [readOnly, setReadOnly] = useBoolean(true);
  const navigate = useNavigate();

  return (
    <>
      <PageHeader
        title={t('info.edit.title', { name: t('globalRules.singular') })}
        {...(readOnly && {
          title: t('info.detail.title', { name: t('globalRules.singular') }),
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
                name={t('globalRules.singular')}
                target={id}
                api={`${API_GLOBAL_RULES}/${id}`}
                onSuccess={() => navigate({ to: '/global_rules' })}
              />
            </Group>
          ),
        })}
      />
      <FormTOCBox>
        <GlobalRuleDetailForm readOnly={readOnly} setReadOnly={setReadOnly} />
      </FormTOCBox>
    </>
  );
}

export const Route = createFileRoute('/_authenticated/global_rules/detail/$id')({
  component: RouteComponent,
});
