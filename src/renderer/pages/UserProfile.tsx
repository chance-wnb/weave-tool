import React from 'react';
import { Card, Avatar, Typography, Descriptions, Button, Space } from 'antd';
import { UserOutlined, EditOutlined, LockOutlined } from '@ant-design/icons';

const { Title } = Typography;

const UserProfile: React.FC = () => {
  return (
    <div>
      <Title level={2}>User Profile</Title>
      <Card>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div style={{ textAlign: 'center' }}>
            <Avatar size={100} icon={<UserOutlined />} />
            <Title level={3} style={{ marginTop: 16 }}>John Doe</Title>
          </div>
          
          <Descriptions title="Profile Information" bordered>
            <Descriptions.Item label="Username">johndoe</Descriptions.Item>
            <Descriptions.Item label="Email">john.doe@example.com</Descriptions.Item>
            <Descriptions.Item label="Role">Administrator</Descriptions.Item>
            <Descriptions.Item label="Department">Engineering</Descriptions.Item>
            <Descriptions.Item label="Joined">January 2023</Descriptions.Item>
            <Descriptions.Item label="Last Login">2024-01-15 10:30 AM</Descriptions.Item>
          </Descriptions>
          
          <Space>
            <Button type="primary" icon={<EditOutlined />}>
              Edit Profile
            </Button>
            <Button icon={<LockOutlined />}>
              Change Password
            </Button>
          </Space>
        </Space>
      </Card>
    </div>
  );
};

export default UserProfile; 