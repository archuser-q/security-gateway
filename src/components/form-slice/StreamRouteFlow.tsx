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
import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import {
  IconArrowRight,
  IconExternalLink,
  IconLock,
  IconServer2,
  IconWorld,
} from '@tabler/icons-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { getStreamRouteQueryOptions } from '@/apis/hooks';

import { FormSection } from './FormSection';

const FlowBox = ({ title, children }: { title: string; children: ReactNode }) => (
  <div className="min-w-[220px] flex-1 rounded-xl border border-gray-200 bg-white p-4">
    <div className="mb-3 text-sm font-semibold text-gray-700">{title}</div>
    <div className="space-y-2">{children}</div>
  </div>
);

const FlowRow = ({ label, value }: { label: string; value?: React.ReactNode }) => (
  <div className="flex items-center justify-between gap-3">
    <span className="text-xs font-semibold text-gray-500">{label}</span>
    <span className="text-sm font-semibold text-gray-800">
      {value === undefined || value === null || value === '' ? (
        <span className="font-normal text-gray-300">-</span>
      ) : (
        value
      )}
    </span>
  </div>
);

const FlowArrow = () => (
  <div className="flex shrink-0 items-center justify-center px-1 text-gray-300">
    <IconArrowRight size={20} stroke={1.75} />
  </div>
);

/** A box that's a clickable link to a resource's own detail page. */
const FlowLinkBox = ({
  title,
  icon,
  to,
  id,
  label,
}: {
  title: string;
  icon: ReactNode;
  to: '/services/detail/$id' | '/upstreams/detail/$id';
  id: string;
  label: string;
}) => (
  <FlowBox title={title}>
    <Link
      to={to}
      params={{ id }}
      className="inline-flex items-center gap-2 text-sm font-semibold text-teal-600 hover:text-teal-700 hover:underline"
    >
      {icon}
      {label}
      <IconExternalLink size={12} stroke={2} />
    </Link>
  </FlowBox>
);

export const StreamRouteFlow = ({ id }: { id: string }) => {
  const { t } = useTranslation();
  const { data } = useQuery(getStreamRouteQueryOptions(id));
  const route = data?.value;

  if (!route) return null;

  const { server_addr, server_port, remote_addr, sni, service_id, upstream_id, upstream } =
    route;

  const isUdp = upstream?.scheme === 'udp';

  const hasUpstream = !!upstream_id || !!upstream;

  return (
    <FormSection legend={t('sources.overview')}>
      <div className="flex flex-nowrap items-stretch gap-1 overflow-x-auto pb-1">
        <FlowBox title={t('form.streamRoutes.serverPort')}>
          <span className="font-mono text-lg font-semibold text-gray-800">
            {server_port ? `:${server_port}` : <span className="text-gray-300">-</span>}
          </span>
        </FlowBox>

        <FlowArrow />

        <FlowBox title={isUdp ? 'UDP Router' : 'TCP Router'}>
          <FlowRow label={t('form.streamRoutes.serverAddr')} value={server_addr} />
          <FlowRow label={t('form.streamRoutes.remoteAddr')} value={remote_addr} />
        </FlowBox>

        {service_id && (
          <>
            <FlowArrow />
            <FlowLinkBox
              title={t('form.streamRoutes.server')}
              icon={<IconServer2 size={16} className="text-teal-600" />}
              to="/services/detail/$id"
              id={service_id}
              label={service_id}
            />
          </>
        )}

        {hasUpstream && (
          <>
            <FlowArrow />
            {upstream_id ? (
              <FlowLinkBox
                title={t('form.upstreams.title')}
                icon={<IconWorld size={16} className="text-teal-600" />}
                to="/upstreams/detail/$id"
                id={upstream_id}
                label={upstream_id}
              />
            ) : (
              <FlowBox title={t('form.upstreams.title')}>
                <div className="flex items-center gap-2">
                  <IconWorld size={16} className="text-teal-600" />
                  <span className="text-sm font-semibold text-gray-800">
                    {t('form.upstreams.title')}
                  </span>
                </div>
              </FlowBox>
            )}
          </>
        )}
      </div>

      {!isUdp && (
        <div className="mt-4 rounded-xl border border-gray-200 bg-white p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
            <IconLock size={16} className="text-emerald-600" />
            TLS
          </div>
          {sni ? (
            <FlowRow label={t('form.streamRoutes.sni')} value={sni} />
          ) : (
            <p className="py-2 text-center text-sm text-gray-400">No TLS configured</p>
          )}
        </div>
      )}
    </FormSection>
  );
};