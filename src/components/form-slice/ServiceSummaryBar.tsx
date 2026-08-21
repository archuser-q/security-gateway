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
import { useTranslation } from 'react-i18next';

import { getServiceQueryOptions, getUpstreamQueryOptions } from '@/apis/hooks';

import { FormSection } from './FormSection';

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

/**
 * Card-style summary field: small gray label above, bold black value
 * below. Matches the "ID / Name / Plugins" field style from the
 * Plugin Config Detail reference design — label-above-value.
 */
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

/** key/value row for the Upstream info card — matches the LIMIT-REQ plugin card style (key left, value right). */
const InfoRow = ({ label, value }: { label: string; value?: React.ReactNode }) => (
  <div className="flex justify-between border-b border-gray-100 py-2 last:border-b-0">
    <span className="text-[13.5px] text-gray-500">{label}</span>
    <span className="text-[13.5px] font-semibold text-gray-800">
      {value === undefined || value === null || value === '' ? (
        <span className="font-normal text-gray-300">-</span>
      ) : (
        value
      )}
    </span>
  </div>
);

/**
 * "Overview" section: registers itself in the TOC sidebar (via the
 * shared FormSection component — any FormSection with a `legend`
 * auto-appears as a scroll-spy entry, same mechanism "General" /
 * "Basic Information" use). Shows the Status/Type/Scheme/Pass Host
 * summary plus an "Upstream" info card (key/value, LIMIT-REQ-card
 * style) describing the upstream this service connects to.
 *
 * Styled entirely with Tailwind utility classes (no custom CSS-in-JS
 * / `!important`) — this project already runs Tailwind app-wide, so
 * these classes are part of the same cascade layer as everything
 * else, with no reset-vs-inline-style conflict to fight.
 *
 * Fetches via the same query key as the form (getServiceQueryOptions
 * (id)), so this adds no extra network call for the service itself.
 * If the service references its upstream by `upstream_id` (a separate
 * Upstream resource) rather than embedding it inline, these fields
 * live on that Upstream, not on the Service — so this fetches the
 * referenced Upstream too (only when there's no inline upstream) to
 * fill them correctly instead of showing "-".
 *
 * Deliberately no per-node live health/status: APISIX's node config
 * (host/port/weight) carries no live health field, and this project
 * has no health-check runtime API wired up anywhere — a green check
 * here would be fabricated data, not a real reading. "Health Check"
 * below only reflects whether active/passive checks are *configured*
 * (a real field), not whether nodes are currently up.
 */
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

  return (
    <FormSection legend={t('sources.overview')}>
      <div>
        <div className="mb-5 grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-x-8 gap-y-4">
          <SummaryField label={t('form.basic.status')}>
            <span
              className={`inline-block w-fit rounded-md px-2.5 py-0.5 text-[11.5px] font-bold tracking-wide ${
                isEnabled ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-500'
              }`}
            >
              {isEnabled
                ? t('form.basic.statusOption.1').toUpperCase()
                : t('form.basic.statusOption.0').toUpperCase()}
            </span>
          </SummaryField>
          <SummaryField label={t('form.upstreams.type')}>{upstream?.type}</SummaryField>
          <SummaryField label={t('form.upstreams.scheme')}>{upstream?.scheme}</SummaryField>
          <SummaryField label={t('form.upstreams.passHost')}>
            {upstream?.pass_host}
          </SummaryField>
        </div>

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
            <InfoRow
              label={t('form.upstreams.upstreamId')}
              value={
                upstreamId ? (
                  <Link
                    to="/upstreams/detail/$id"
                    params={{ id: upstreamId }}
                    className="text-teal-600 hover:text-teal-700 hover:underline"
                  >
                    {upstreamId}
                  </Link>
                ) : undefined
              }
            />
            <InfoRow label={t('form.upstreams.upstreamHost')} value={upstream.upstream_host} />
            <InfoRow
              label={`${t('form.upstreams.nodes.title')} (${nodes.length})`}
              value={
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
                ) : undefined
              }
            />
            <InfoRow label={t('form.upstreams.retries')} value={upstream.retries} />
            <InfoRow label={t('form.upstreams.retryTimeout')} value={upstream.retry_timeout} />
            <InfoRow label={t('form.upstreams.timeout.title')} value={timeoutLabel} />
            <InfoRow
              label={t('form.upstreams.checks.title')}
              value={hasHealthCheck ? t('table.enabled') : t('table.disabled')}
            />
          </div>
        )}
      </div>
    </FormSection>
  );
};