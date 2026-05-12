// Popup entry — mounts <App/> into the popup window.
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import '../styles/styles.css';

document.body.classList.add('vm-popup');

const el = document.getElementById('root');
if (el) {
  createRoot(el).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
