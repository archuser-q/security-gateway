import React, { useState, useEffect } from 'react';
import { Flex, Table, Tag } from 'antd';
import type { TableProps } from 'antd';
import { useTranslation } from 'react-i18next';
import axios from 'axios';

interface DataType {
  key: string;
  ip: string;
  timestamp: string;
  tags: string[];
}

type HistoryRecordFormProps = {
  username: string
}

const App: React.FC<HistoryRecordFormProps> = ({username}) => {
  const { t } = useTranslation();
  const [data, setData] = useState<DataType[]>([]);
  const API_URL = import.meta.env.VITE_API_URL;
  
  const columns: TableProps<DataType>['columns'] = [
    {
      title: t('form.admins.ipAddress'),
      dataIndex: 'ip',
      key: 'ip',
    },
    {
      title: t('form.admins.loginTimestamp'),
      dataIndex: 'timestamp',
      key: 'timestamp',
    },
    {
      title: t('form.admins.status'),
      key: 'tags',
      dataIndex: 'tags',
      render: (_, { tags }) => (
        <Flex gap="small" align="center" wrap>
          {tags.map((tag) => {
            const color = tag === 'fail' ? 'red' : 'green';
            return (
              <Tag color={color} key={tag}>
                {tag.toUpperCase()}
              </Tag>
            );
          })}
        </Flex>
      ),
    },
  ];

  useEffect(()=>{
    axios.get(`${API_URL}/login-history`,{
      params: { username }
    })
    .then((response)=>{
      const mapped = response.data.map((item:any)=>({
        ip: item.ip,
        timestamp: new Date(item.timestamp).toLocaleString(),
        tags: [item.status],
        username: item.username
      }));
      setData(mapped);
    })
    .catch(error=>{
      console.error('API Error: ',error.message);
    });
  }, [username, API_URL])

  return <Table<DataType> 
    columns={columns} 
    dataSource={data}
    pagination={{
      pageSize:5
    }}   
  />;
};

export default App;
