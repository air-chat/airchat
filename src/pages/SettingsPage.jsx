import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../services/supabaseClient';
import { useAuth } from '../components/AuthProvider';

// --- ОСНОВНИЙ КОМПОНЕНТ СТОРІНКИ ---
const SettingsPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Стани для даних профілю
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState(null);

  // Стани для зміни пароля
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Стан для нового файлу аватара
  const [avatarFile, setAvatarFile] = useState(null);
  const fileInputRef = useRef(null);

  // Стан для повідомлень
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  // 1. Завантаження даних профілю при відкритті сторінки
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('full_name, phone, avatar_url')
          .eq('id', user.id)
          .single();

        if (error) throw error;
        
        if (data) {
          setFullName(data.full_name || '');
          setPhone(data.phone || '');
          setAvatarUrl(data.avatar_url);
        }
      } catch (error) {
        setFeedback({ type: 'error', message: `Помилка завантаження профілю: ${error.message}` });
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [user]);

  // 2. Обробка збереження форми
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFeedback({ type: '', message: '' });

    try {
      // Крок 1: Оновлення пароля, якщо він введений
      if (password) {
        if (password !== confirmPassword) {
          throw new Error('Паролі не співпадають!');
        }
        const { error: passwordError } = await supabase.auth.updateUser({ password });
        if (passwordError) throw passwordError;
      }

      // Крок 2: Завантаження нового аватара, якщо він вибраний
      let newAvatarUrl = avatarUrl;
      if (avatarFile) {
        const filePath = `avatars/${user.id}-${Date.now()}`;
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, avatarFile);
        
        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);
        newAvatarUrl = publicUrl;
      }
      
      // Крок 3: Оновлення даних в таблиці 'profiles'
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          phone: phone,
          avatar_url: newAvatarUrl,
          updated_at: new Date(),
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      setAvatarUrl(newAvatarUrl); // Оновлюємо URL аватара в стані
      setAvatarFile(null); // Очищуємо вибраний файл
      setPassword(''); // Очищуємо поля паролів
      setConfirmPassword('');
      setFeedback({ type: 'success', message: 'Профіль успішно оновлено!' });

    } catch (error) {
      setFeedback({ type: 'error', message: error.message });
    } finally {
      setSaving(false);
    }
  };
  
  // Обробка вибору файлу
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      setAvatarUrl(URL.createObjectURL(file)); // Для миттєвого прев'ю
    }
  };

  if (loading) return <div style={styles.page}>Завантаження профілю...</div>;

  return (
    <div style={styles.page}>
      <h1 style={styles.header}>Налаштування профілю</h1>
      <form onSubmit={handleFormSubmit} style={styles.form}>
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Особиста інформація</h2>
          
          <div style={styles.avatarSection}>
            <img 
              src={avatarUrl || `https://ui-avatars.com/api/?name=${fullName || 'A'}&background=random`} 
              alt="Avatar" 
              style={styles.avatar} 
            />
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleAvatarChange} 
              style={{ display: 'none' }} 
              accept="image/*"
            />
            <button type="button" onClick={() => fileInputRef.current.click()} style={styles.buttonSecondary}>
              Змінити аватар
            </button>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label} htmlFor="fullName">Повне ім'я</label>
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              style={styles.input}
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label} htmlFor="phone">Номер телефону</label>
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              style={styles.input}
            />
          </div>
        </div>

        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Зміна пароля</h2>
          <div style={styles.formGroup}>
            <label style={styles.label} htmlFor="password">Новий пароль</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
              placeholder="Залиште пустим, щоб не змінювати"
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label} htmlFor="confirmPassword">Підтвердіть пароль</label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              style={styles.input}
            />
          </div>
        </div>

        {feedback.message && (
          <div style={{...styles.feedback, ...(feedback.type === 'success' ? styles.feedbackSuccess : styles.feedbackError)}}>
            {feedback.message}
          </div>
        )}

        <div style={styles.actions}>
          <button type="submit" style={styles.button} disabled={saving}>
            {saving ? 'Збереження...' : 'Зберегти зміни'}
          </button>
        </div>
      </form>
    </div>
  );
};

// --- СТИЛІ ---
const styles = {
    page: { padding: '2rem', fontFamily: 'system-ui, sans-serif', backgroundColor: '#f8f9fa', color: '#212529', maxWidth: '800px', margin: '0 auto' },
    header: { fontSize: '2rem', fontWeight: '700', color: '#343a40', marginBottom: '1.5rem', textAlign: 'center' },
    form: { display: 'flex', flexDirection: 'column', gap: '2rem' },
    card: { padding: '2rem', backgroundColor: '#ffffff', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' },
    cardTitle: { fontSize: '1.25rem', fontWeight: '600', borderBottom: '1px solid #dee2e6', paddingBottom: '1rem', marginBottom: '1.5rem', marginTop: 0 },
    avatarSection: { display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '1.5rem' },
    avatar: { width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover' },
    formGroup: { marginBottom: '1.5rem' },
    label: { display: 'block', fontSize: '0.9rem', fontWeight: '500', color: '#6c757d', marginBottom: '0.5rem' },
    input: { width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ced4da', fontSize: '1rem', boxSizing: 'border-box' },
    actions: { display: 'flex', justifyContent: 'flex-end' },
    button: { padding: '0.75rem 1.5rem', cursor: 'pointer', border: 'none', borderRadius: '8px', backgroundColor: '#007bff', color: 'white', fontSize: '1rem', fontWeight: '600' },
    buttonSecondary: { padding: '0.6rem 1.2rem', cursor: 'pointer', border: '1px solid #ced4da', borderRadius: '8px', backgroundColor: '#f8f9fa', color: '#495057' },
    feedback: { padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', textAlign: 'center' },
    feedbackSuccess: { backgroundColor: '#d4edda', color: '#155724' },
    feedbackError: { backgroundColor: '#f8d7da', color: '#721c24' },
};

export default SettingsPage;