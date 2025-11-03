import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabaseClient'; // Переконайтесь, що шлях правильний

const AdminReportsPage = () => {
  // 👇 Стан для перемикання вкладок
  const [activeTab, setActiveTab] = useState('reports'); // 'reports' або 'banned'
  
  const [reports, setReports] = useState([]);
  const [bannedUsers, setBannedUsers] = useState([]); // 👈 Новий стан для списку забанених
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 1. Універсальна функція для завантаження ВСІХ даних
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    // Запускаємо обидва запити паралельно
    const [reportsResponse, bannedUsersResponse] = await Promise.all([
      // Запит 1: Отримати всі активні скарги
      supabase
        .from('reports')
        .select(`id, created_at, reason, reporter_id, reported_user_id`)
        .order('created_at', { ascending: false }),
      
      // Запит 2: Отримати всіх забанених користувачів
      supabase
        .from('profiles')
        .select(`id, full_name, email`) // Беремо ім'я та пошту для відображення
        .eq('is_banned', true)
        .order('full_name')
    ]);

    if (reportsResponse.error || bannedUsersResponse.error) {
      setError(reportsResponse.error?.message || bannedUsersResponse.error?.message);
    } else {
      setReports(reportsResponse.data);
      setBannedUsers(bannedUsersResponse.data);
    }
    
    setLoading(false);
  }, []);

  // 2. Завантажуємо дані при першому відкритті сторінки
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 3. Функція для БАНУ користувача
  const handleBanUser = async (userIdToBan, reportId) => {
    if (!window.confirm(`Ви впевнені, що хочете ЗАБЛОКУВАТИ користувача ${userIdToBan}? Ця дія видалить скаргу.`)) {
      return;
    }

    // Встановлюємо is_banned = true
    const { error: banError } = await supabase
      .from('profiles')
      .update({ is_banned: true })
      .eq('id', userIdToBan);

    if (banError) {
      alert("Помилка блокування: " + banError.message);
    } else {
      alert("Користувача успішно заблоковано.");
      
      // Видаляємо скаргу, оскільки її оброблено
      await supabase.from('reports').delete().eq('id', reportId);
      
      // Оновлюємо дані на сторінці
      fetchData(); 
    }
  };

  // 4. 👈 НОВА ФУНКЦІЯ: Розбан користувача
  const handleUnbanUser = async (userIdToUnban) => {
    if (!window.confirm(`Ви впевнені, що хочете РОЗБЛОКУВАТИ користувача ${userIdToUnban}?`)) {
      return;
    }

    // Встановлюємо is_banned = false
    const { error } = await supabase
      .from('profiles')
      .update({ is_banned: false })
      .eq('id', userIdToUnban);

    if (error) {
      alert("Помилка розблокування: " + error.message);
    } else {
      alert("Користувача успішно розблоковано.");
      // Оновлюємо дані на сторінці
      fetchData();
    }
  };

  // 5. Рендер контенту залежно від вкладки
  const renderContent = () => {
    if (loading) {
      return <div style={styles.messageText}>Завантаження...</div>;
    }
    
    if (error) {
      return <div style={{...styles.messageText, color: '#dc3545'}}>Помилка: {error}</div>;
    }

    // Вкладка "Активні скарги"
    if (activeTab === 'reports') {
      if (reports.length === 0) {
        return <div style={styles.messageText}>Нових скарг немає.</div>;
      }
      return (
        <div style={styles.listContainer}>
          {reports.map((report) => (
            <div key={report.id} style={styles.card}>
              <div style={styles.cardHeader}>
                <strong>ID Користувача (На кого):</strong> {report.reported_user_id}
              </div>
              <div style={styles.cardBody}>
                <p><strong>Причина:</strong> {report.reason || 'N/A'}</p>
                <p style={styles.metaText}><strong>Від:</strong> {report.reporter_id}</p>
                <p style={styles.metaText}><strong>Дата:</strong> {new Date(report.created_at).toLocaleString()}</p>
              </div>
              <div style={styles.cardFooter}>
                <button 
                  onClick={() => handleBanUser(report.reported_user_id, report.id)}
                  style={styles.banButton}
                >
                  Заблокувати
                </button>
              </div>
            </div>
          ))}
        </div>
      );
    }

    // Вкладка "Забанені користувачі"
    if (activeTab === 'banned') {
      if (bannedUsers.length === 0) {
        return <div style={styles.messageText}>Список заблокованих порожній.</div>;
      }
      return (
        <div style={styles.listContainer}>
          {bannedUsers.map((user) => (
            <div key={user.id} style={styles.card}>
              <div style={styles.cardHeader}>
                <strong>{user.full_name || user.email || 'N/A'}</strong>
              </div>
              <div style={styles.cardBody}>
                <p style={styles.metaText}><strong>ID:</strong> {user.id}</p>
              </div>
              <div style={styles.cardFooter}>
                <button 
                  onClick={() => handleUnbanUser(user.id)}
                  style={styles.unbanButton} // 👈 Нова кнопка
                >
                  Розблокувати
                </button>
              </div>
            </div>
          ))}
        </div>
      );
    }
  };

  return (
    <div style={styles.pageContainer}>
      <div style={styles.header}>
        <h2>Модерація Контенту</h2>
        <p>Керуйте скаргами та заблокованими користувачами.</p>
      </div>

      {/* Перемикач вкладок */}
      <div style={styles.tabContainer}>
        <button 
          style={activeTab === 'reports' ? styles.activeTabButton : styles.tabButton}
          onClick={() => setActiveTab('reports')}
        >
          Активні скарги ({reports.length})
        </button>
        <button 
          style={activeTab === 'banned' ? styles.activeTabButton : styles.tabButton}
          onClick={() => setActiveTab('banned')}
        >
          Забанені користувачі ({bannedUsers.length})
        </button>
      </div>

      {/* Контент вкладок */}
      {renderContent()}
    </div>
  );
};

