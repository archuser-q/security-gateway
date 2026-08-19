import { FlowGraph, type FlowGraphOptions } from '@ant-design/graphs';
import useData from './config/mindMapConfig/data';
import PageHeader from '../page/PageHeader';
import { useTranslation } from 'react-i18next';
import type { NodeValue } from '@/types/chart/graphNode';

const colorMap: Record<string, string> = {
  'Sub-Host':  '#1677ff',
  'Host':     '#1d5aaf',
  'Consumer': '#52c41a',
  'Service':  '#fa8c16',
  'Upstream': '#722ed1',
}

export default () => {
  const data = useData();
  const { t } = useTranslation();

  const isEmpty = !data.nodes.length && !data.edges.length;

  const options: FlowGraphOptions = {
    autoFit: 'view',
    data,
    node: {
      type: 'html',
      style: (d: any) => {
        const value = d.value as NodeValue
        const nodeType = value?.items?.[0]?.text
        const color = colorMap[nodeType] ?? '#13c2c2'
        const title = value?.title ?? d.id ?? ''

        return {
          innerHTML: `
            <div style="
              background: ${color};
              color: #fff;
              border-radius: 8px;
              padding: 6px 16px;
              font-size: 13px;
              font-weight: 500;
              white-space: nowrap;
              text-align: center;
            ">${title}</div>
          `,
        }
      },
    } as any,
  }

  return (
    <div>
      <PageHeader title={t('form.overview.title')} />
      <div style={{ width: '100%', height: '600px' }}>
        {isEmpty ? (
          <div>Loading...</div>
        ) : (
          <FlowGraph key={JSON.stringify(data.nodes.map(n => n.id))} {...options} />
        )}
      </div>
    </div>
  );
};