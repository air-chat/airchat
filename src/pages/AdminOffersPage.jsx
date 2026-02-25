import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { useAuth } from '../components/AuthProvider'; // ✅ ДОДАНО: Імпортуємо useAuth

// --- Допоміжні компоненти ---
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

const LoadingIndicator = () => (
    <>
      <style>{` @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } } `}</style>
      <div style={styles.loadingOverlay}><div style={styles.spinner}></div></div>
    </>
);

// --- Основний компонент сторінки ---
const AdminOffersPage = () => {
    const { user: adminUser } = useAuth(); // ✅ ДОДАНО: Отримуємо дані про адміна
    const [offers, setOffers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchOffers = async () => {
            setLoading(true);
            setError(null);
            try {
                const { data, error: rpcError } = await supabase.rpc('get_admin_offers_status');
                if (rpcError) throw rpcError;
                setOffers(data || []);
            } catch (err) {
                console.error("Помилка завантаження пропозицій:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchOffers();

        const channel = supabase
            .channel('admin-offers-page')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'transfers' }, fetchOffers)
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    // ✅ ВИПРАВЛЕНО: Функція тепер перевіряє, чи прийнято саме пропозицію адміна
    const getStatusInfo = (status, acceptedDriverId) => {
        if (status === 'accepted') {
            if (acceptedDriverId === adminUser?.id) {
                return { text: 'Прийнято вами', style: styles.statusAcceptedByYou };
            }
            return { text: 'Прийнято іншого', style: styles.statusAcceptedOther };
        }
        switch (status) {
            case 'completed':
                return { text: 'Завершено', style: styles.statusCompleted };
            case 'cancelled':
                return { text: 'Скасовано', style: styles.statusCancelled };
            default: // pending
                return { text: 'Очікує', style: styles.statusPending };
        }
    };

    if (error) return <div style={{...styles.page, color: 'red'}}>Помилка: {error}</div>;

    return (
        <div style={styles.page}>
            <h1 style={styles.header}>Мої пропозиції</h1>
            <div style={styles.tableContainer}>
                {loading && <LoadingIndicator />}
                <table style={styles.table}>
                    <thead>
                        <tr>
                            <th style={styles.th}>Пасажир</th>
                            <th style={styles.th}>Маршрут</th>
                            <th style={styles.th}>Дата поїздки</th>
                            <th style={styles.th}>Моя ціна</th>
                            <th style={styles.th}>Статус трансферу</th>
                            <th style={styles.th}>Дії</th>
                        </tr>
                    </thead>
                    <tbody>
                        {!loading && offers.length === 0 ? (
                            <tr><td colSpan="6" style={{...styles.td, textAlign: 'center'}}>Ви ще не створювали пропозицій.</td></tr>
                        ) : (
                            offers.map(offer => {
                                // ✅ ВИПРАВЛЕНО: Передаємо ID прийнятого водія у функцію
                                const statusInfo = getStatusInfo(offer.transfer_status, offer.accepted_driver_id);
                                return (
                                    <tr key={offer.offer_id}>
                                        <td style={styles.td}>
                                            <div style={styles.userCell}>
                                                <Avatar url={offer.passenger_avatar_url} name={offer.passenger_name} />
                                                {offer.passenger_name || 'Невідомо'}
                                            </div>
                                        </td>
                                        <td style={styles.td}><strong>{offer.from_location}</strong> → <strong>{offer.to_location}</strong></td>
                                        <td style={styles.td}>{new Date(offer.transfer_datetime).toLocaleString('uk-UA', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}</td>
                                        <td style={{...styles.td, fontWeight: 'bold'}}>{offer.price} {offer.currency}</td>
                                        <td style={styles.td}><span style={{...styles.status, ...statusInfo.style}}>{statusInfo.text}</span></td>
                                        <td style={styles.td}><Link to={`/admin/transfers/${offer.transfer_id}`} style={styles.link}>Деталі</Link></td>
                                    </tr>
                                );
                            })
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
    tableContainer: { 
        backgroundColor: '#ffffff', 
        borderRadius: '12px', 
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)', 
        overflow: 'hidden',
        position: 'relative',
        minHeight: '200px'
    },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: { padding: '1rem 1.5rem', textAlign: 'left', borderBottom: '2px solid #dee2e6', backgroundColor: '#f8f9fa', fontWeight: '600', color: '#495057' },
    td: { padding: '1rem 1.5rem', textAlign: 'left', borderBottom: '1px solid #e9ecef' },
    userCell: { display: 'flex', alignItems: 'center' },
    link: { color: '#007bff', textDecoration: 'none', fontWeight: '600' },
    status: { padding: '0.25rem 0.75rem', borderRadius: '1rem', color: 'white', fontWeight: 'bold', fontSize: '0.8rem', textTransform: 'capitalize' },
    statusPending: { backgroundColor: '#ffc107' },
    // ✅ ДОДАНО: Нові стилі для різних статусів "accepted"
    statusAcceptedByYou: { backgroundColor: '#28a745' }, // Зелений, якщо прийнято вас
    statusAcceptedOther: { backgroundColor: '#6c757d' }, // Сірий, якщо прийнято іншого
    statusCompleted: { backgroundColor: '#007bff' },
    statusCancelled: { backgroundColor: '#dc3545' },
    loadingOverlay: {
        position: 'absolute',
        top: '58px',
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

export default AdminOffersPage;