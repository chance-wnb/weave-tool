import React, { useState } from 'react';
import {
  Layout,
  Menu,
  theme,
  Typography,
} from 'antd';
import {
  DashboardOutlined,
  SettingOutlined,
  FileTextOutlined,
  UserOutlined,
  ToolOutlined,
} from '@ant-design/icons';

// Import page components
import Dashboard from './pages/Dashboard';
import FileManager from './pages/FileManager';
import Settings from './pages/Settings';
import UserProfile from './pages/UserProfile';
import Tools from './pages/Tools';

const { Header, Sider, Content } = Layout;
const { Title } = Typography;

interface MenuItem {
  key: string;
  icon: React.ReactNode;
  label: string;
  component: React.ReactNode;
}

const menuItems: MenuItem[] = [
  {
    key: 'dashboard',
    icon: <DashboardOutlined />,
    label: 'Dashboard',
    component: <Dashboard />,
  },
  {
    key: 'files',
    icon: <FileTextOutlined />,
    label: 'File Manager',
    component: <FileManager />,
  },
  {
    key: 'tools',
    icon: <ToolOutlined />,
    label: 'Tools',
    component: <Tools />,
  },
  {
    key: 'profile',
    icon: <UserOutlined />,
    label: 'Profile',
    component: <UserProfile />,
  },
  {
    key: 'settings',
    icon: <SettingOutlined />,
    label: 'Settings',
    component: <Settings />,
  },
];

const App: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [selectedKey, setSelectedKey] = useState('dashboard');
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const currentComponent = menuItems.find(item => item.key === selectedKey)?.component;

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider 
        collapsible 
        collapsed={collapsed} 
        onCollapse={setCollapsed}
        style={{
          background: colorBgContainer,
        }}
      >
        <div style={{ 
          height: 32, 
          margin: 16, 
          background: 'rgba(255, 255, 255, 0.2)',
          borderRadius: borderRadiusLG,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontWeight: 'bold',
        }}>
          {collapsed ? 'W' : 'Weave Tool'}
        </div>
        <Menu
          theme="dark"
          selectedKeys={[selectedKey]}
          mode="inline"
          items={menuItems.map(item => ({
            key: item.key,
            icon: item.icon,
            label: item.label,
          }))}
          onClick={({ key }) => setSelectedKey(key)}
        />
      </Sider>
      <Layout>
        <Header style={{ 
          padding: '0 24px', 
          background: colorBgContainer,
          display: 'flex',
          alignItems: 'center',
        }}>
          <Title level={3} style={{ margin: 0 }}>
            {menuItems.find(item => item.key === selectedKey)?.label}
          </Title>
        </Header>
        <Content
          style={{
            margin: '24px 16px',
            padding: 24,
            minHeight: 280,
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
          }}
        >
          {currentComponent}
        </Content>
      </Layout>
    </Layout>
  );
};

export default App; 