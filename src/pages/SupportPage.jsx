// src/pages/SupportPage.jsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './PageStyles.css'; // Підключаємо спільні стилі

const SupportPage = () => {
  const navigate = useNavigate(); // Для кнопки "Назад"

  // --- Замініть ці дані на ваші реальні контакти ---
  const supportEmail = "airchat.app25@gmail.com";
  const supportPhone = "+380 XX XXX XX XX"; // Необов'язково
  // const faqLink = "/faq"; // Якщо у вас є сторінка FAQ

  return (
    <div className="page-container">
      <h1 className="page-title support-title">Підтримка та Допомога</h1>
      <p className="page-message support-intro">
        Якщо у вас виникли запитання або проблеми з використанням додатку,
        будь ласка, зв'яжіться з нами одним зі зручних способів:
      </p>

      <div className="support-section">
        <span className="support-icon" role="img" aria-label="Email">📧</span>
        <div>
          <h2 className="support-section-title">Електронна пошта</h2>
          <p className="support-text">
            Найкращий спосіб для детальних запитів. Ми намагаємося відповідати протягом 24 годин.
          </p>
          <a href={`mailto:${supportEmail}`} className="support-link">
            {supportEmail}
          </a>
        </div>
      </div>

      

      {/* Розкоментуйте, якщо у вас є FAQ */}
      {/* {faqLink && (
        <div className="support-section">
          <span className="support-icon" role="img" aria-label="FAQ">❓</span>
          <div>
            <h2 className="support-section-title">Часті Запитання (FAQ)</h2>
            <p className="support-text">
              Можливо, відповідь на ваше запитання вже є тут:
            </p>
            <Link to={faqLink} className="support-link">
              Перейти до FAQ
            </Link>
          </div>
        </div>
      )} */}

      {/* Кнопка "Назад" */}
      <button onClick={() => navigate(-1)} className="page-button secondary-button back-button">
        ← Назад
      </button>
    </div>
  );
};

export default SupportPage;