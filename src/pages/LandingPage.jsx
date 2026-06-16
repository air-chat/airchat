import React from 'react';
import './LandingPage.css';

// --- Імпорти картинок ---
import AppLogo from '../assets/icon 5.png'; 
import AppStoreBadge from '../assets/Apple-Logo.png'; 
import GooglePlayBadge from '../assets/Google_Play_2022_icon.svg.png'; 

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
      <main className="hero-section">
        <div className="hero-content fade-in-up">
          <div className="logo-container">
             <img src={AppLogo} alt="Логотип Eurobus Airchat" className="hero-logo" />
          </div>
          <h1 className="app-name">Eurobus Airchat</h1>
          <p className="description">
            Ваш надійний помічник для організації комфортних трансферів. 
            Завантажуйте додаток, обирайте найкращі пропозиції від водіїв та подорожуйте без турбот.
          </p>
          <DownloadBadges />
        </div>
      </main>

      <footer className="footer">
        <p>&copy; {new Date().getFullYear()} Eurobus Airchat. Всі права захищено.</p>
      </footer>
    </div>
  );
};

export default LandingPage;