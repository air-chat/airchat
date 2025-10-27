// src/pages/RegistrationSuccessPage.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import './PageStyles.css'; // Підключаємо спільні стилі
import AppLogo from '../assets/icon 5.png'; // ⚠️ Замініть на ваш шлях до логотипа

const RegistrationSuccessPage = () => {
  return (
    <div className="page-container centered-content">
      <img style={{width: 200,}} src={AppLogo} alt="Logo" className="app-logo" />
      <h1 className="page-title success-title">Реєстрація Успішна!</h1>
      <p className="page-message">
        Дякуємо за реєстрацію! Ваш обліковий запис було успішно створено.
      </p>

    </div>
  );
};

export default RegistrationSuccessPage;