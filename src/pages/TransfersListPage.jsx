import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { useAuth } from '../components/AuthProvider';

// --- ДОПОМІЖНІ КОМПОНЕНТИ ---
const Avatar = ({ url, name, size = '40px' }) => {
  const style = {
    width: size, height: size, borderRadius: '50%', objectFit: 'cover', backgroundColor: '#e9ecef',
    display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#495057',
    fontWeight: 'bold', fontSize: `calc(${size} / 2.5)`, textTransform: 'uppercase', marginRight: '10px'
  };
  const displayName = name ? name.trim() : '';
  const initial = displayName ? displayName.charAt(0) : '?';
  return url ? <img src={url} alt={displayName} style={style} /> : <div style={style}>{initial}</div>;
};

// ✅ Новий компонент для індикатора завантаження
const LoadingIndicator = () => (
    <>
      {/* CSS анімація для обертання */}
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
      <div style={styles.loadingOverlay}>
        <div style={styles.spinner}></div>
      </div>
    </>
);


// --- ОСНОВНИЙ КОМПОНЕНТ СТОРІНКИ ---
const TransfersListPage = () => {
  const { user: adminUser } = useAuth();
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [offersCount, setOffersCount] = useState({});
  
  // Стани для фільтрів
  const [statusFilter, setStatusFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchTransfers = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: rpcError } = await supabase.rpc('get_admin_transfers_list', {
        p_status: statusFilter,
        p_start_date: startDate || null,
        p_end_date: endDate ? `${endDate}T23:59:59` : null
      });

      if (rpcError) throw rpcError;
      
      setTransfers(data || []);

      if (data && data.length > 0) {
        const transferIds = data.map(t => t.id);
        const { data: countsData, error: countsError } = await supabase.rpc(
          'get_offer_counts_for_transfers', { p_transfer_ids: transferIds }
        );
        if (countsError) throw countsError;
        const countsMap = (countsData || []).reduce((acc, item) => {
          acc[item.transfer_id] = item.offer_count;
          return acc;
        }, {});
        setOffersCount(countsMap);
      } else {
        setOffersCount({});
      }

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchTransfers();
  }, [statusFilter, startDate, endDate]);

  const handleAddAdminOffer = async (transferId) => {
    const price = prompt("Введіть ціну пропозиції (наприклад, 1500):");
    if (price && !isNaN(price) && adminUser) {
      const { error: insertError } = await supabase.from('transfer_offers').insert({ transfer_id: transferId, driver_id: adminUser.id, price: parseFloat(price), currency: 'UAH', status: 'offered', is_admin_offer: true, driver_comment: 'Пропозиція від адміністрації' });
      if (insertError) { alert(`Помилка: ${insertError.message}`); } else { alert('Пропозицію успішно додано!'); fetchTransfers(); }
    } else if (price) { alert("Будь ласка, введіть коректне число."); }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'pending': return styles.statusPending;
      case 'accepted': return styles.statusAccepted;
      case 'completed': return styles.statusCompleted;
      case 'cancelled': return styles.statusCancelled;
      default: return {};
    }
  };
  
  // ✅ Змінили логіку: тепер сторінка не зникає при завантаженні
  if (error) return <div style={{...styles.page, color: 'red'}}>Помилка: {error.message}</div>;

  return (
    <div style={styles.page}>
      <h1 style={styles.header}>Трансфери</h1>
      <div style={styles.filters}>
        <div>
          <label style={styles.label}>Статус:</label>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={styles.input}>
            <option value="all">Всі</option>
            <option value="pending">Очікують</option>
            <option value="accepted">Прийняті</option>
            <option value="completed">Завершені</option>
            <option value="cancelled">Скасовані</option>
          </select>
        </div>
        <div>
          <label style={styles.label}>З дати:</label>
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={styles.input} />
        </div>
        <div>
          <label style={styles.label}>По дату:</label>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={styles.input} />
        </div>
      </div>
      <div style={styles.tableContainer}>
        {/* ✅ Індикатор завантаження тепер тут */}
        {loading && <LoadingIndicator />}
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Дата/Час</th>
              <th style={styles.th}>Маршрут</th>
              <th style={styles.th}>Пасажир</th>
              <th style={styles.th}>Статус</th>
              <th style={styles.th}>Пропозиції</th>
              <th style={styles.th}>Дії</th>
            </tr>
          </thead>
          <tbody>
            {/* Показуємо "Немає трансферів" тільки якщо завантаження завершено */}
            {!loading && transfers.length === 0 ? (
              <tr><td colSpan="6" style={{...styles.td, textAlign: 'center'}}>Немає трансферів за обраними фільтрами.</td></tr>
            ) : (
              transfers.map((transfer) => (
                <tr key={transfer.id}>
                  <td style={styles.td}>{new Date(transfer.transfer_datetime).toLocaleString()}</td>
                  <td style={styles.td}><strong>{transfer.from_location}</strong> → <strong>{transfer.to_location}</strong></td>
                  <td style={styles.td}>
                    <div style={styles.userCell}>
                      <Avatar url={transfer.passenger_avatar_url} name={transfer.passenger_full_name} />
                      {transfer.passenger_full_name || 'Невідомо'}
                    </div>
                  </td>
                  <td style={styles.td}><span style={{...styles.status, ...getStatusStyle(transfer.status)}}>{transfer.status}</span></td>
                  <td style={styles.td}>{offersCount[transfer.id] || 0}</td>
                  <td style={styles.td}>
                    <Link to={`/transfers/${transfer.id}`} style={styles.link}>Деталі</Link>
                    {transfer.status === 'pending' && (offersCount[transfer.id] || 0) === 0 && (
                       <button onClick={() => handleAddAdminOffer(transfer.id)} style={styles.button}>
                         Додати Адм. Проп.
                       </button>
                    )}
                  </td>
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
const styles = {
    page: { padding: '2rem', fontFamily: 'system-ui, sans-serif', backgroundColor: '#f8f9fa', color: '#212529' },
    header: { fontSize: '2rem', fontWeight: '700', color: '#343a40', marginBottom: '1.5rem' },
    filters: { display: 'flex', flexWrap: 'wrap', gap: '1.5rem', alignItems: 'flex-end', marginBottom: '1.5rem', padding: '1.5rem', backgroundColor: '#031643ff', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' },
    label: { display: 'block', fontSize: '0.9rem', fontWeight: '500', color: '#adb5bd', marginBottom: '0.5rem' },
    input: { padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid #495057', fontSize: '1rem', backgroundColor: '#031643ff', color: '#f8f9fa' },
    tableContainer: { 
        backgroundColor: '#ffffff', 
        borderRadius: '12px', 
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)', 
        overflow: 'hidden',
        position: 'relative', // ✅ Важливо для позиціонування індикатора
        minHeight: '200px' // Запобігає "стрибку" висоти при першому завантаженні
    },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: { padding: '1rem 1.5rem', textAlign: 'left', borderBottom: '2px solid #dee2e6', backgroundColor: '#f8f9fa', fontWeight: '600', color: '#495057' },
    td: { padding: '1rem 1.5rem', textAlign: 'left', borderBottom: '1px solid #e9ecef' },
    userCell: { display: 'flex', alignItems: 'center' },
    link: { color: '#007bff', textDecoration: 'none', fontWeight: '600' },
    button: { marginLeft: '1rem', padding: '0.4rem 0.8rem', cursor: 'pointer', border: 'none', borderRadius: '6px', backgroundColor: '#28a745', color: 'white', fontWeight: '500' },
    status: { padding: '0.25rem 0.75rem', borderRadius: '1rem', color: 'white', fontWeight: 'bold', fontSize: '0.8rem', textTransform: 'capitalize' },
    statusPending: { backgroundColor: '#ffc107' },
    statusAccepted: { backgroundColor: '#007bff' },
    statusCompleted: { backgroundColor: '#28a745' },
    statusCancelled: { backgroundColor: '#dc3545' },
    // ✅ Нові стилі для індикатора
    loadingOverlay: {
        position: 'absolute',
        top: '58px', // Висота заголовка таблиці, щоб спінер був по центру тіла
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
        borderRadius: '0 0 12px 12px'
    },
    spinner: {
        border: '5px solid #f3f3f3',
        borderTop: '5px solid #007bff',
        borderRadius: '50%',
        width: '50px',
        height: '50px',
        animation: 'spin 1s linear infinite',
    },
};

export default TransfersListPage;