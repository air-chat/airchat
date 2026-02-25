import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import { AuthProvider } from './components/AuthProvider';
import './index.css';
import App from './App.jsx';

const rootElement = document.getElementById('root');

if (rootElement) {
    createRoot(rootElement).render(
      <StrictMode>
        <HashRouter>
          <AuthProvider>
            <App />
          </AuthProvider>
        </HashRouter>
      </StrictMode>,
    );
} else {
    console.error("Помилка: Не знайдено кореневий елемент DOM з ID 'root'. Перевірте public/index.html.");
}