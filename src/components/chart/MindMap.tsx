import { MindMap, type MindMapOptions } from '@ant-design/graphs';
import useData from './config/mindMapConfig/data';
import { useTranslation } from 'react-i18next';

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
  };

  return (
    <>
      <h2 className="mb-6 text-[20px] font-semibold">
        {t('form.overview.title')}
      </h2>
      <MindMap {...options} />
    </>
  );
}
