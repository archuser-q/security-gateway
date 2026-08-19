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
import { IconServer } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';

import { getServiceQueryOptions, getUpstreamQueryOptions } from '@/apis/hooks';

import { FormSection } from './FormSection';

/** Counts nodes regardless of whether `nodes` is an array or a {"host:port": weight} object. */
const countNodes = (nodes: unknown): number => {
  if (!nodes) return 0;
  if (Array.isArray(nodes)) return nodes.length;
  return Object.keys(nodes as Record<string, number>).length;
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
  <div className="svc-summary__field">
    <span className="svc-summary__label">{label}</span>
    <span className="svc-summary__value">
      {children === undefined || children === null || children === '' ? (
        <span className="svc-summary__placeholder">-</span>
      ) : (
        children
      )}
    </span>
  </div>
);

/** key/value row for the Upstream info card — matches the LIMIT-REQ plugin card style (key left, value right). */
const InfoRow = ({ label, value }: { label: string; value?: React.ReactNode }) => (
  <div className="svc-info__row">
    <span className="svc-info__key">{label}</span>
    <span className="svc-info__value">
      {value === undefined || value === null || value === '' ? (
        <span className="svc-summary__placeholder">-</span>
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
  const nodeCount = countNodes(upstream?.nodes);
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
      <div className="svc-overview">
        <div className="svc-summary">
          <SummaryField label={t('form.basic.status')}>
            <span className={`svc-pill ${isEnabled ? 'svc-pill--on' : 'svc-pill--off'}`}>
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
          <div className="svc-info">
            <span className="svc-info__badge">
              <IconServer size={13} stroke={2} />
              {t('form.upstreams.title').toUpperCase()}
            </span>
            <InfoRow label={t('form.upstreams.upstreamId')} value={upstreamId} />
            <InfoRow label={t('form.upstreams.upstreamHost')} value={upstream.upstream_host} />
            <InfoRow label={t('form.upstreams.nodes.title')} value={nodeCount} />
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

      <style>{`
        .svc-summary {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 16px 32px;
          margin-bottom: 20px;
        }
        .svc-summary__field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .svc-summary__label {
          font-size: 12px;
          font-weight: 600;
          color: #8c8c8c;
        }
        .svc-summary__value {
          font-size: 15px;
          font-weight: 600;
          color: #262626;
        }
        .svc-summary__placeholder {
          color: #bfbfbf;
          font-weight: 400;
        }
        .svc-pill {
          display: inline-block;
          width: fit-content;
          padding: 3px 10px !important;
          border-radius: 6px !important;
          font-size: 11.5px;
          font-weight: 700;
          letter-spacing: 0.02em;
        }
        .svc-pill--on {
          background: #e6fbf3;
          color: #0f9d6c;
        }
        .svc-pill--off {
          background: #f5f5f5;
          color: #8c8c8c;
        }

        .svc-info {
          background: #fff !important;
          border: 1px solid #e6e8eb !important;
          border-radius: 10px !important;
          padding: 16px 20px !important;
        }
        .svc-info__badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 3px 10px !important;
          border-radius: 6px !important;
          background: #e6fbf3;
          color: #0f9d6c;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.02em;
          margin-bottom: 12px;
        }
        .svc-info__row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0 !important;
          border-bottom: 1px solid #f5f5f5 !important;
        }
        .svc-info__row:last-child {
          border-bottom: none !important;
        }
        .svc-info__key {
          font-size: 13.5px;
          color: #8c8c8c;
        }
        .svc-info__value {
          font-size: 13.5px;
          font-weight: 600;
          color: #262626;
        }
      `}</style>
    </FormSection>
  );
};