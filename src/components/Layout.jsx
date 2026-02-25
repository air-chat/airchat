import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import { supabase } from '../services/supabaseClient';

const Avatar = ({ url, name, size = '40px' }) => {
  const style = { width: size, height: size, borderRadius: '50%', objectFit: 'cover', backgroundColor: '#4a5568', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#e2e8f0', fontWeight: 'bold', fontSize: `calc(${size} / 2.5)`, textTransform: 'uppercase', flexShrink: 0 };
  const displayName = name ? name.trim() : '';
  const initial = displayName ? displayName.charAt(0) : '?';
  return url ? <img src={url} alt={displayName} style={style} /> : <div style={style}>{initial}</div>;
};

const Icon = ({ path, color = 'currentColor' }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
    <path d={path} stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const icons = {
  transfers: "M8 7L3 12L8 17M16 7L21 12L16 17M3 12H21",
  offers: "M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h11a2 2 0 012 2v2",
  chats: "M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z",
  users: "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 3a4 4 0 110 8 4 4 0 010-8zM23 21v-2a4 4 0 00-3-3.87",
  notifications: "M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0",
  reports: "M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1zM4 22v-7",
  settings: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM12 15a3 3 0 100-6 3 3 0 000 6z",
  logout: "M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3"
};

const Layout = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [adminProfile, setAdminProfile] = useState({ full_name: 'Адміністратор', avatar_url: null });
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [unreadChatsCount, setUnreadChatsCount] = useState(0);
  const [unreadReportsCount, setUnreadReportsCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    const fetchAdminProfile = async () => {
      setLoadingProfile(true);
      try {
        const { data, error } = await supabase.from('profiles').select('full_name, avatar_url').eq('id', user.id).single();
        if (error) throw error;
        if (data) setAdminProfile(data);
      } catch (error) {
        console.error("Помилка завантаження профілю адміна:", error);
      } finally {
        setLoadingProfile(false);
      }
    };
    
    const fetchUnreadCount = async () => {
      try {
        const { data, error } = await supabase.rpc('get_admin_unread_chat_count');
        if (error) throw error;
        setUnreadChatsCount(data || 0);
      } catch (error) {
        console.error("Помилка завантаження лічильника чатів:", error);
      }
    };

    const fetchUnreadReportsCount = async () => {
      try {
        const { count, error } = await supabase
          .from('reports')
          .select('*', { count: 'exact', head: true }); 

        if (error) throw error;
        setUnreadReportsCount(count || 0);
      } catch (error) {
        console.error("Помилка завантаження лічильника скарг:", error);
      }
    };

    fetchAdminProfile();
    fetchUnreadCount();
    fetchUnreadReportsCount(); 

    const chatChannel = supabase
        .channel('admin-layout-listener-chats')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, (payload) => {
          console.log("Real-time: Message change detected, refetching count...");
          fetchUnreadCount();
        })
        .subscribe();

    const reportsChannel = supabase
        .channel('admin-layout-listener-reports')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'reports' }, (payload) => {
          console.log("Real-time: New report detected, refetching count...");
          setUnreadReportsCount((prevCount) => prevCount + 1); 
        })
        .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'reports' }, (payload) => {
           console.log("Real-time: Report deleted, refetching count...");
           fetchUnreadReportsCount();
        })
        .subscribe();

    return () => {
        supabase.removeChannel(chatChannel);
        supabase.removeChannel(reportsChannel); 
    };
  }, [user]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <div style={styles.layout}>
      <aside style={styles.sidebar}>
        <div style={styles.profileSection}>
          {loadingProfile ? (
            <div style={{...styles.avatar, backgroundColor: '#4a5568'}}></div>
          ) : (
            <Avatar url={adminProfile.avatar_url} name={adminProfile.full_name} size="50px" />
          )}
          <div style={styles.profileInfo}>
            <span style={styles.profileName}>{loadingProfile ? 'Завантаження...' : adminProfile.full_name}</span>
            <span style={styles.profileRole}>Адміністратор</span>
          </div>
        </div>

        <nav style={styles.nav}>
          <NavLink to="/admin/transfers" style={({ isActive }) => ({ ...styles.navLink, ...(isActive ? styles.activeNavLink : {}) })}><Icon path={icons.transfers} /> Трансфери</NavLink>
          <NavLink to="/admin/my-offers" style={({ isActive }) => ({ ...styles.navLink, ...(isActive ? styles.activeNavLink : {}) })}><Icon path={icons.offers} /> Мої пропозиції</NavLink>
          <NavLink to="/chats" style={({ isActive }) => ({ ...styles.navLink, ...(isActive ? styles.activeNavLink : {}) })}>
            <Icon path={icons.chats} /> Чати
            {unreadChatsCount > 0 && <span style={styles.badge}>{unreadChatsCount}</span>}
          </NavLink>
          <NavLink to="/admin/users" style={({ isActive }) => ({ ...styles.navLink, ...(isActive ? styles.activeNavLink : {}) })}><Icon path={icons.users} /> Користувачі</NavLink>
          <NavLink to="/admin/notifications" style={({ isActive }) => ({ ...styles.navLink, ...(isActive ? styles.activeNavLink : {}) })}><Icon path={icons.notifications} /> Сповіщення</NavLink>
          <NavLink to="/admin/reports" style={({ isActive }) => ({ ...styles.navLink, ...(isActive ? styles.activeNavLink : {}) })}>
            <Icon path={icons.reports} /> Скарги
            {unreadReportsCount > 0 && <span style={styles.badge}>{unreadReportsCount}</span>}
          </NavLink>
          <NavLink to="/admin/settings" style={({ isActive }) => ({ ...styles.navLink, ...(isActive ? styles.activeNavLink : {}) })}><Icon path={icons.settings} /> Налаштування</NavLink>
        </nav>
        
        <button onClick={handleLogout} style={styles.logoutButton}>
          <Icon path={icons.logout} /> Вийти
        </button>
      </aside>

      <main style={styles.content}>
        <Outlet />
      </main>
    </div>
  );
};

