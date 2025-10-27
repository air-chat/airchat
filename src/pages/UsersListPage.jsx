import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';

// --- ДОПОМІЖНІ КОМПОНЕНТИ ---
const Avatar = ({ url, name }) => {
  const style = { width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', backgroundColor: '#e9ecef', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#495057', fontWeight: 'bold' };
  const initial = name ? name.trim().charAt(0) : '?';
  return url ? <img src={url} alt={name} style={style} /> : <div style={style}>{initial}</div>;
};

const LoadingIndicator = () => (
    <>
      <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      <div style={styles.loadingOverlay}><div style={styles.spinner}></div></div>
    </>
);

// --- ОСНОВНИЙ КОМПОНЕНТ СТОРІНКИ ---
const UsersListPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterRole, setFilterRole] = useState('all');

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      setError(null);
      try {
        // Крок 1: Отримуємо базові профілі, ІГНОРУЮЧИ АДМІНІВ
        let query = supabase
            .from('profiles')
            .select('id, role')
            .neq('is_admin', true); // Виключаємо адмінів з вибірки

        if (filterRole !== 'all') {
          query = query.eq('role', filterRole);
        }
        
        const { data: profiles, error: profilesError } = await query;
        if (profilesError) throw profilesError;
        if (!profiles || profiles.length === 0) {
          setUsers([]);
          setLoading(false);
          return;
        }

        // ✅ ВИПРАВЛЕНО: Викликаємо правильні, існуючі RPC-функції
        const userDetailPromises = profiles.map(profile => {
          if (profile.role === 'client') {
            return supabase.rpc('get_full_passenger_profile', { p_user_id: profile.id });
          }
          if (profile.role === 'driver') {
            return supabase.rpc('get_full_driver_profile', { p_driver_id: profile.id });
          }
          return null;
        }).filter(Boolean);

        const results = await Promise.all(userDetailPromises);
        
        // Крок 3: Обробляємо результати
        const detailedUsers = results
            .map(res => {
                if (res.error) {
                    console.error("Помилка отримання деталей користувача:", res.error);
                    return null;
                }
                // ✅ ВИПРАВЛЕНО: Адаптуємо дані під єдину структуру
                const userData = res.data;
                return {
                    id: userData.user_id,
                    full_name: userData.full_name,
                    avatar_url: userData.avatar_url,
                    email: userData.email, // Припускаємо, що email є в profiles (потрібно додати до RPC)
                    role: userData.role || (userData.car_make ? 'driver' : 'client'), // Визначаємо роль
                    completed_trips: userData.completed_trips_count,
                    created_at: userData.member_since
                };
            })
            .filter(Boolean);

        detailedUsers.sort((a, b) => (a.full_name || '').localeCompare(b.full_name || ''));
        setUsers(detailedUsers);

      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [filterRole]);
  
  const getRoleStyle = (role) => {
    if (role === 'client') return styles.roleClient;
    if (role === 'driver') return styles.roleDriver;
    if (role === 'admin') return styles.roleAdmin;
    return {};
  };

  if (error) return <div style={{...styles.page, color: 'red'}}>Помилка: {error}</div>;

  return (
    <div style={styles.page}>
      <h1 style={styles.header}>Користувачі</h1>
      <div style={styles.controls}>
        <div>
          <label style={styles.label}>Фільтр за роллю:</label>
          <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)} style={styles.input}>
            <option value="all">Всі користувачі</option>
            <option value="client">Тільки пасажири</option>
            <option value="driver">Тільки водії</option>
          </select>
        </div>
      </div>
      <div style={styles.tableContainer}>
        {loading && <LoadingIndicator />}
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}></th>
              <th style={styles.th}>Ім'я</th>
              <th style={styles.th}>Email</th>
              <th style={styles.th}>Роль</th>
              <th style={styles.th}>Поїздки</th>
              <th style={styles.th}>Дата реєстрації</th>
            </tr>
          </thead>
          <tbody>
            {!loading && users.length === 0 ? (
              <tr><td colSpan="6" style={{...styles.td, textAlign: 'center'}}>Користувачів не знайдено.</td></tr>
            ) : (
              users.map(user => (
                <tr key={user.id}>
                  <td style={styles.td}><Avatar url={user.avatar_url} name={user.full_name} /></td>
                  <td style={styles.td}>{user.full_name || '-'}</td>
                  <td style={styles.td}>{user.email || '-'}</td>
                  <td style={styles.td}><span style={getRoleStyle(user.role)}>{user.role}</span></td>
                  <td style={styles.td}>{user.completed_trips ?? '-'}</td>
                  <td style={styles.td}>{user.created_at ? new Date(user.created_at).toLocaleDateString() : '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// --- СТИЛІ ---
const styles = { page: { padding: '2rem', fontFamily: 'system-ui, sans-serif', backgroundColor: '#f8f9fa', color: '#212529' }, header: { fontSize: '2rem', fontWeight: '700', color: '#343a40', marginBottom: '1.5rem' }, controls: { display: 'flex', gap: '1.5rem', alignItems: 'flex-end', marginBottom: '1.5rem', padding: '1.5rem', backgroundColor: '#062270ff', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }, label: { display: 'block', fontSize: '0.9rem', fontWeight: '500', color: '#6c757d', marginBottom: '0.5rem' }, input: { padding: '0.6rem 0.8rem', borderRadius: '8px', border: '2px solid #ced4da', fontSize: '1rem', backgroundColor: '#320c78ff' }, tableContainer: { position: 'relative', minHeight: '300px', backgroundColor: '#ffffff', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', overflow: 'hidden' }, table: { width: '100%', borderCollapse: 'collapse' }, th: { padding: '1rem 1.5rem', textAlign: 'left', borderBottom: '2px solid #dee2e6', backgroundColor: '#f8f9fa', fontWeight: '600', color: '#495057' }, td: { padding: '1rem 1.5rem', textAlign: 'left', borderBottom: '1px solid #e9ecef', verticalAlign: 'middle' }, roleClient: { color: '#007bff', fontWeight: '600', textTransform: 'capitalize' }, roleDriver: { color: '#28a745', fontWeight: '600', textTransform: 'capitalize' }, roleAdmin: { color: '#dc3545', fontWeight: '600', textTransform: 'capitalize' }, loadingOverlay: { position: 'absolute', top: '58px', left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(255, 255, 255, 0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10, borderRadius: '0 0 12px 12px' }, spinner: { border: '5px solid #f3f3f3', borderTop: '5px solid #007bff', borderRadius: '50%', width: '50px', height: '50px', animation: 'spin 1s linear infinite' }, };

export default UsersListPage;