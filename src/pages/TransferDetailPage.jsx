import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { useAuth } from '../components/AuthProvider';

// --- ДОПОМІЖНІ КОМПОНЕНТИ ---
const Avatar = ({ url, name, size = '60px' }) => {
  const style = { width: size, height: size, borderRadius: '50%', objectFit: 'cover', backgroundColor: '#e9ecef', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#495057', fontWeight: 'bold', fontSize: `calc(${size} / 2.5)`, textTransform: 'uppercase', };
  const displayName = name ? name.trim() : ''; const initial = displayName ? displayName.charAt(0) : '?';
  return url ? <img src={url} alt={displayName || 'Avatar'} style={style} /> : <div style={style}>{initial}</div>;
};

// Покращений DetailItem
const DetailItem = ({ icon, value, label }) => {
    if (!value && value !== 0 && typeof value !== 'boolean') return null; // Не рендеримо, якщо немає значення (крім 0 або false)
    const displayValue = typeof value === 'boolean' ? (value ? 'Так' : 'Ні') : value;
    return (
        <div style={styles.detailItem}>
            <span style={styles.detailIcon}>{icon}</span>
            <span style={styles.detailValue}>{displayValue}</span>
            {label && <span style={styles.detailLabel}>{label}</span>}
        </div>
    );
};

// Новий компонент для секцій деталей
const DetailSection = ({ children }) => (
    <div style={styles.detailsGrid}>{children}</div>
);

// Модальне вікно (з невеликими покращеннями стилів та логіки)
const AdminOfferModal = ({ isOpen, onClose, onSubmit }) => {
  const [price, setPrice] = useState('');
  const [currency, setCurrency] = useState('UAH');
  const [comment, setComment] = useState('Пропозиція від адміністрації');
  const [acceptImmediately, setAcceptImmediately] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Скидання стану при відкритті модального вікна
  useEffect(() => {
    if (isOpen) {
        setPrice('');
        setCurrency('UAH');
        setComment('Пропозиція від адміністрації');
        setAcceptImmediately(true);
        setIsSubmitting(false); // На випадок якщо попереднє відправлення було перервано
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!price || isNaN(price) || parseFloat(price) <= 0) { // Додано перевірку на > 0
      alert('Будь ласка, введіть коректну ціну (більше 0).');
      return;
    }
    setIsSubmitting(true);
    await onSubmit({ price: parseFloat(price), currency, comment, acceptImmediately });
    // Не скидаємо setIsSubmitting(false) тут, бо onSubmit може перенаправити
    // Якщо ж onSubmit поверне помилку, стан має обробити сама функція onSubmit
  };

  return (
    <div style={styles.modalBackdrop} onClick={onClose}>
      <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <h2 style={styles.modalHeader}>Створити пропозицію</h2>
        <form onSubmit={handleSubmit}>
          <div style={styles.formGroup}>
            <label htmlFor="price" style={styles.label}>Ціна</label>
            <input id="price" type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Наприклад, 1500" style={styles.input} required min="0.01" step="any" />
          </div>
          <div style={styles.formGroup}>
            <label htmlFor="currency" style={styles.label}>Валюта</label>
            <select id="currency" value={currency} onChange={(e) => setCurrency(e.target.value)} style={styles.input}>
              <option value="UAH">UAH</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
            </select>
          </div>
          <div style={styles.formGroup}>
            <label htmlFor="comment" style={styles.label}>Коментар</label>
            <textarea id="comment" value={comment} onChange={(e) => setComment(e.target.value)} style={{...styles.input, height: '80px'}}/>
          </div>
          <div style={styles.checkboxGroup}>
            <input type="checkbox" id="accept" checked={acceptImmediately} onChange={(e) => setAcceptImmediately(e.target.checked)} style={{ marginRight: '8px' }}/>
            <label htmlFor="accept" style={styles.checkboxLabel}>Прийняти пропозицію негайно (приховати від водіїв)</label>
          </div>
          <div style={styles.modalActions}>
            <button type="button" onClick={onClose} style={styles.buttonSecondary} disabled={isSubmitting}>Скасувати</button>
            <button type="submit" style={styles.button} disabled={isSubmitting}>{isSubmitting ? 'Відправка...' : 'Підтвердити'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- ОСНОВНИЙ КОМПОНЕНТ СТОРІНКИ ---
const TransferDetailPage = () => {
  const { transferId } = useParams();
  const navigate = useNavigate();
  const { user: adminUser } = useAuth();
  const [transfer, setTransfer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // ✅ ВИКОРИСТОВУЄМО useCallback для стабільності функції
  const fetchDetails = useCallback(async () => {
    if (!transferId) return;
    setLoading(true);
    setError(null);
    try {
      const { data: transferDetails, error: rpcError } = await supabase
        .rpc('get_admin_transfer_details', { p_transfer_id: transferId })
        .single();
      if (rpcError) throw rpcError;
      setTransfer(transferDetails);
    } catch (err) {
      console.error("Помилка завантаження деталей трансферу:", err);
      setError(err.message || 'Невідома помилка');
    } finally {
      setLoading(false);
    }
  }, [transferId]); // Залежність тільки від transferId

  useEffect(() => {
    fetchDetails();
    // ✅ Налаштовуємо слухача Realtime для оновлення статусу або пропозицій
    const channel = supabase
      .channel(`admin-transfer-detail-${transferId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'transfers', filter: `id=eq.${transferId}` },
        (payload) => {
          console.log('Transfer status updated via Realtime:', payload.new);
          // Оновлюємо тільки статус, щоб не перезавантажувати все
          setTransfer(current => current ? { ...current, status: payload.new.status } : null);
        }
      )
       .on( // Додаємо слухача на INSERT в пропозиції
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'transfer_offers', filter: `transfer_id=eq.${transferId}` },
        (payload) => {
            console.log('New offer added via Realtime:', payload.new);
            // Повторно запитуємо деталі, щоб отримати оновлений список пропозицій
            fetchDetails();
        }
       )
      .subscribe();

    // Відписка при розмонтуванні
    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchDetails, transferId]); // Додаємо transferId як залежність

const handleAdminSubmit = useCallback(async (offerData) => {
    if (!adminUser || !transferId) {
      alert('Помилка: Не вдалося визначити адміністратора або ID трансферу.');
      return;
    }

    let submissionError = null;
    let insertedOfferId = null;

    try {
      // --- Крок 1: Створення пропозиції (без змін) ---
      const { data: insertedOffer, error: insertError } = await supabase.from('transfer_offers').insert({
          transfer_id: transferId,
          driver_id: adminUser.id, // ID адміна
          price: offerData.price,
          currency: offerData.currency,
          driver_comment: offerData.comment,
          is_admin_offer: true, // Позначаємо, що це пропозиція адміна
          status: 'offered'      // Стандартний статус
      }).select('id').single(); // Отримуємо ID вставленої пропозиції

      if (insertError) throw new Error(`Помилка створення пропозиції: ${insertError.message}`);
      insertedOfferId = insertedOffer?.id;

      // --- Крок 2: ОНОВЛЕНО ---
      // Тепер ми НЕ приймаємо пропозицію автоматично,
      // АЛЕ якщо була позначка "Прийняти негайно (приховати від водіїв)",
      // то ми просто встановлюємо прапорець is_admin_assigned = true на самому трансфері.
      if (offerData.acceptImmediately) {
          const { error: updateError } = await supabase.from('transfers').update({
              is_admin_assigned: true // <-- ТІЛЬКИ ВСТАНОВЛЮЄМО ПРАПОРЕЦЬ
          }).eq('id', transferId);

          if (updateError) {
              // Якщо оновлення прапорця не вдалося, видаляємо створену пропозицію
              await supabase.from('transfer_offers').delete().eq('id', insertedOfferId);
              throw new Error(`Помилка встановлення прапорця is_admin_assigned: ${updateError.message}`);
          }
           alert('Пропозицію створено та приховано від інших водіїв! Пасажир зможе її прийняти.');
      } else {
           // Якщо галочки не було, просто повідомляємо про успіх
           alert('Пропозицію успішно додано!');
      }

      setIsModalOpen(false);
      fetchDetails(); // Оновлюємо дані на сторінці в будь-якому випадку

    } catch (err) {
        submissionError = err.message;
        console.error("Помилка під час відправки пропозиції адміном:", err);
        // Якщо помилка сталася ПІСЛЯ створення пропозиції, видаляємо її
        if (insertedOfferId) {
             console.warn("Спроба відкоту: видалення пропозиції ID:", insertedOfferId);
             await supabase.from('transfer_offers').delete().eq('id', insertedOfferId);
        }
    } finally {
        if (submissionError) {
             alert(`Помилка: ${submissionError}`);
        }
        // Компонент AdminOfferModal сам керує isSubmitting
    }
  }, [transferId, adminUser, fetchDetails]); // navigate прибрано із залежностей
  const getDirectionText = (direction) => {
    if (direction === 'from_airport') return 'З аеропорту';
    if (direction === 'to_airport') return 'До аеропорту';
    return null;
  };

  // --- Рендеринг ---
  if (loading) return <div style={{ padding: '2rem' }}>Завантаження... <span style={{ fontSize: '2rem' }}>⏳</span></div>;
  if (error) return <div style={{ color: 'red', padding: '2rem' }}>Помилка завантаження: {error} <span style={{ fontSize: '2rem' }}>❌</span></div>;
  if (!transfer) return <div style={{ padding: '2rem' }}>Трансфер не знайдено. <Link to="/transfers">Повернутися до списку</Link> <span style={{ fontSize: '2rem' }}>🤷</span></div>;

  const directionText = getDirectionText(transfer.direction);
  const offers = transfer.all_offers || [];
  // ✅ Визначаємо, чи зробив адмін пропозицію (для приховування кнопки)
  const isAdminOfferExists = offers.some(offer => offer.is_admin_offer);

  return (
    <div style={styles.page}>
      <Link to="/transfers" style={styles.backLink}>← Назад до списку</Link>
      <div style={styles.pageHeader}>
        <h1 style={styles.header}>Трансфер #{transferId.substring(0, 8)}</h1>
        {/* Покращений бейдж статусу */}
        <span style={{...styles.statusBadge, ...styles[transfer.status]}}>
          {transfer.status === 'pending' && 'Очікує'}
          {transfer.status === 'accepted' && 'Прийнято'}
          {transfer.status === 'completed' && 'Завершено'}
          {transfer.status === 'cancelled' && 'Скасовано'}
        </span>
      </div>
      <div style={styles.mainGrid}>
        {/* --- Ліва колонка --- */}
        <div style={styles.leftColumn}>
            {/* --- Картка Пасажира --- */}
            <div style={styles.card}>
                <h2 style={styles.cardTitle}>Пасажир</h2>
                <div style={styles.userCardContent}>
                    <Avatar url={transfer.passenger_avatar_url} name={transfer.passenger_name} size="80px" />
                    <div>
                        <h3 style={styles.userName}>{transfer.passenger_name || 'Ім\'я не вказано'}</h3>
                        {transfer.passenger_created_at && <p style={styles.memberSince}>Учасник з {new Date(transfer.passenger_created_at).toLocaleDateString()}</p> }
                    </div>
                </div>
            </div>
            {/* --- Картка Пропозицій --- */}
            <div style={styles.card}>
                <h2 style={styles.cardTitle}>Пропозиції ({offers.length})</h2>
                {offers.length === 0 ? ( <p style={{ color: '#6c757d' }}>Пропозицій ще немає.</p> ) : (
                    <div style={styles.offersList}>
                    {/* Використовуємо offer.offer_id як ключ */}
                    {offers.map((offer) => (
                        <div key={offer.offer_id} style={styles.offerCard}>
                            <Avatar url={offer.driver_avatar_url} name={offer.driver_name} size="40px" />
                            <div style={styles.offerDriverInfo}>
                                <strong style={styles.offerDriverName}>{offer.driver_name || 'Ім\'я не вказано'}</strong>
                                {offer.is_admin_offer && <span style={styles.adminBadge}>АДМІН</span>}
                                {/* Позначка, якщо ця пропозиція прийнята */}
                                {transfer.accepted_offer_id === offer.offer_id && <span style={styles.acceptedBadge}>✅ Прийнято</span>}
                            </div>
                            <strong style={styles.offerPrice}>{offer.price} {offer.currency}</strong>
                        </div>
                    ))}
                    </div>
                )}
            </div>

            {/* --- Кнопка Створення Пропозиції --- */}
            {/* Кнопка показується, тільки якщо статус 'pending' і адмін ще не зробив пропозицію */}
            {transfer.status === 'pending' && !isAdminOfferExists && (
                <div style={{marginTop: '2rem', textAlign: 'center'}}>
                    <button style={styles.button} onClick={() => setIsModalOpen(true)}>
                        <span style={{marginRight: '8px'}}>✍️</span> Створити пропозицію від Адміністрації
                    </button>
                </div>
            )}
        </div>
        {/* --- Права колонка з деталями --- */}
        <div style={styles.rightColumn}>
            <div style={styles.card}>
                <h2 style={styles.cardTitle}>Деталі поїздки</h2>
                {/* Маршрут */}
                <div style={styles.routeInfo}>
                    <div style={styles.routePoint}>
                        <span style={styles.routeLabel}>Звідки</span>
                        <p style={styles.routeValue}>{transfer.from_location}</p>
                    </div>
                    <span style={styles.routeArrow}>→</span>
                    <div style={styles.routePoint}>
                        <span style={styles.routeLabel}>Куди</span>
                        <p style={styles.routeValue}>{transfer.to_location}</p>
                    </div>
                </div>
                {/* Напрямок */}
                {directionText && (
                    <div style={styles.directionInfo}>
                        <span style={styles.detailIcon}>✈️</span>
                        <span style={styles.directionText}>{directionText}</span>
                    </div>
                 )}
                 {/* Основні деталі */}
                 <DetailSection>
                    <DetailItem icon="📅" label="Дата" value={new Date(transfer.transfer_datetime).toLocaleDateString()} />
                    <DetailItem icon="🕒" label="Час" value={new Date(transfer.transfer_datetime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} />
                    <DetailItem icon="✈️" label="Рейс" value={transfer.flight_number} />
                    <DetailItem icon="🚗" label="Тип" value={transfer.transfer_type === 'individual' ? 'Індивідуальний' : 'Груповий'} />
                 </DetailSection>
                 <div style={styles.divider} />
                 {/* Пасажири */}
                 <DetailSection>
                    <DetailItem icon="👥" label="Дорослі" value={transfer.adults_count} />
                    <DetailItem icon="🧒" label="Діти" value={transfer.children_count} />
                    <DetailItem icon="👶" label="Немовлята" value={transfer.infants_count} />
                 </DetailSection>
                 <div style={styles.divider} />
                 {/* Додатково */}
                 <DetailSection>
                    <DetailItem icon="🧳" label="Багаж" value={transfer.luggage_info} />
                    <DetailItem icon="🐾" label="Тварини" value={transfer.with_pet} />
                    <DetailItem icon="팻" label="З табличкою" value={transfer.meet_with_sign} />
                 </DetailSection>
            </div>
            {/* Коментар Пасажира */}
            {transfer.passenger_comment && (
                <div style={styles.card}>
                    <h2 style={styles.cardTitle}>Коментар пасажира</h2>
                    <p style={styles.commentText}>"{transfer.passenger_comment}"</p>
                </div>
            )}
        </div>
      </div>
      {/* Модальне вікно */}
      <AdminOfferModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSubmit={handleAdminSubmit} />
    </div>
  );
};

// --- СТИЛІ ---
const styles = {
    // Основні стилі сторінки та сітки
    page: { padding: '2rem', fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif', backgroundColor: '#f8f9fa', minHeight: '100vh', color: '#343a40' },
    pageHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' },
    backLink: { display: 'inline-block', marginBottom: '1.5rem', color: '#007bff', textDecoration: 'none', fontWeight: '500', fontSize: '0.9rem' },
    header: { fontSize: '1.75rem', fontWeight: '700', color: '#343a40', margin: 0 },
    mainGrid: { display: 'grid', gridTemplateColumns: 'minmax(320px, 1fr) 2fr', gap: '2rem', alignItems: 'start' },
    '@media (max-width: 992px)': { // Адаптивність
        mainGrid: { gridTemplateColumns: '1fr' }
    },
    leftColumn: { display: 'flex', flexDirection: 'column', gap: '1.5rem' },
    rightColumn: { display: 'flex', flexDirection: 'column', gap: '1.5rem' },
    // Стилі карток
    card: { padding: '1.5rem', backgroundColor: '#ffffff', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', border: '1px solid #dee2e6' },
    cardTitle: { fontSize: '1.2rem', fontWeight: '600', borderBottom: '1px solid #e9ecef', paddingBottom: '0.8rem', marginBottom: '1rem', marginTop: 0, color: '#495057' },
    // Картка пасажира
    userCardContent: { display: 'flex', alignItems: 'center', gap: '1rem' },
    userName: { margin: 0, fontSize: '1.25rem', fontWeight: '600', color: '#343a40' },
    memberSince: { margin: 0, color: '#6c757d', fontSize: '0.85rem', marginTop: '4px' },
    // Картка пропозицій
    offersList: { display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '400px', overflowY: 'auto', paddingRight: '5px' },
    offerCard: { display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', border: '1px solid #e9ecef', borderRadius: '8px', backgroundColor: '#f8f9fa', transition: 'background-color 0.2s ease' },
    offerCardHover: { backgroundColor: '#e9ecef' }, // Додати :hover
    offerDriverInfo: { flexGrow: 1, display: 'flex', alignItems: 'center' },
    offerDriverName: { fontSize: '0.9rem', fontWeight: '500', color: '#343a40' },
    offerPrice: { fontSize: '1rem', fontWeight: 'bold', color: '#28a745', whiteSpace: 'nowrap' },
    adminBadge: { backgroundColor: '#dc3545', color: 'white', padding: '0.2rem 0.5rem', borderRadius: '10px', fontSize: '0.65rem', fontWeight: 'bold', marginLeft: '0.5rem', verticalAlign: 'middle', textTransform: 'uppercase' },
    acceptedBadge: { backgroundColor: '#28a745', color: 'white', padding: '0.2rem 0.5rem', borderRadius: '10px', fontSize: '0.65rem', fontWeight: 'bold', marginLeft: '0.5rem', verticalAlign: 'middle' },
    // Картка деталей поїздки
    routeInfo: { display: 'flex', alignItems: 'stretch', justifyContent: 'space-between', gap: '1rem', textAlign: 'center', paddingBottom: '1rem', borderBottom: '1px solid #e9ecef', marginBottom: '1rem' },
    routePoint: { flex: 1 },
    routeLabel: { fontSize: '0.8rem', color: '#6c757d', marginBottom: '0.25rem', display: 'block' },
    routeValue: { fontSize: '1rem', fontWeight: '600', margin: 0, color: '#343a40', wordBreak: 'break-word' },
    routeArrow: { fontSize: '1.5rem', color: '#adb5bd', alignSelf: 'center', margin: '0 0.5rem' },
    directionInfo: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.6rem 1rem', margin: '1rem 0', backgroundColor: '#e7f5ff', borderRadius: '8px', border: '1px solid #b8daff' },
    directionText: { color: '#0056b3', fontWeight: '600', fontSize: '0.9rem' },
    detailsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))', gap: '1rem' },
    detailItem: { textAlign: 'center', padding: '0.5rem' },
    detailIcon: { fontSize: '1.5rem', display: 'block', marginBottom: '0.25rem', color: '#6c757d' },
    detailValue: { display: 'block', fontWeight: '600', color: '#343a40', marginTop: '0.25rem', wordBreak: 'break-word', fontSize: '0.95rem' },
    detailLabel: { display: 'block', fontSize: '0.75rem', color: '#6c757d', marginTop: '0.25rem' },
    divider: { height: '1px', backgroundColor: '#e9ecef', margin: '1rem 0' },
    commentText: { fontStyle: 'italic', color: '#495057', lineHeight: 1.6, fontSize: '0.9rem' },
    // Статус бейдж
    statusBadge: { padding: '0.4rem 0.9rem', borderRadius: '1rem', color: 'white', fontWeight: 'bold', fontSize: '0.8rem', textTransform: 'uppercase', whiteSpace: 'nowrap' },
    pending: { backgroundColor: '#ffc107', color: '#212529' }, accepted: { backgroundColor: '#007bff' }, completed: { backgroundColor: '#28a745' }, cancelled: { backgroundColor: '#dc3545' },
    // Кнопки
    button: { padding: '0.75rem 1.5rem', cursor: 'pointer', border: 'none', borderRadius: '8px', backgroundColor: '#007bff', color: 'white', fontSize: '1rem', fontWeight: '600', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', transition: 'background-color 0.2s ease, transform 0.1s ease' },
    buttonHover: { backgroundColor: '#0056b3' }, // :hover
    buttonActive: { transform: 'scale(0.98)' }, // :active
    buttonSecondary: { padding: '0.75rem 1.5rem', cursor: 'pointer', border: '1px solid #6c757d', borderRadius: '8px', backgroundColor: 'transparent', color: '#6c757d', transition: 'background-color 0.2s ease, color 0.2s ease' },
    buttonSecondaryHover: { backgroundColor: '#6c757d', color: 'white' }, // :hover
    // Модальне вікно
    modalBackdrop: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
    modalContent: { backgroundColor: 'white', padding: '2rem', borderRadius: '12px', width: '90%', maxWidth: '500px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' },
    modalHeader: { marginTop: 0, marginBottom: '1.5rem', color: '#343a40', borderBottom: '1px solid #e9ecef', paddingBottom: '1rem', fontSize: '1.5rem', fontWeight: '600' },
    formGroup: { marginBottom: '1rem' },
    label: { display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#495057' },
    checkboxGroup: { display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '1.5rem 0' },
    checkboxLabel: { color: '#495057', userSelect: 'none', cursor: 'pointer', fontSize: '0.9rem' },
    input: { display: 'block', width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ced4da', fontSize: '1rem', boxSizing: 'border-box', transition: 'border-color 0.2s ease, box-shadow 0.2s ease' },
    inputFocus: { borderColor: '#80bdff', boxShadow: '0 0 0 0.2rem rgba(0,123,255,.25)' }, // :focus
    modalActions: { display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem', borderTop: '1px solid #e9ecef', paddingTop: '1.5rem' },
};

export default TransferDetailPage;