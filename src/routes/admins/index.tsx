import { useAdminList } from '@/apis/hooks';
import { DeleteResourceBtn } from '@/components/page/DeleteResourceBtn';
import { useMemo } from 'react';
import { API_ADMINS } from '@/config/constant';
import type { APISIXType } from '@/types/schema/apisix';
import { PageHeader, ProTable, type ProColumns } from '@ant-design/pro-components';
import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { ToAddPageBtn, ToDetailPageBtn } from '@/components/page/ToAddPageBtn';
import { AntdConfigProvider } from '@/config/antdConfigProvider';

export const Route = createFileRoute('/admins/')({
  component: RouteComponent,
})

function RouteComponent() {
  const { t } = useTranslation();
  const { data,isLoading,refetch,pagination } = useAdminList();

  const columns = useMemo<
    ProColumns<APISIXType['RespAdminList']['data']['list'][number]>[]
  >(() => {
    return [
      {
        dataIndex: ['value', 'id'],
        title: 'ID',
        key: 'id',
        valueType: 'text'
      },
      {
        title: 'Action',
        valueType: 'option',
        key: 'option',
        render: (_, record) => [
          <ToDetailPageBtn
            key="detail"
            to="/admins/detail/$id"
            params={{id: record.value.nationalId}}
          />,
          <DeleteResourceBtn
            key="delete"
            name="Delete"
            target={record.value.nationalId}
            api={`${API_ADMINS}/${record.value.nationalId}`}
            onSuccess={refetch}
          />
        ]
      }
    ];
  }, [t, refetch]);

  return(
    <>
      <PageHeader title='Admin'/>
      <AntdConfigProvider>
        <ProTable
          columns={columns}
          dataSource={data?.list || []}
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
                      label="Title"
                    />
                  )
                }
              ]
            }
          }}
        />
      </AntdConfigProvider>
    </>
  )
}
