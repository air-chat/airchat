// src/pages/LandingPage.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import './LandingPage.css'; // Підключаємо CSS

// --- Імпорти ---
import AppLogo from '../assets/icon 5.png'; // ⚠️ Замініть на ваш шлях до логотипа
import AppStoreBadge from '../assets/Apple-Logo.png'; // ⚠️ Замініть на ваш шлях
import GooglePlayBadge from '../assets/Google_Play_2022_icon.svg.png'; // ⚠️ Замініть на ваш шлях
import screenshot1 from '../assets/screen_1.png';
import screenshot2 from '../assets/screen_2.png';
import screenshot3 from '../assets/screen_3.png';

const LandingPage = () => {
  // --- Посилання на стори (замініть на реальні) ---
  const appStoreLink = "https://apps.apple.com/your-app-id"; // ⚠️ Вставте посилання
  const googlePlayLink = "https://play.google.com/store/apps/details?id=your.package.name"; // ⚠️ Вставте посилання

  return (
    <div className="landing-page-container">
      {/* --- Секція Hero --- */}
      <header className="hero-section">
        {/* Логотип */}
        <img src={AppLogo} alt="Логотип Додатку" className="hero-logo" />

        <h1 className="app-name">AirChat</h1>
        <p className="tagline">
          Ваш надійний помічник для трансферів.
        </p>
        <p className="description">
          Легко створюйте запити на трансфер, отримуйте пропозиції від водіїв та керуйте своїми поїздками — все в одному зручному додатку.
        </p>

        {/* Кнопки завантаження */}
        <div className="store-buttons">
          <a href={appStoreLink} target="_blank" rel="noopener noreferrer">
            <img src={AppStoreBadge} alt="Download on the App Store" className="store-badge" />
          </a>
          <a href={googlePlayLink} target="_blank" rel="noopener noreferrer">
            <img src={GooglePlayBadge} alt="Get it on Google Play" className="store-badge" />
          </a>
        </div>
         {/* Прибрано кнопку "Перейти до панелі" */}
      </header>

      {/* --- Секція Функцій --- */}
      <section className="features-section">
        <h2 className="section-title">Основні можливості</h2>
        <div className="features-grid">
          <div className="feature-item">
            <span className="feature-icon">🚀</span>
            <h3 className="feature-title">Швидкі Запити</h3>
            <p className="feature-description">Створюйте запити на трансфер за лічені хвилини, вказавши всі необхідні деталі.</p>
          </div>
          <div className="feature-item">
            <span className="feature-icon">📊</span>
            <h3 className="feature-title">Вибір Водія</h3>
            <p className="feature-description">Порівнюйте пропозиції, ціни та профілі водіїв перед тим, як зробити вибір.</p>
          </div>
          <div className="feature-item">
            <span className="feature-icon">💬</span> {/* Нова іконка */}
            <h3 className="feature-title">Прямий Чат</h3>
            <p className="feature-description">Спілкуйтеся з обраним водієм напряму через вбудований чат для уточнення деталей.</p>
          </div>
        </div>
      </section>

      {/* --- Секція Скріншотів --- */}
      <section className="screenshots-section">
        <h2 className="section-title">Як це виглядає</h2>
        <div className="screenshots-grid">
         <img src={screenshot1} alt="Скріншот додатку 1" className="screenshot-image" />
         <img src={screenshot2} alt="Скріншот додатку 2" className="screenshot-image" />
         <img src={screenshot3} alt="Скріншот додатку 3" className="screenshot-image" />
        </div>
      </section>

      {/* --- Секція Call to Action (Повтор) --- */}
      <section className="cta-section">
        <h2 className="section-title">Готові почати користуватись?</h2>
         {/* Кнопки завантаження (повторно) */}
        <div className="store-buttons">
          <a href={appStoreLink} target="_blank" rel="noopener noreferrer">
            <img src={AppStoreBadge} alt="Download on the App Store" className="store-badge" />
          </a>
          <a href={googlePlayLink} target="_blank" rel="noopener noreferrer">
            <img src={GooglePlayBadge} alt="Get it on Google Play" className="store-badge" />
          </a>
        </div>
       
      </section>

      {/* --- Футер --- */}
      <footer className="footer">
        <p>&copy; {new Date().getFullYear()} Назва Вашої Компанії/Проєкту. Усі права захищено.</p>
        {/* Можна додати посилання на політику конфіденційності тощо */}
      </footer>
    </div>
  );
};

export default LandingPage;