const styles = {
    layout: { display: 'flex', height: '100vh', fontFamily: 'system-ui, sans-serif' },
    sidebar: { width: '280px', backgroundColor: '#111827', color: '#d1d5db', display: 'flex', flexDirection: 'column', padding: '1.5rem', boxSizing: 'border-box' },
    profileSection: { display: 'flex', alignItems: 'center', gap: '1rem', paddingBottom: '1.5rem', borderBottom: '1px solid #374151' },
    profileInfo: { display: 'flex', flexDirection: 'column' },
    profileName: { fontWeight: '600', color: '#f9fafb', fontSize: '1rem' },
    profileRole: { fontSize: '0.875rem', color: '#9ca3af' },
    nav: { flexGrow: 1, paddingTop: '1.5rem' },
    navLink: { display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem 1rem', margin: '0.5rem 0', textDecoration: 'none', color: '#d1d5db', borderRadius: '8px', transition: 'background-color 0.2s, color 0.2s' },
    activeNavLink: { backgroundColor: '#374151', color: '#ffffff', fontWeight: '600' },
    logoutButton: { display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem 1rem', marginTop: 'auto', background: 'transparent', color: '#d1d5db', border: 'none', borderRadius: '8px', cursor: 'pointer', textAlign: 'left', fontSize: '1rem', width: '100%', transition: 'background-color 0.2s, color 0.2s' },
    content: { flexGrow: 1, padding: '2rem', overflowY: 'auto', backgroundColor: '#f3f4f6' },
    badge: { marginLeft: 'auto', backgroundColor: '#dc3545', color: 'white', borderRadius: '10px', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold' }
};

const styleSheet = document.createElement("style");
styleSheet.innerText = `
  aside nav a:hover { 
    background-color: #1f2937; 
    color: #000000ff; 
  }
  aside button:hover { 
    background-color: #1f2937; 
    color: #000000ff; 
  }
`;
if (!document.getElementById('layout-styles')) {
    styleSheet.id = 'layout-styles';
    document.head.appendChild(styleSheet);
}

export default Layout;