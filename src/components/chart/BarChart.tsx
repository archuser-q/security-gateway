import { Column } from '@ant-design/charts';
import { config } from './config/barConfig/column';
import { useChartData } from './config/barConfig/data';
import { useTranslation } from 'react-i18next';

const BarChart = () => {
  const { t } = useTranslation();
  const data = useChartData();

  return (
    <div>
      <h2>{t('form.overview.systemOverView')}</h2>
      <Column {...config} data={data} />
    </div>
  );
};

export default BarChart;