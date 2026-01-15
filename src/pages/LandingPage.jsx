import React from 'react';
import './LandingPage.css';

// --- Імпорти картинок ---
import AppLogo from '../assets/icon 5.png'; 
import AppStoreBadge from '../assets/Apple-Logo.png'; 
import GooglePlayBadge from '../assets/Google_Play_2022_icon.svg.png'; 
import screenshot1 from '../assets/Screenshot 01 1.png';
import screenshot2 from '../assets/Screenshot 02.png';
import screenshot3 from '../assets/Screenshot 04.png';
import screenshot4 from '../assets/Screenshot 06.png';

const APP_LINKS = {
  ios: "https://apps.apple.com/ua/app/airchat/id6754097949?l=uk",
  android: "https://play.google.com/store/apps/details?id=app.airchat.mobile"
};

const DownloadBadges = ({ className = "" }) => {
  return (
    <div className={`store-buttons ${className}`}>
      <a href={APP_LINKS.ios} target="_blank" rel="noopener noreferrer" className="store-link">
        <img src={AppStoreBadge} alt="Download on the App Store" className="store-badge" />
      </a>
      <a href={APP_LINKS.android} target="_blank" rel="noopener noreferrer" className="store-link">
        <img src={GooglePlayBadge} alt="Get it on Google Play" className="store-badge" />
      </a>
    </div>
  );
};

const LandingPage = () => {
  return (
    <div className="landing-page-container">
      {/* --- Секція Hero --- */}
      <header className="hero-section">
        <div className="hero-content fade-in-up">
          <div className="logo-container">
             <img src={AppLogo} alt="Логотип AirChat" className="hero-logo" />
          </div>
          <h1 className="app-name">AirChat</h1>
          <p className="tagline">Ваш надійний помічник для трансферів</p>
          <p className="description">
            Легко створюйте запити на трансфер, отримуйте вигідні пропозиції від водіїв та подорожуйте з комфортом.
          </p>
          <DownloadBadges />
        </div>
        
        {/* Декоративний фон (можна прибрати, якщо заважає) */}
        <div className="hero-decoration"></div>
      </header>

      {/* --- Секція Функцій --- */}
      <section className="features-section">
        <div className="container">
          <h2 className="section-title">Чому обирають AirChat?</h2>
          <div className="features-grid">
            <div className="feature-item fade-in-delay-1">
              <div className="feature-icon-wrapper">
                <span className="feature-icon">🚀</span>
              </div>
              <h3 className="feature-title">Швидкі запити в аеропорт</h3>
              <p className="feature-description">Створюйте запит на трансфер з або до аеропорту за кілька хвилин, вказавши рейс, час і адресу.</p>
            </div>
            <div className="feature-item fade-in-delay-2">
              <div className="feature-icon-wrapper">
                <span className="feature-icon">📊</span>
              </div>
              <h3 className="feature-title">Вибір водія</h3>
              <p className="feature-description">Порівнюйте пропозиції водіїв для трансферу — ціни, рейтинги та умови перед поїздкою.</p>
            </div>
            <div className="feature-item fade-in-delay-3">
              <div className="feature-icon-wrapper">
                <span className="feature-icon">💬</span>
              </div>
              <h3 className="feature-title">Звʼязок без зайвих дзвінків</h3>
              <p className="feature-description">Спілкуйтеся з водієм у чаті: уточніть час прильоту, місце зустрічі або затримку рейсу.</p>
            </div>
          </div>
        </div>
      </section>

      {/* --- Секція Скріншотів --- */}
      <section className="screenshots-section">
        <h2 className="section-title">Інтуїтивно зрозумілий інтерфейс</h2>
        <div className="screenshots-container">
           <div className="screenshot-wrapper"><img src={screenshot1} alt="Головний екран" className="screenshot-image" /></div>
           <div className="screenshot-wrapper active"><img src={screenshot2} alt="Деталі поїздки" className="screenshot-image" /></div>
           <div className="screenshot-wrapper"><img src={screenshot3} alt="Чат" className="screenshot-image" /></div>
            <div className="screenshot-wrapper"><img src={screenshot4} alt="Профіль користувача" className="screenshot-image" /></div>
        </div>
      </section>

      {/* --- Секція CTA --- */}
      <section className="cta-section">
        <div className="cta-content">
            <h2 className="cta-title">Почніть свою подорож сьогодні</h2>
            <p className="cta-subtitle">Завантажуйте AirChat безкоштовно та забудьте про складнощі з пошуком трансферу.</p>
            <DownloadBadges className="cta-badges" />
        </div>
      </section>

      {/* --- Футер --- */}
      <footer className="footer">
        <div className="footer-content">
          <p>&copy; {new Date().getFullYear()} AirChat. Всі права захищено.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;