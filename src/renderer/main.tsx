import React from 'react';
import { createRoot } from 'react-dom/client';
import { ConfigProvider } from 'antd';
import App from './App';
import './styles.css';

const container = document.getElementById('root');
const root = createRoot(container!);

root.render(
  <React.StrictMode>
    <ConfigProvider
      theme={{
        token: {
          // Customize theme if needed
          colorPrimary: '#1890ff',
        },
      }}
    >
      <App />
    </ConfigProvider>
  </React.StrictMode>
); 