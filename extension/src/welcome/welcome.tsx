// Welcome entry — mounts <WelcomePage/> into the welcome tab.
import React from 'react';
import { createRoot } from 'react-dom/client';
import WelcomePage from './WelcomePage';
import '../styles/styles.css';

document.body.classList.add('vm-page');

const el = document.getElementById('root');
if (el) {
  createRoot(el).render(
    <React.StrictMode>
      <WelcomePage />
    </React.StrictMode>
  );
}
