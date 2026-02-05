// src/pages/SupportPage.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import './PageStyles.css'; // Підключаємо спільні стилі

const SupportPage = () => {
  const navigate = useNavigate(); // Для кнопки "Назад"

  // --- Ваші контакти ---
  const supportEmail = "airchat.app25@gmail.com";
  
  // Тема листа для автоматичного заповнення при кліку
  const deletionSubject = "Delete Account Request";

  return (
    <div className="page-container">
      <h1 className="page-title support-title">Підтримка / Support</h1>
      <p className="page-message support-intro">
        Якщо у вас виникли запитання або проблеми з використанням додатку,
        зв'яжіться з нами.
        <br />
        <span style={{ fontSize: '0.9em', color: '#666' }}>
          For any questions or issues, please contact us.
        </span>
      </p>

      {/* Секція: Електронна пошта */}
      <div className="support-section">
        <span className="support-icon" role="img" aria-label="Email">📧</span>
        <div>
          <h2 className="support-section-title">Контакти (Contact)</h2>
          <p className="support-text">
            Для загальних запитань та технічної підтримки:
          </p>
          <a href={`mailto:${supportEmail}`} className="support-link">
            {supportEmail}
          </a>
        </div>
      </div>

      {/* --- ВАЖЛИВО ДЛЯ GOOGLE PLAY: Секція видалення акаунту --- */}
      <div className="support-section" id="account-deletion" style={{ marginTop: '30px', borderTop: '1px solid #e0e0e0', paddingTop: '20px' }}>
        <span className="support-icon" role="img" aria-label="Delete">🗑️</span>
        <div>
          <h2 className="support-section-title" style={{ color: '#d32f2f' }}>
            Видалення акаунту (Account Deletion)
          </h2>
          
          <p className="support-text">
            <strong>UA:</strong> Якщо ви хочете видалити свій акаунт та всі пов'язані дані (повідомлення, медіа), 
            будь ласка, надішліть запит на нашу пошту. Ми видалимо дані протягом 30 днів.
          </p>
          
          <p className="support-text" style={{ marginTop: '10px' }}>
            <strong>EN:</strong> To request deletion of your account and associated data, 
            please email our support team with the subject "Delete Account". 
            Your data will be permanently deleted within 30 days.
          </p>

          <a 
            href={`mailto:${supportEmail}?subject=${deletionSubject}&body=Please delete my account associated with phone number:`} 
            className="support-link"
            style={{ color: '#d32f2f', fontWeight: 'bold' }}
          >
            Надіслати запит на видалення / Request Deletion
          </a>
        </div>
      </div>

      {/* Кнопка "Назад" */}
      <button onClick={() => navigate(-1)} className="page-button secondary-button back-button">
        ← Назад
      </button>
    </div>
  );
};

export default SupportPage;
