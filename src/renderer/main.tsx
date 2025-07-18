import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { FullscreenProvider } from './contexts/FullscreenContext';
import './styles.css';

const container = document.getElementById('root');
const root = createRoot(container!);

root.render(
  <React.StrictMode>
    <FullscreenProvider>
      <App />
    </FullscreenProvider>
  </React.StrictMode>
); 