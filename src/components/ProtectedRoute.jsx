// /src/components/ProtectedRoute.jsx

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthProvider'; // Імпортуємо хук

const ProtectedRoute = ({ children }) => {
  // ✅ ОТРИМУЄМО СТАН ЗАВАНТАЖЕННЯ
  const { user, isAdmin, loading } = useAuth();
  const location = useLocation();

  // ✅ ЧЕКАЄМО ЗАВАНТАЖЕННЯ: Якщо AuthProvider ще завантажує дані...
  if (loading) {
    // ... показуємо індикатор завантаження або просто нічого не рендеримо.
    // Це зупинить перевірку user/isAdmin до готовності даних.
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <p>Перевірка доступу...</p>
      </div>
    ); // Або ваш кастомний компонент завантаження
  }

  // ТЕПЕР ПЕРЕВІРЯЄМО, КОЛИ loading === false:
  // Якщо користувач не увійшов в систему АБО він не є адміном
  if (!user || !isAdmin) {
    // Додаємо лог для діагностики (можна потім видалити)
    console.warn(`ProtectedRoute: Redirecting to /login. Reason: !user (${!user}) || !isAdmin (${!isAdmin})`);
    // Перенаправляємо на сторінку логіну
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Якщо все добре (loading=false, user є, isAdmin=true), показуємо дочірні компоненти
  return children;
};

export default ProtectedRoute;