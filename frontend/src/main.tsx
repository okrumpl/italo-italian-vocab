import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import { initDatabase } from './services/db';

const init = async () => {
  try {
    await initDatabase();
  } catch (err) {
    console.error('Failed to init SQLite:', err);
  }
  
  const rootElement = document.getElementById('root');
  if (rootElement) {
    createRoot(rootElement).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>,
    );
  }
};

init();
