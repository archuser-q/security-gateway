import { Column } from '@ant-design/plots';
import { useLoginChartData } from './config/columnConfig/loginCount/data';
import { useTranslation } from 'react-i18next';

export const LoginCountColumnChart = () => {
    const { data, isLoading } = useLoginChartData();
    const {t} = useTranslation();

    const config = {
        xField: 'type',
        yField: 'value',
        tooltip: {
            title: 'type',
            items: [{ channel: 'y', name: t('form.admins.count') }],
        },
        legend: false,
    };
    if (isLoading) return <div>Loading...</div>;
    return (
        <div>
            <h2>{t('form.overview.loginCountOverview')}</h2>
            <Column {...config} data={data}/>
        </div>
    )
};