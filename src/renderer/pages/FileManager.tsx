import React from 'react';
import { Table, Button, Space, Typography, Tag } from 'antd';
import { DownloadOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';

const { Title } = Typography;

interface FileData {
  key: string;
  name: string;
  size: string;
  type: string;
  modified: string;
}

const columns = [
  {
    title: 'Name',
    dataIndex: 'name',
    key: 'name',
  },
  {
    title: 'Size',
    dataIndex: 'size',
    key: 'size',
  },
  {
    title: 'Type',
    dataIndex: 'type',
    key: 'type',
    render: (type: string) => (
      <Tag color={type === 'folder' ? 'blue' : 'green'}>
        {type.toUpperCase()}
      </Tag>
    ),
  },
  {
    title: 'Modified',
    dataIndex: 'modified',
    key: 'modified',
  },
  {
    title: 'Actions',
    key: 'actions',
    render: () => (
      <Space size="middle">
        <Button type="text" icon={<EyeOutlined />} />
        <Button type="text" icon={<DownloadOutlined />} />
        <Button type="text" danger icon={<DeleteOutlined />} />
      </Space>
    ),
  },
];

const data: FileData[] = [
  {
    key: '1',
    name: 'project-config.json',
    size: '2.4 KB',
    type: 'file',
    modified: '2024-01-15 10:30',
  },
  {
    key: '2',
    name: 'Documents',
    size: '---',
    type: 'folder',
    modified: '2024-01-14 15:45',
  },
  {
    key: '3',
    name: 'app.log',
    size: '156 KB',
    type: 'file',
    modified: '2024-01-15 09:22',
  },
];

const FileManager: React.FC = () => {
  return (
    <div>
      <Title level={2}>File Manager</Title>
      <Table columns={columns} dataSource={data} />
    </div>
  );
};

export default FileManager; 