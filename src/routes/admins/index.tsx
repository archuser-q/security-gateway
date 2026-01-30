import { getAdminListQueryOptions, useAdminList } from '@/apis/hooks';
import { DeleteResourceBtn } from '@/components/page/DeleteResourceBtn';
import { useMemo } from 'react';
import { API_ADMINS } from '@/config/constant';
import type { APISIXType } from '@/types/schema/apisix';
import { ProTable, type ProColumns } from '@ant-design/pro-components';
import PageHeader from '@/components/page/PageHeader';
import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { ToAddPageBtn, ToDetailPageBtn } from '@/components/page/ToAddPageBtn';
import { AntdConfigProvider } from '@/config/antdConfigProvider';
import { pageSearchSchema } from '@/types/schema/pageSearch';
import { queryClient } from '@/config/global';

export const Route = createFileRoute('/admins/')({
  component: RouteComponent,
  validateSearch: pageSearchSchema,
  loaderDeps: ({search}) => search,
  loader: ({deps}) => queryClient.ensureQueryData(getAdminListQueryOptions(deps)),
})

function RouteComponent() {
  const { t } = useTranslation();
  return (
    <>
      <PageHeader title={t('sources.admin')} />
      <AdminList />
    </>
  );
}

function AdminList() {
  const { t } = useTranslation();
  const { data,isLoading,refetch,pagination } = useAdminList();

  const columns = useMemo<
    ProColumns<APISIXType['RespAdminList']['data']['list'][number]>[]
  >(() => {
    return [
      {
        dataIndex: ['value', 'username'],
        title: t('form.consumers.username'),
        key: 'username',
        valueType: 'text'
      },
      {
        dataIndex: ['value', 'description'],
        title: t('form.basic.desc'),
        key: 'desc',
        valueType: 'text',
      },
      {
        dataIndex: ['value', 'update_time'],
        title: t('form.info.update_time'),
        key: 'update_time',
        valueType: 'dateTime',
        sorter: true,
        renderText: (text) => {
          if (!text) return '-';
          return new Date(Number(text) * 1000).toISOString();
        },
      },
      {
        title: t('table.actions'),
        valueType: 'option',
        key: 'option',
        render: (_, record) => [
          <ToDetailPageBtn
            key="detail"
            to="/admins/detail/$id"
            params={{id: record.value.username}}
          />,
          <DeleteResourceBtn
            key="delete"
            name="Delete"
            target={record.value.username}
            api={`${API_ADMINS}/${record.value.username}`}
            onSuccess={refetch}
          />
        ]
      }
    ];
  }, [t, refetch]);

  return(
    <AntdConfigProvider>
      <ProTable
        columns={columns}
        dataSource={data?.list}
        rowKey="id"
        loading={isLoading}
        search={false}
        options={false}
        pagination={pagination}
        cardProps={{ bodyStyle: { padding: 0 } }}
        toolbar={{
          menu:{
            type: 'inline',
            items: [
              {
                key:'add',
                label: (
                  <ToAddPageBtn
                    key='add'
                    to='/admins/add'
                    label={t('info.add.title', {
                      name: t('admins.singular'),
                    })}
                  />
                )
              }
            ]
          }
        }}
      />
    </AntdConfigProvider>
  )
}