// --- 💅 ОНОВЛЕНІ СТИЛІ ---
const styles = {
  pageContainer: { 
    fontFamily: 'Arial, sans-serif', 
    backgroundColor: '#f4f7f6', 
    padding: '24px' 
  },
  header: { 
    marginBottom: '24px', 
    borderBottom: '1px solid #e0e0e0', 
    paddingBottom: '16px' 
  },
  tabContainer: {
    display: 'flex',
    marginBottom: '24px',
  },
  tabButton: {
    padding: '12px 18px',
    fontSize: '16px',
    border: 'none',
    backgroundColor: '#fff',
    borderBottom: '2px solid #ccc',
    cursor: 'pointer',
    color: '#555',
    fontWeight: '500',
  },
  activeTabButton: {
    padding: '12px 18px',
    fontSize: '16px',
    border: 'none',
    backgroundColor: '#fff',
    borderBottom: '2px solid #1b5dc8ff', // Колір вашого бренду
    cursor: 'pointer',
    color: '#1b5dc8ff',
    fontWeight: 'bold',
  },
  messageText: {
    fontSize: '16px',
    color: '#666',
    textAlign: 'center',
    padding: '40px 0',
  },
  listContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', // Адаптивна сітка
    gap: '20px',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  cardHeader: {
    padding: '16px',
    borderBottom: '1px solid #eee',
    fontSize: '18px',
    color: '#333',
    wordBreak: 'break-all',
  },
  cardBody: {
    padding: '16px',
    color: '#555',
  },
  metaText: {
    fontSize: '14px',
    color: '#777',
    margin: '4px 0',
    wordBreak: 'break-all',
  },
  cardFooter: {
    padding: '16px',
    backgroundColor: '#f9f9f9',
    textAlign: 'right',
    borderTop: '1px solid #eee',
  },
  banButton: {
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    padding: '10px 16px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
  },
  unbanButton: { // 👈 Новий стиль
    backgroundColor: '#28a745', // Зелений
    color: 'white',
    border: 'none',
    padding: '10px 16px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
  }
};

export default AdminReportsPage;