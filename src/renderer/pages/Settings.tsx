import React from 'react';
import { Card, Form, Switch, Select, Button, Typography, Divider, InputNumber } from 'antd';

const { Title } = Typography;
const { Option } = Select;

const Settings: React.FC = () => {
  const [form] = Form.useForm();

  const onFinish = (values: any) => {
    console.log('Settings saved:', values);
  };

  return (
    <div>
      <Title level={2}>Application Settings</Title>
      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{
            darkMode: false,
            language: 'en',
            autoSave: true,
            notifications: true,
            autoSaveInterval: 5,
          }}
        >
          <Title level={4}>Appearance</Title>
          <Form.Item name="darkMode" label="Dark Mode" valuePropName="checked">
            <Switch />
          </Form.Item>
          
          <Form.Item name="language" label="Language">
            <Select style={{ width: 200 }}>
              <Option value="en">English</Option>
              <Option value="zh">中文</Option>
              <Option value="es">Español</Option>
              <Option value="fr">Français</Option>
            </Select>
          </Form.Item>

          <Divider />

          <Title level={4}>Preferences</Title>
          <Form.Item name="autoSave" label="Auto Save" valuePropName="checked">
            <Switch />
          </Form.Item>

          <Form.Item name="autoSaveInterval" label="Auto Save Interval (minutes)">
            <InputNumber min={1} max={60} />
          </Form.Item>

          <Form.Item name="notifications" label="Enable Notifications" valuePropName="checked">
            <Switch />
          </Form.Item>

          <Divider />

          <Form.Item>
            <Button type="primary" htmlType="submit">
              Save Settings
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default Settings; 