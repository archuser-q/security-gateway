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

/**
 * "Overview" section: registers itself in the TOC sidebar (via the
 * shared FormSection component — any FormSection with a `legend`
 * auto-appears as a scroll-spy entry, same mechanism "General" /
 * "Basic Information" use). Shows the Status/Type/Scheme/Pass Host
 * summary plus an "Upstream" info card (key/value, LIMIT-REQ-card
 * style) describing the upstream this service connects to.
 *
 * Both field lists (`summaryFields`, `infoRows`) are plain data —
 * built once per render, then mapped into SummaryField/InfoRow. This
 * replaced writing out each field's JSX by hand, which meant 7 nearly
 * identical <InfoRow label=... value=... /> lines in the Upstream
 * card alone. Reordering, adding, or removing a field is now a
 * one-line array edit instead of a JSX edit.
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
    { label: t('form.upstreams.type'), value: <span className="font-normal">{upstream?.type}</span> },
    { label: t('form.upstreams.scheme'), value: <span className="font-normal">{upstream?.scheme}</span> },
    {
      label: t('form.upstreams.passHost'),
      value: <span className="font-normal">{upstream?.pass_host}</span>,
    },
  ];

  const infoRows: Field[] = [
    {
      label: t('form.upstreams.upstreamId'),
      value: upstreamId ? (
        <Link
          to="/upstreams/detail/$id"
          params={{ id: upstreamId }}
          className="inline-flex items-center gap-1 text-teal-600 hover:text-teal-700 hover:underline"
        >
          {upstreamId}
          <IconExternalLink size={12} stroke={2} />
        </Link>
      ) : undefined,
    },
    {
      label: t('form.upstreams.upstreamHost'),
      value: upstream?.upstream_host ? (
        <span className="font-normal">{upstream.upstream_host}</span>
      ) : undefined,
    },
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
    {
      label: t('form.upstreams.retries'),
      value:
        upstream?.retries !== undefined ? (
          <span className="font-normal">{upstream.retries}</span>
        ) : undefined,
    },
    {
      label: t('form.upstreams.retryTimeout'),
      value:
        upstream?.retry_timeout !== undefined ? (
          <span className="font-normal">{upstream.retry_timeout}</span>
        ) : undefined,
    },
    {
      label: t('form.upstreams.timeout.title'),
      value: timeoutLabel ? <span className="font-normal">{timeoutLabel}</span> : undefined,
    },
    {
      label: t('form.upstreams.checks.title'),
      value: (
        <span className="font-normal">
          {hasHealthCheck ? t('table.enabled') : t('table.disabled')}
        </span>
      ),
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
            {/* Static header badge — the "Upstream ID" row below is the
                only clickable link now, avoiding two controls that both
                navigate to the exact same page. */}
            <span className="mb-3 inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold tracking-wide text-emerald-600">
              <IconServer size={13} stroke={2} />
              {t('form.upstreams.title').toUpperCase()}
            </span>
            {/* Only rows with a real value render — an unconfigured
                optional field (Retries, Timeout, ...) is omitted
                entirely instead of showing a "-" placeholder, so the
                card doesn't fill up with empty rows. Health Checks
                always has a real Enabled/Disabled value, so it never
                gets dropped here. */}
            {infoRows
              .filter((r) => r.value !== undefined && r.value !== null && r.value !== '')
              .map((r) => (
                <InfoRow key={r.label} label={r.label} value={r.value} />
              ))}
          </div>
        )}
      </div>
    </FormSection>
  );
};