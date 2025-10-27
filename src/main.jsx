import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom'; // Додано для роутингу
import { AuthProvider } from './components/AuthProvider'; // Додано для автентифікації
import './index.css';
import App from './App.jsx';

const rootElement = document.getElementById('root');

if (rootElement) {
    createRoot(rootElement).render(
      <StrictMode>
        {/* BrowserRouter забезпечує навігацію */}
        <BrowserRouter>
          {/* AuthProvider забезпечує контекст автентифікації для всього App */}
          <AuthProvider>
            <App />
          </AuthProvider>
        </BrowserRouter>
      </StrictMode>,
    );
} else {
    console.error("Помилка: Не знайдено кореневий елемент DOM з ID 'root'. Перевірте public/index.html.");
}
