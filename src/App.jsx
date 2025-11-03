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
import SupportPage from './pages/SupportPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';

// 👇 ДОДАНО: Нові сторінки для Apple
import TermsOfUsePage from './pages/TermsOfUsePage';
import AdminReportsPage from './pages/AdminReportsPage';

function App() {
  const { loading, session } = useAuth();

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
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/registration-success" element={<RegistrationSuccessPage />} />
      <Route path="/support" element={<SupportPage />} />
      <Route path="/privacy" element={<PrivacyPolicyPage />} />

      {/* 👇 ДОДАНО: Маршрут для Умов Користування */}
      <Route path="/terms" element={<TermsOfUsePage />} />

      {/* --- Захищені Маршрути для Чатів (поза Layout) --- */}
      <Route
        path="/chats"
        element={<ProtectedRoute><AdminChatsListPage /></ProtectedRoute>}
      />
      <Route
        path="/chats/:roomId"
        element={<ProtectedRoute><AdminIndividualChatPage /></ProtectedRoute>}
      />

      {/* --- Захищені Маршрути Адмін-панелі (всередині Layout) --- */}
      <Route path="/admin" element={ <ProtectedRoute><Layout /></ProtectedRoute> }>
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="users" element={<UsersListPage />} />
        <Route path="transfers" element={<TransfersListPage />} />
        <Route path="transfers/:transferId" element={<TransferDetailPage />} />
        <Route path="my-offers" element={<AdminOffersPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="settings" element={<SettingsPage />} />

        {/* 👇 ДОДАНО: Маршрут для перегляду скарг адміном */}
        <Route path="reports" element={<AdminReportsPage />} />
      </Route>

      {/* --- Маршрут для Неіснуючих Шляхів --- */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;