import { Column } from '@ant-design/charts';
import { config } from './config/columnConfig/overview/column';
import { useChartData } from './config/columnConfig/overview/data';
import { useTranslation } from 'react-i18next';

const OverViewColumnChart = () => {
  const { t } = useTranslation();
  const data = useChartData();

  return (
    <div>
      <h1 className="mb-6 font-semibold">{t('form.overview.systemOverView')}</h1>
      <Column {...config} data={data} />
    </div>
  );
};

export default OverViewColumnChart;