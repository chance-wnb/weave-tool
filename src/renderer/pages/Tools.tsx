import React from 'react';
import { Card, Row, Col, Button, Typography } from 'antd';
import { ToolOutlined, CodeOutlined, BugOutlined, SettingOutlined } from '@ant-design/icons';

const { Title, Paragraph } = Typography;

const Tools: React.FC = () => {
  return (
    <div>
      <Title level={2}>Tools & Utilities</Title>
      <Row gutter={[16, 16]}>
        <Col span={12}>
          <Card
            title="Code Generator"
            extra={<Button type="primary" icon={<CodeOutlined />}>Open</Button>}
          >
            <Paragraph>
              Generate boilerplate code for common patterns and structures.
            </Paragraph>
          </Card>
        </Col>
        <Col span={12}>
          <Card
            title="Debug Console"
            extra={<Button type="primary" icon={<BugOutlined />}>Open</Button>}
          >
            <Paragraph>
              Access debugging tools and console for troubleshooting.
            </Paragraph>
          </Card>
        </Col>
        <Col span={12}>
          <Card
            title="System Monitor"
            extra={<Button type="primary" icon={<ToolOutlined />}>Open</Button>}
          >
            <Paragraph>
              Monitor system resources and application performance.
            </Paragraph>
          </Card>
        </Col>
        <Col span={12}>
          <Card
            title="Configuration Manager"
            extra={<Button type="primary" icon={<SettingOutlined />}>Open</Button>}
          >
            <Paragraph>
              Manage application configurations and environment settings.
            </Paragraph>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Tools; 