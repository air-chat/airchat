import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom'; // Додано Link
import { useAuth } from '../components/AuthProvider';
import { supabase } from '../services/supabaseClient'; // ✅ Імпортуємо supabase напряму

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn } = useAuth(); // Беремо тільки signIn з контексту

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 1. Спробуйте увійти
      const { data, error: signInError } = await signIn({ email, password });

      if (signInError) {
        throw signInError; // Перекидаємо помилку в catch
      }

      // 2. Якщо вхід УСПІШНИЙ, перевіряємо роль АДМІНА
      if (data.user) {
         try {
            // Викликаємо RPC-функцію для перевірки ролі
            const { data: isAdminRole, error: rpcError } = await supabase.rpc('is_admin');

            if (rpcError) {
                // Якщо помилка перевірки ролі, логуємо і діємо як для не-адміна
                console.error("Помилка перевірки ролі адміна:", rpcError);
                navigate('/'); // Перенаправляємо на лендінг
                return; // Важливо вийти
            }

            // 3. ПЕРЕНАПРАВЛЕННЯ ЗАЛЕЖНО ВІД РОЛІ
            if (isAdminRole) {
                console.log('Admin login: navigating to admin dashboard or intended route.');
                // Перенаправляємо на сторінку, куди користувач йшов, АБО на /admin/dashboard
                const from = location.state?.from?.pathname || '/admin/dashboard';
                navigate(from, { replace: true }); // ✅ Адміна сюди
            } else {
                // Якщо НЕ адмін (звичайний користувач або помилка ролі)
                console.log('Non-admin login: navigating to landing page.');
                navigate('/', { replace: true }); // ✅ Не-адміна на лендінг
            }

         } catch (roleCheckError) {
             console.error("Виняток під час перевірки ролі:", roleCheckError);
             navigate('/'); // Запасний варіант при помилці
         }
      } else {
         // Малоймовірно, але можливо
         throw new Error("Login succeeded but no user data received.");
      }

    } catch (err) {
      console.error("Помилка входу:", err);
      // Показуємо більш специфічні помилки, якщо можливо
      if (err.message.includes('Invalid login credentials')) {
          setError('Неправильна електронна пошта або пароль.');
      } else if (err.message.includes('Email not confirmed')) {
          setError('Будь ласка, підтвердіть вашу пошту.');
      }
      else {
          setError('Не вдалося увійти. Спробуйте ще раз.');
      }
    } finally {
      // Залишаємо індикатор активним тільки якщо була помилка
      if (error) {
          setLoading(false);
      }
      // При успішному navigate setLoading(false) не потрібен
    }
  };

  // --- Стилі (залишено без змін) ---
  const styles = {
    container: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', fontFamily: 'system-ui, sans-serif', backgroundColor: '#f8f9fa' },
    form: { padding: '30px', border: '1px solid #dee2e6', borderRadius: '8px', minWidth: '320px', backgroundColor: '#ffffff', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' },
    title: { textAlign: 'center', marginBottom: '20px', color: '#343a40' }, // Додано заголовок
    label: { display: 'block', marginBottom: '5px', fontWeight: '500', color: '#495057'}, // Додано label
    input: { display: 'block', width: '100%', padding: '10px', margin: '5px 0 15px 0', boxSizing: 'border-box', border: '1px solid #ced4da', borderRadius: '4px' },
    button: { width: '100%', padding: '12px 15px', cursor: 'pointer', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', fontSize: '1em', fontWeight: '600', transition: 'background-color 0.2s ease'},
    buttonHover: { backgroundColor: '#0056b3' }, // Додати :hover
    error: { color: 'red', marginTop: '15px', textAlign: 'center', fontSize: '0.9em' },
    linkContainer: { marginTop: '15px', textAlign: 'center', fontSize: '0.9em' },
    link: { color: '#007bff', textDecoration: 'none' }
  };

  return (
    <div style={styles.container}>
      <form onSubmit={handleLogin} style={styles.form}>
        <h1 style={styles.title}>Вхід для Адміністратора</h1>
        <div>
            <label htmlFor="email" style={styles.label}>Email:</label>
            <input
              type="email"
              id="email"
              placeholder="admin@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={styles.input}
              autoComplete="email"
            />
        </div>
        <div>
            <label htmlFor="password" style={styles.label}>Пароль:</label>
            <input
              type="password"
              id="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={styles.input}
              autoComplete="current-password"
            />
        </div>
        {error && <p style={styles.error}>{error}</p>}
        <button type="submit" disabled={loading} style={styles.button}>
          {loading ? 'Вхід...' : 'Увійти'}
        </button>
        <div style={styles.linkContainer}>
            <Link to="/" style={styles.link}>На головну</Link>
        </div>
      </form>
    </div>
  );
};

export default LoginPage;