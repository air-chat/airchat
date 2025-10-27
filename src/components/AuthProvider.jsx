import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../services/supabaseClient';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false); // Прапорець адміна
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Ця функція є єдиним джерелом правди про стан користувача
    const checkUserSessionAndRole = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
          setUser(session.user);
          // Викликаємо RPC-функцію для безпечної перевірки ролі адміна на сервері
          const { data: isAdminRole, error: rpcError } = await supabase.rpc('is_admin');
          if (rpcError) throw rpcError;
          
          setIsAdmin(isAdminRole);
        } else {
          // Якщо сесії немає, користувач точно не є адміном
          setUser(null);
          setIsAdmin(false);
        }
      } catch (error) {
        console.error("Помилка перевірки автентифікації:", error);
        setUser(null);
        setIsAdmin(false);
      } finally {
        // Завершуємо завантаження, щоб показати додаток
        setLoading(false);
      }
    };

    // 1. Викликаємо перевірку при першому завантаженні компонента
    checkUserSessionAndRole();

    // 2. Створюємо слухача, який реагує на логін або вихід
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        // При будь-якій зміні стану автентифікації, запускаємо перевірку знову
        checkUserSessionAndRole();
      }
    );

    // 3. Прибираємо слухача, коли компонент зникає з екрану
    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []); // Пустий масив означає, що цей useEffect виконається лише один раз при старті

  const value = {
    user,
    isAdmin,
    loading,
    signIn: (credentials) => supabase.auth.signInWithPassword(credentials),
    signOut: () => supabase.auth.signOut(),
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};