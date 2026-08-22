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
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { getProtoQueryOptions } from '@/apis/hooks';

import { FormSection } from './FormSection';
import { SummaryField, SummaryGrid } from './OverviewField';

type Field = { label: string; value: ReactNode };

const parseProto = (content: string) => {
  const syntaxMatch = content.match(/syntax\s*=\s*"([^"]+)"/);
  const packageMatch = content.match(/package\s+([\w.]+)\s*;/);
  const serviceNames = [...content.matchAll(/service\s+(\w+)\s*\{/g)].map((m) => m[1]);
  const messageCount = [...content.matchAll(/message\s+\w+\s*\{/g)].length;
  const rpcCount = [...content.matchAll(/rpc\s+\w+\s*\(/g)].length;

  return {
    syntax: syntaxMatch?.[1],
    pkg: packageMatch?.[1],
    serviceNames,
    messageCount,
    rpcCount,
  };
};

export const ProtoOverview = ({ id }: { id: string }) => {
  const { t } = useTranslation();
  const { data } = useSuspenseQuery(getProtoQueryOptions(id));
  const proto = data?.value;

  if (!proto?.content) return null;

  const { syntax, pkg, serviceNames, messageCount, rpcCount } = parseProto(proto.content);
  const updatedLabel = proto.update_time
    ? new Date(Number(proto.update_time) * 1000).toLocaleString()
    : undefined;

  const fields: Field[] = [
    { label: 'Syntax', value: syntax },
    { label: 'Package', value: pkg },
    {
      label: `Services (${serviceNames.length})`,
      value:
        serviceNames.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {serviceNames.map((name) => (
              <span
                key={name}
                className="inline-block rounded-md bg-indigo-50 px-2.5 py-0.5 font-mono text-[12.5px] font-semibold text-indigo-700"
              >
                {name}
              </span>
            ))}
          </div>
        ) : undefined,
    },
    { label: 'Messages', value: messageCount || undefined },
    { label: 'RPC Methods', value: rpcCount || undefined },
    { label: t('form.info.update_time'), value: updatedLabel },
  ];

  return (
    <FormSection legend={t('sources.overview')}>
      <SummaryGrid>
        {fields.map((f) => (
          <SummaryField key={f.label} label={f.label}>
            {f.value}
          </SummaryField>
        ))}
      </SummaryGrid>
    </FormSection>
  );
};