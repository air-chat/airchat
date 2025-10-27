import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';

// --- ОСНОВНИЙ КОМПОНЕНТ СТОРІНКИ ---
const NotificationsPage = () => {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [target, setTarget] = useState('all');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
        setResult({ success: false, message: 'Заголовок та текст є обов\'язковими.' });
        return;
    }
    setSending(true);
    setResult(null);

    try {
      // Виклик нашої нової Edge Function
      const { data, error } = await supabase.functions.invoke('send-bulk-push', {
        body: { title, body, target },
      });

      if (error) throw error;

      setResult({ success: true, message: `Завдання на відправку виконано. Відправлено до ${data?.sentCount || 0} користувачів.` });
      setTitle('');
      setBody('');
    } catch (err) {
      console.error("Помилка відправки сповіщень:", err);
      setResult({ success: false, message: `Помилка: ${err.message}` });
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={styles.page}>
      <h1 style={styles.header}>Масова розсилка сповіщень</h1>
      <div style={styles.card}>
        <form onSubmit={handleSend}>
          <div style={styles.formGroup}>
            <label htmlFor="title" style={styles.label}>Заголовок</label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              style={styles.input}
              placeholder="Наприклад: Нова акція!"
            />
          </div>
          <div style={styles.formGroup}>
            <label htmlFor="body" style={styles.label}>Текст повідомлення</label>
            <textarea
              id="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              required
              style={{...styles.input, height: '120px', paddingTop: '10px'}}
              placeholder="Введіть текст, який побачать користувачі..."
            />
          </div>
          <div style={styles.formGroup}>
            <label htmlFor="target" style={styles.label}>Аудиторія</label>
            <select
              id="target"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              style={styles.input}
            >
              <option value="all">Всім користувачам</option>
              <option value="drivers">Тільки водіям</option>
              <option value="clients">Тільки пасажирам</option>
            </select>
          </div>
          <div style={styles.actions}>
            <button type="submit" disabled={sending} style={styles.button}>
              {sending ? 'Надсилання...' : 'Надіслати сповіщення'}
            </button>
          </div>
        </form>
      </div>

      {result && (
        <div style={{...styles.feedback, ...(result.success ? styles.feedbackSuccess : styles.feedbackError)}}>
          {result.message}
        </div>
      )}
    </div>
  );
};

// --- СТИЛІ ---
const styles = {
    page: { padding: '2rem', fontFamily: 'system-ui, sans-serif', backgroundColor: '#f8f9fa', color: '#212529', maxWidth: '800px', margin: '0 auto' },
    header: { fontSize: '2rem', fontWeight: '700', color: '#343a40', marginBottom: '1.5rem', textAlign: 'center' },
    card: { padding: '2rem', backgroundColor: '#ffffff', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' },
    formGroup: { marginBottom: '1.5rem' },
    label: { display: 'block', fontSize: '0.9rem', fontWeight: '500', color: '#6c757d', marginBottom: '0.5rem' },
    input: { width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ced4da', fontSize: '1rem', boxSizing: 'border-box', transition: 'border-color 0.2s, box-shadow 0.2s' },
    actions: { display: 'flex', justifyContent: 'flex-end', marginTop: '2rem' },
    button: { padding: '0.75rem 1.5rem', cursor: 'pointer', border: 'none', borderRadius: '8px', backgroundColor: '#007bff', color: 'white', fontSize: '1rem', fontWeight: '600', transition: 'background-color 0.2s' },
    feedback: { padding: '1rem', borderRadius: '8px', marginTop: '1.5rem', textAlign: 'center', fontWeight: '500' },
    feedbackSuccess: { backgroundColor: '#d4edda', color: '#155724' },
    feedbackError: { backgroundColor: '#f8d7da', color: '#721c24' },
};

export default NotificationsPage;