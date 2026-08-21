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
import { useSuspenseQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { getGlobalRuleQueryOptions } from '@/apis/hooks';

import { FormSection } from './FormSection';

const SummaryField = ({
  label,
  children,
}: {
  label: string;
  children?: React.ReactNode;
}) => (
  <div className="flex flex-col gap-1.5">
    <span className="text-xs font-semibold text-gray-500">{label}</span>
    <span className="text-[15px] font-semibold text-gray-800">
      {children === undefined || children === null || children === '' ? (
        <span className="font-normal text-gray-300">-</span>
      ) : (
        children
      )}
    </span>
  </div>
);

/**
 * "Overview" section for Global Rule Detail: registers itself in the
 * TOC sidebar (via the shared FormSection component — any FormSection
 * with a `legend` auto-appears as a scroll-spy entry, same mechanism
 * "General" uses). GlobalRule's schema only has id/plugins/timestamps
 * — no name/desc/status — so the Overview just surfaces the plugin
 * count and names plus the updated time.
 *
 * Styled entirely with Tailwind utility classes (no custom CSS-in-JS)
 * — this project already runs Tailwind app-wide, so these classes
 * are part of the same cascade layer as everything else.
 *
 * Fetches via the same query key as the detail form
 * (getGlobalRuleQueryOptions(id)), so this adds no extra network call.
 */
export const GlobalRuleOverview = ({ id }: { id: string }) => {
  const { t } = useTranslation();
  const { data } = useSuspenseQuery(getGlobalRuleQueryOptions(id));
  const rule = data?.value;

  if (!rule) return null;

  const pluginNames = rule.plugins ? Object.keys(rule.plugins) : [];
  const updatedLabel = rule.update_time
    ? new Date(Number(rule.update_time) * 1000).toLocaleString()
    : undefined;

  return (
    <FormSection legend={t('sources.overview')}>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-x-8 gap-y-4">
        <SummaryField label={`${t('form.plugins.label')} (${pluginNames.length})`}>
          {pluginNames.length > 0 && (
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
          )}
        </SummaryField>
        <SummaryField label={t('form.info.update_time')}>{updatedLabel}</SummaryField>
      </div>
    </FormSection>
  );
};