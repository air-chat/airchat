import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { useAuth } from '../components/AuthProvider';
import moment from 'moment';
import 'moment/locale/uk';

// --- ДОПОМІЖНІ КОМПОНЕНТИ ---
const Avatar = ({ url, name, size = '50px', isOnline = false }) => {
  const style = { width: size, height: size, borderRadius: '50%', objectFit: 'cover', backgroundColor: '#e9ecef', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#495057', fontWeight: 'bold', fontSize: `calc(${size} / 2.5)`, textTransform: 'uppercase' };
  const displayName = name ? name.trim() : '';
  const initial = displayName ? displayName.charAt(0) : '?';

  return (
    <div style={{ position: 'relative', marginRight: '15px', flexShrink: 0 }}>
        {url ? <img src={url} alt={displayName} style={style} /> : <div style={style}>{initial}</div>}
        {isOnline && <div style={styles.onlineIndicator}></div>}
    </div>
  );
};

const LoadingIndicator = () => (
    <>
      <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      <div style={styles.loadingOverlay}><div style={styles.spinner}></div></div>
    </>
);

// --- Основний компонент сторінки ---
const AdminChatsListPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [chats, setChats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [onlineUsers, setOnlineUsers] = useState(new Set());

    useEffect(() => { moment.locale('uk'); }, []);

    useEffect(() => {
        if (!user) return;

        const fetchChats = async () => {
            if (chats.length === 0) setLoading(true);
            setError(null);
            try {
                const { data, error: rpcError } = await supabase.rpc('get_admin_chats');
                if (rpcError) throw rpcError;
                setChats(data || []);
            } catch (err) {
                console.error("Помилка завантаження чатів:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchChats();

        const messagesChannel = supabase.channel('admin-chats-list-page-messages').on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, fetchChats).subscribe();

        const presenceChannel = supabase.channel('admin-online-users-list');
        presenceChannel
            .on('presence', { event: 'sync' }, () => {
                const presenceState = presenceChannel.presenceState();
                const userIds = new Set();
                for (const id in presenceState) {
                    presenceState[id].forEach(presence => {
                        if (presence.user_id) userIds.add(presence.user_id);
                    });
                }
                setOnlineUsers(userIds);
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') await presenceChannel.track({ user_id: user.id });
            });

        return () => {
            supabase.removeChannel(messagesChannel);
            supabase.removeChannel(presenceChannel);
        };
    }, [user]);

    if (error) return <div style={{...styles.pageContainer, justifyContent: 'center', alignItems: 'center', color: 'red'}}>Помилка: {error}</div>;

    return (
        <div style={styles.pageContainer}>
            <header style={styles.header}>
                <button onClick={() => navigate('/admin')} style={styles.backButton}>
                    <svg width="24" height="24" viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>
                <h1>Чати</h1>
                <div style={{ width: 40 }}></div>
            </header>
            <main style={styles.listContainer}>
                {loading ? <LoadingIndicator /> : (
                    <>
                        {chats.length === 0 ? (
                            <div style={styles.emptyState}>
                                <p>У вас ще немає активних чатів.</p>
                            </div>
                        ) : (
                            chats.map(chat => {
                                const isUnread = chat.unread_count > 0;
                                const isOnline = onlineUsers.has(chat.other_participant_id);
                                return (
                                    <Link key={chat.room_id} to={`/chats/${chat.room_id}`} style={styles.chatItemLink}>
                                        <div style={styles.chatItem}>
                                            <Avatar url={chat.other_participant_avatar} name={chat.other_participant_name} size="50px" isOnline={isOnline} />
                                            <div style={styles.chatContent}>
                                                <div style={styles.chatHeader}>
                                                    <span style={{...styles.userName, fontWeight: isUnread ? 'bold' : 'normal'}}>{chat.other_participant_name || 'Користувач'}</span>
                                                    <span style={styles.lastMessageTime}>{chat.last_message_time ? moment(chat.last_message_time).fromNow() : ''}</span>
                                                </div>
                                                <div style={styles.lastMessageRow}>
                                                    <p style={{...styles.lastMessage, color: isUnread ? '#212529' : '#6c757d', fontWeight: isUnread ? '600' : '400'}}>{chat.last_message || '...'}</p>
                                                    {isUnread && <div style={styles.unreadBadge}>{chat.unread_count}</div>}
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })
                        )}
                    </>
                )}
            </main>
        </div>
    );
};

// ✅ ВИПРАВЛЕНО: Стилі для pageContainer оновлено, щоб він займав всю ширину
const styles = {
    pageContainer: { 
        display: 'flex', 
        flexDirection: 'column', 
        height: '100vh', 
        width: '100vw',
        backgroundColor: '#f3f4f6', 
        fontFamily: 'system-ui, sans-serif' 
    },
    header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: '700', color: '#111827', padding: '1rem 1.5rem', backgroundColor: 'white', borderBottom: '1px solid #e5e7eb', flexShrink: 0 },
    backButton: { background: 'black', border: 'none', cursor: 'pointer', padding: '8px' },
    listContainer: { flexGrow: 1, overflowY: 'auto', backgroundColor: '#ffffff', position: 'relative' },
    chatItemLink: { textDecoration: 'none', color: 'inherit' },
    chatItem: { display: 'flex', alignItems: 'center', padding: '1rem 1.5rem', borderBottom: '1px solid #e9ecef', transition: 'background-color 0.2s' },
    onlineIndicator: { position: 'absolute', bottom: 0, right: 15, width: '14px', height: '14px', borderRadius: '50%', backgroundColor: '#28a745', border: '2px solid white' },
    chatContent: { flexGrow: 1, display: 'flex', flexDirection: 'column' },
    chatHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.25rem' },
    userName: { fontSize: '1.1rem' },
    lastMessageTime: { fontSize: '0.8rem', color: '#6c757d' },
    lastMessageRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    lastMessage: { margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '90%' },
    unreadBadge: { backgroundColor: '#007bff', color: 'white', borderRadius: '12px', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold', flexShrink: 0 },
    loadingOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(255, 255, 255, 0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10 },
    spinner: { border: '5px solid #f3f3f3', borderTop: '5px solid #007bff', borderRadius: '50%', width: '50px', height: '50px', animation: 'spin 1s linear infinite' },
    emptyState: { textAlign: 'center', padding: '2rem', color: '#6c757d' },
};

const styleSheet = document.createElement("style");
styleSheet.innerText = `a[href^="/chats/"]:hover > div { background-color: #f8f9fa; }`;
if (!document.getElementById('chat-list-styles')) {
    styleSheet.id = 'chat-list-styles';
    document.head.appendChild(styleSheet);
}

export default AdminChatsListPage;