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
import { useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { IconExternalLink, IconServer } from '@tabler/icons-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { getServiceQueryOptions, getUpstreamQueryOptions } from '@/apis/hooks';

import { FormSection } from './FormSection';
import { InfoRow, SummaryField, SummaryGrid } from './OverviewField';

type Field = { label: string; value: ReactNode };

/** Normalizes `nodes`, which APISIX accepts either as an array of {host, port, weight} or as a {"host:port": weight} object. */
const normalizeNodes = (nodes: unknown): { host: string; port: number }[] => {
  if (!nodes) return [];
  if (Array.isArray(nodes)) {
    return (nodes as { host: string; port: number }[]).map(({ host, port }) => ({
      host,
      port,
    }));
  }
  return Object.keys(nodes as Record<string, number>).map((key) => {
    const lastColon = key.lastIndexOf(':');
    const host = lastColon >= 0 ? key.slice(0, lastColon) : key;
    const port = lastColon >= 0 ? Number(key.slice(lastColon + 1)) : 0;
    return { host, port };
  });
};

export const ServiceSummaryBar = ({ id }: { id: string }) => {
  const { t } = useTranslation();
  const { data } = useSuspenseQuery(getServiceQueryOptions(id));
  const service = data?.value;

  const upstreamId = service?.upstream_id;
  const { data: referencedUpstream } = useQuery({
    ...getUpstreamQueryOptions(upstreamId as string),
    enabled: !!upstreamId && !service?.upstream,
  });

  if (!service) return null;

  // APISIX: status omitted or 1 => enabled, 0 => explicitly disabled.
  const isEnabled = service.status !== 0;
  // Prefer the inline upstream; fall back to the referenced one fetched above.
  const upstream = service.upstream ?? referencedUpstream?.value;
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

  const summaryFields: Field[] = [
    {
      label: t('form.basic.status'),
      value: (
        <span
          className={`inline-block w-fit rounded-md px-2.5 py-0.5 text-[11.5px] font-bold tracking-wide ${
            isEnabled ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-500'
          }`}
        >
          {isEnabled
            ? t('form.basic.statusOption.1').toUpperCase()
            : t('form.basic.statusOption.0').toUpperCase()}
        </span>
      ),
    },
    { label: t('form.upstreams.type'), value: upstream?.type },
    { label: t('form.upstreams.scheme'), value: upstream?.scheme },
    { label: t('form.upstreams.passHost'), value: upstream?.pass_host },
  ];

  const infoRows: Field[] = [
    {
      label: t('form.upstreams.upstreamId'),
      value: upstreamId ? (
        <Link
          to="/upstreams/detail/$id"
          params={{ id: upstreamId }}
          className="text-teal-600 hover:text-teal-700 hover:underline"
        >
          {upstreamId}
        </Link>
      ) : undefined,
    },
    { label: t('form.upstreams.upstreamHost'), value: upstream?.upstream_host },
    {
      label: `${t('form.upstreams.nodes.title')} (${nodes.length})`,
      value:
        nodes.length > 0 ? (
          <div className="flex flex-col items-end gap-1">
            {nodes.map((n, i) => (
              <span
                key={`${n.host}:${n.port}-${i}`}
                className="font-mono text-[13px] font-semibold text-gray-800"
              >
                {scheme}://{n.host}:{n.port}
              </span>
            ))}
          </div>
        ) : undefined,
    },
    { label: t('form.upstreams.retries'), value: upstream?.retries },
    { label: t('form.upstreams.retryTimeout'), value: upstream?.retry_timeout },
    { label: t('form.upstreams.timeout.title'), value: timeoutLabel },
    {
      label: t('form.upstreams.checks.title'),
      value: hasHealthCheck ? t('table.enabled') : t('table.disabled'),
    },
  ];

  return (
    <FormSection legend={t('sources.overview')}>
      <div>
        <SummaryGrid className="mb-5">
          {summaryFields.map((f) => (
            <SummaryField key={f.label} label={f.label}>
              {f.value}
            </SummaryField>
          ))}
        </SummaryGrid>

        {upstream && (
          <div className="rounded-xl border border-gray-200 bg-white px-5 py-4">
            {upstreamId ? (
              <Link
                to="/upstreams/detail/$id"
                params={{ id: upstreamId }}
                className="mb-3 inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold tracking-wide text-emerald-600 hover:bg-emerald-100"
              >
                <IconServer size={13} stroke={2} />
                {t('form.upstreams.title').toUpperCase()}
                <IconExternalLink size={12} stroke={2} />
              </Link>
            ) : (
              <span className="mb-3 inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold tracking-wide text-emerald-600">
                <IconServer size={13} stroke={2} />
                {t('form.upstreams.title').toUpperCase()}
              </span>
            )}
            {infoRows.map((r) => (
              <InfoRow key={r.label} label={r.label} value={r.value} />
            ))}
          </div>
        )}
      </div>
    </FormSection>
  );
};