import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';

// --- API ФУНКЦІЯ ДЛЯ ВИКЛИКУ EDGE FUNCTION ---
const createDriverAsAdmin = async (driverData) => {
  const { data, error } = await supabase.functions.invoke('admin-create-driver', {
    body: driverData,
  });

  if (error) {
    throw new Error(error.message || "Помилка при виклику Edge Function");
  }
  if (data?.error) {
    throw new Error(data.error);
  }
  return data;
};

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

// --- КОМПОНЕНТ МОДАЛЬНОГО ВІКНА РЕЄСТРАЦІЇ ---
const AdminCreateDriverModal = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    email: '', password: '', fullName: '', phone: '', carMake: '', carPlate: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await createDriverAsAdmin(formData);
      setFormData({ email: '', password: '', fullName: '', phone: '', carMake: '', carPlate: '' });
      onSuccess(); // Оновлюємо таблицю
      onClose();   // Закриваємо модалку
      alert('Водія успішно зареєстровано!');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.modalOverlay}>
      <div style={styles.modalContent}>
        <div style={styles.modalHeader}>
          <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Додати водія</h2>
          <button onClick={onClose} style={styles.closeBtn}>&times;</button>
        </div>
        <form onSubmit={handleSubmit} style={styles.form}>
          {error && <div style={{ color: '#dc3545', marginBottom: '1rem', fontSize: '0.9rem' }}>{error}</div>}
          
          <input required name="email" type="email" placeholder="Email водія" value={formData.email} onChange={handleChange} style={styles.formInput} />
          <input required name="password" type="text" placeholder="Пароль для входу" value={formData.password} onChange={handleChange} style={styles.formInput} />
          <input required name="fullName" type="text" placeholder="ПІБ водія" value={formData.fullName} onChange={handleChange} style={styles.formInput} />
          <input name="phone" type="text" placeholder="Телефон" value={formData.phone} onChange={handleChange} style={styles.formInput} />
          
          <div style={{ display: 'flex', gap: '1rem' }}>
            <input name="carMake" type="text" placeholder="Марка авто (напр. Toyota)" value={formData.carMake} onChange={handleChange} style={{ ...styles.formInput, flex: 1 }} />
            <input name="carPlate" type="text" placeholder="Номери (напр. AA1234BB)" value={formData.carPlate} onChange={handleChange} style={{ ...styles.formInput, flex: 1 }} />
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <button type="submit" disabled={loading} style={styles.submitBtn}>
              {loading ? 'Створення...' : 'Зареєструвати'}
            </button>
            <button type="button" onClick={onClose} style={styles.cancelBtn}>Скасувати</button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- ОСНОВНИЙ КОМПОНЕНТ СТОРІНКИ ---
const UsersListPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterRole, setFilterRole] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Виносимо fetchUsers в useCallback, щоб викликати його і при старті, і після успішної реєстрації
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase
          .from('profiles')
          .select('id, role')
          .neq('is_admin', true);

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

      const userDetailPromises = profiles.map(profile => {
        if (profile.role === 'client') return supabase.rpc('get_full_passenger_profile', { p_user_id: profile.id });
        if (profile.role === 'driver') return supabase.rpc('get_full_driver_profile', { p_driver_id: profile.id });
        return null;
      }).filter(Boolean);

      const results = await Promise.all(userDetailPromises);
      
      const detailedUsers = results
          .map(res => {
              if (res.error) {
                  console.error("Помилка отримання деталей користувача:", res.error);
                  return null;
              }
              const userData = res.data;
              return {
                  id: userData.user_id,
                  full_name: userData.full_name,
                  avatar_url: userData.avatar_url,
                  email: userData.email, 
                  role: userData.role || (userData.car_make ? 'driver' : 'client'),
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
  }, [filterRole]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);
  
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
          <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)} style={styles.selectInput}>
            <option value="all">Всі користувачі</option>
            <option value="client">Тільки пасажири</option>
            <option value="driver">Тільки водії</option>
          </select>
        </div>
        
        {/* Кнопка виклику модалки */}
        <button onClick={() => setIsModalOpen(true)} style={styles.addDriverBtn}>
          + Додати водія
        </button>
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

      {/* Підключення модального вікна */}
      <AdminCreateDriverModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={fetchUsers} 
      />
    </div>
  );
};

// --- СТИЛІ ---
const styles = { 
  page: { padding: '2rem', fontFamily: 'system-ui, sans-serif', backgroundColor: '#f8f9fa', color: '#212529', minHeight: '100vh' }, 
  header: { fontSize: '2rem', fontWeight: '700', color: '#343a40', marginBottom: '1.5rem' }, 
  controls: { display: 'flex', gap: '1.5rem', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '1.5rem', padding: '1.5rem', backgroundColor: '#062270ff', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }, 
  label: { display: 'block', fontSize: '0.9rem', fontWeight: '500', color: '#ffffff', marginBottom: '0.5rem' }, 
  selectInput: { padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid #ced4da', fontSize: '1rem', backgroundColor: '#ffffff', color: '#000' }, 
  addDriverBtn: { padding: '0.7rem 1.5rem', borderRadius: '8px', border: 'none', backgroundColor: '#28a745', color: '#fff', fontSize: '1rem', fontWeight: '600', cursor: 'pointer', transition: 'background-color 0.2s' },
  tableContainer: { position: 'relative', minHeight: '300px', backgroundColor: '#ffffff', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', overflow: 'hidden' }, 
  table: { width: '100%', borderCollapse: 'collapse' }, 
  th: { padding: '1rem 1.5rem', textAlign: 'left', borderBottom: '2px solid #dee2e6', backgroundColor: '#f8f9fa', fontWeight: '600', color: '#495057' }, 
  td: { padding: '1rem 1.5rem', textAlign: 'left', borderBottom: '1px solid #e9ecef', verticalAlign: 'middle' }, 
  roleClient: { color: '#007bff', fontWeight: '600', textTransform: 'capitalize' }, 
  roleDriver: { color: '#28a745', fontWeight: '600', textTransform: 'capitalize' }, 
  roleAdmin: { color: '#dc3545', fontWeight: '600', textTransform: 'capitalize' }, 
  loadingOverlay: { position: 'absolute', top: '58px', left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(255, 255, 255, 0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10, borderRadius: '0 0 12px 12px' }, 
  spinner: { border: '5px solid #f3f3f3', borderTop: '5px solid #007bff', borderRadius: '50%', width: '50px', height: '50px', animation: 'spin 1s linear infinite' },
  
  // Стилі для модального вікна
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  modalContent: { backgroundColor: '#fff', padding: '2rem', borderRadius: '12px', width: '100%', maxWidth: '500px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' },
  closeBtn: { background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#6c757d' },
  form: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  formInput: { padding: '0.8rem', borderRadius: '8px', border: '1px solid #ced4da', fontSize: '1rem', width: '100%', boxSizing: 'border-box' },
  submitBtn: { padding: '0.8rem', backgroundColor: '#007bff', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: '600', cursor: 'pointer', flex: 1 },
  cancelBtn: { padding: '0.8rem', backgroundColor: '#e9ecef', color: '#495057', border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: '600', cursor: 'pointer', flex: 1 }
};

export default UsersListPage;