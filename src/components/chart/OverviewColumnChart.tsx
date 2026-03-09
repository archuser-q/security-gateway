import { Column } from '@ant-design/charts';
import { config } from './config/columnConfig/overview/column';
import { useChartData } from './config/columnConfig/overview/data';
import { useTranslation } from 'react-i18next';

const OverViewColumnChart = () => {
  const { t } = useTranslation();
  const data = useChartData();

  return (
    <div>
      <h2>{t('form.overview.systemOverView')}</h2>
      <Column {...config} data={data} />
    </div>
  );
};

export default OverViewColumnChart;