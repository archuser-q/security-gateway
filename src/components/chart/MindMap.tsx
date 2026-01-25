import { OrganizationChart, type OrganizationChartOptions } from '@ant-design/graphs';
import useData from './config/mindMapConfig/data';
import { useTranslation } from 'react-i18next';
export default function SystemMindMap() {
  const { t } = useTranslation();
  const data = useData();
  const options: OrganizationChartOptions = {
    autoFit: 'view',
    data,
    labelField: (d:any) => d.value.title,
    node: {
      style: {
        size: [150, 64], 
      },
    },
    edge: {
      style: {
        radius: 16,
        lineWidth: 3,
        endArrow: true,
      },
    },
  };
  return (
    <>
      <h2 className="mb-6 text-[20px] font-semibold">
        {t('form.overview.title')}
      </h2>
      <OrganizationChart {...options} />
    </>
  );
}