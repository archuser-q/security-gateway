import { MindMap, type MindMapOptions } from '@ant-design/graphs';
import useData from './config/mindMapConfig/data';
import { useTranslation } from 'react-i18next';
import PageHeader from '../page/PageHeader';

export default function SystemMindMap() {
  const { t } = useTranslation();
  const data = useData();

  const options: MindMapOptions = {
    autoFit: 'view',
    data,
    edge: {
      style: {
        endArrow: true,
      },
    },
    animation: false,
    labelField: (d: any) => d.label
  };

  return (
    <>
      <PageHeader title={t('form.overview.title')}/>
      <MindMap {...options} />
    </>
  );
}
