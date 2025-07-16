import React from 'react';
import { Card, Row, Col, Statistic, Typography } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';

const { Title } = Typography;

const Dashboard: React.FC = () => {
  return (
    <div>
      <Title level={2}>Dashboard Overview</Title>
      <Row gutter={16}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Active Projects"
              value={11.28}
              precision={2}
              valueStyle={{ color: '#3f8600' }}
              prefix={<ArrowUpOutlined />}
              suffix="%"
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Files"
              value={9.3}
              precision={2}
              valueStyle={{ color: '#cf1322' }}
              prefix={<ArrowDownOutlined />}
              suffix="%"
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="Storage Used" value={1128} suffix="MB" />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="Tasks Completed" value={93} suffix="/ 100" />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard; 