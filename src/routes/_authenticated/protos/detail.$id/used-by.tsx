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
import { createFileRoute, Link, useParams } from '@tanstack/react-router';
import { IconExternalLink } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';

import { getRouteListQueryOptions, getServiceListQueryOptions } from '@/apis/hooks';
import PageHeader from '@/components/page/PageHeader';
import { PAGE_SIZE_MAX } from '@/config/constant';

/** Reads `plugins['grpc-transcode'].proto_id` safely — plugin configs are untyped (arbitrary JSON) in the schema. */
const getGrpcTranscodeProtoId = (plugins: unknown): string | undefined => {
  if (!plugins || typeof plugins !== 'object') return undefined;
  const grpc = (plugins as Record<string, unknown>)['grpc-transcode'];
  if (!grpc || typeof grpc !== 'object') return undefined;
  const protoId = (grpc as Record<string, unknown>).proto_id;
  return typeof protoId === 'string' ? protoId : undefined;
};

function RouteComponent() {
  const { id } = useParams({ from: '/_authenticated/protos/detail/$id/used-by' });
  const { t } = useTranslation();

  const { data: routesData, isLoading: routesLoading } = useQuery(
    getRouteListQueryOptions({ page: 1, page_size: PAGE_SIZE_MAX })
  );
  const { data: servicesData, isLoading: servicesLoading } = useQuery(
    getServiceListQueryOptions({ page: 1, page_size: PAGE_SIZE_MAX })
  );

  const isLoading = routesLoading || servicesLoading;

  const rows = [
    ...(routesData?.list ?? [])
      .filter((r) => getGrpcTranscodeProtoId(r.value.plugins) === id)
      .map((r) => ({
        kind: t('sources.routes'),
        id: r.value.id,
        name: r.value.name,
        to: '/routes/detail/$id' as const,
      })),
    ...(servicesData?.list ?? [])
      .filter((s) => getGrpcTranscodeProtoId(s.value.plugins) === id)
      .map((s) => ({
        kind: t('sources.services'),
        id: s.value.id,
        name: s.value.name,
        to: '/services/detail/$id' as const,
      })),
  ];

  return (
    <>
      <PageHeader title="Used By" />
      <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
        <table className="w-full text-left text-base">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="px-4 py-3 text-sm font-normal text-gray-700">Type</th>
              <th className="px-4 py-3 text-sm font-normal text-gray-700">
                {t('form.basic.name')}
              </th>
              <th className="px-4 py-3 text-sm font-normal text-gray-700">ID</th>
              <th className="px-4 py-3 text-right font-normal text-sm text-gray-700">
                {t('table.actions')}
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-gray-400">
                  {t('common.loading', 'Loading...')}
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-gray-400">
                  {t('common.empty', 'No data')}
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={`${row.kind}-${row.id}`}
                  className="border-b border-gray-50 last:border-b-0 hover:bg-gray-50/60"
                >
                  <td className="px-4 py-3 text-black">{row.kind}</td>
                  <td className="px-4 py-3 font-medium text-black">{row.name || '-'}</td>
                  <td className="px-4 py-3 font-mono text-sm text-black">{row.id}</td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      to={row.to}
                      params={{ id: row.id }}
                      className="inline-flex items-center gap-1 text-sm font-medium text-teal-600 hover:text-teal-700 hover:underline"
                    >
                      {t('form.btn.view')}
                      <IconExternalLink size={12} stroke={2} />
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

export const Route = createFileRoute('/_authenticated/protos/detail/$id/used-by')({
  component: RouteComponent,
});