// src/main.jsx (або src/index.jsx)
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// 👇 ЗМІНЕНО: Імпортуємо HashRouter
import { HashRouter } from 'react-router-dom';
import { AuthProvider } from './components/AuthProvider';
import './index.css';
import App from './App.jsx';

const rootElement = document.getElementById('root');

if (rootElement) {
    createRoot(rootElement).render(
      <StrictMode>
        {/* 👇 ЗМІНЕНО: Використовуємо HashRouter */}
        <HashRouter>
          <AuthProvider>
            <App />
          </AuthProvider>
        </HashRouter> {/* 👈 ЗМІНЕНО */}
      </StrictMode>,
    );
} else {
    console.error("Помилка: Не знайдено кореневий елемент DOM з ID 'root'. Перевірте public/index.html.");
}