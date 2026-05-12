// Settings entry — mounts <SettingsPage/> into the options tab.
import React from 'react';
import { createRoot } from 'react-dom/client';
import SettingsPage from './SettingsPage';
import '../styles/styles.css';

document.body.classList.add('vm-page');

const el = document.getElementById('root');
if (el) {
  createRoot(el).render(
    <React.StrictMode>
      <SettingsPage />
    </React.StrictMode>
  );
}
