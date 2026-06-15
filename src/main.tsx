import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

const root = createRoot(document.getElementById('root')!);
root.render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Hide splash screen once React has mounted
const splash = document.getElementById('splash');
if (splash) {
  requestAnimationFrame(() => {
    splash.classList.add('hidden');
    setTimeout(() => splash.remove(), 600);
  });
}
