import { FlowGraph, type FlowGraphOptions } from '@ant-design/graphs';
import useData from './config/mindMapConfig/data';
import PageHeader from '../page/PageHeader';
import { useTranslation } from 'react-i18next';

interface type {
  title: string
}

export default () => {
  const data = useData();
  const {t} = useTranslation();
  const options: FlowGraphOptions = {
    autoFit: 'view',
    data,
    labelField: (d) => (d.value as type).title,
  };

  return (
      <div>
        <PageHeader title={t('form.overview.title')}/>
        <FlowGraph {...options} />
      </div>
    );
};