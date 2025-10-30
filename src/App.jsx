// /src/App.jsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './components/AuthProvider';

// Імпорт компонентів захисту та лейауту
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout'; // Лейаут для адмін-панелі

// Імпорт сторінок
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import UsersListPage from './pages/UsersListPage';
import TransfersListPage from './pages/TransfersListPage';
import TransferDetailPage from './pages/TransferDetailPage';
import NotificationsPage from './pages/NotificationsPage';
import SettingsPage from './pages/SettingsPage';
import AdminOffersPage from './pages/AdminOffersPage';
import AdminChatsListPage from './pages/AdminChatsListPage';
import AdminIndividualChatPage from './pages/AdminIndividualChatPage';

// Імпорт нових публічних сторінок
import LandingPage from './pages/LandingPage';
import RegistrationSuccessPage from './pages/RegistrationSuccessPage'; // Сторінка успішної реєстрації
import SupportPage from './pages/SupportPage'; // Сторінка підтримки
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
function App() {
  const { loading, session } = useAuth(); // Отримуємо стан завантаження та сесію

  // Показуємо індикатор, поки AuthProvider завантажує дані
  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <p>Завантаження...</p>
      </div>
    );
  }

  return (
    <Routes>
      {/* --- Публічні Маршрути --- */}
      {/* Доступні всім користувачам, незалежно від статусу входу */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/registration-success" element={<RegistrationSuccessPage />} />
      <Route path="/support" element={<SupportPage />} />

    <Route path="/privacy" element={<PrivacyPolicyPage />} />

      {/* --- Захищені Маршрути для Чатів (поза Layout) --- */}
      {/* Ці маршрути вимагають входу в систему та ролі адміна, але не використовують бічну панель Layout */}
      <Route
        path="/chats"
        element={
          <ProtectedRoute> {/* Перевірка автентифікації та ролі */}
            <AdminChatsListPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/chats/:roomId"
        element={
          <ProtectedRoute> {/* Перевірка автентифікації та ролі */}
            <AdminIndividualChatPage />
          </ProtectedRoute>
        }
      />

      {/* --- Захищені Маршрути Адмін-панелі (всередині Layout) --- */}
      {/* Ці маршрути вимагають входу та ролі адміна І відображаються всередині Layout з бічною панеллю */}
      <Route path="/admin" element={ <ProtectedRoute><Layout /></ProtectedRoute> }>
        {/* Головна сторінка адмінки - перенаправлення на дашборд */}
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        {/* Вкладені маршрути адмін-панелі */}
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="users" element={<UsersListPage />} />
        <Route path="transfers" element={<TransfersListPage />} />
        <Route path="transfers/:transferId" element={<TransferDetailPage />} />
        <Route path="my-offers" element={<AdminOffersPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="settings" element={<SettingsPage />} />
         {/* Додайте сюди інші сторінки адмін-панелі, якщо потрібно */}
      </Route>

      {/* --- Маршрут для Неіснуючих Шляхів --- */}
      {/* Якщо користувач вводить адресу, яка не відповідає жодному маршруту вище,
          його перенаправляє на головну сторінку (лендінг) */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;