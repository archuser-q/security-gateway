import { Column } from '@ant-design/charts';
import { config } from './config/barConfig/column';
import { useChartData } from './config/barConfig/data';
import { useTranslation } from 'react-i18next';

const BarChart = () => {
  const { t } = useTranslation();
  const data = useChartData();
  return (
    <div style={{ padding: '24px' }}>
      <h2 style={{ marginBottom: '24px', fontSize: '20px', fontWeight: 600 }}>
        {t('form.overview.systemOverView')}
      </h2>
      <div style={{ height: '400px' }}>
        <Column {...config} data={data}/>
      </div>
    </div>
  );
};

export default BarChart;