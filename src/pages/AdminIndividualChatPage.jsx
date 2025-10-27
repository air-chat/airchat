import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { useAuth } from '../components/AuthProvider';
import moment from 'moment';
import 'moment/locale/uk';

const Avatar = ({ url, name, size = '40px', isOnline = false }) => {
  const style = { width: size, height: size, borderRadius: '50%', objectFit: 'cover', backgroundColor: '#e9ecef', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#495057', fontWeight: 'bold', fontSize: `calc(${size} / 2.5)`, textTransform: 'uppercase', flexShrink: 0 };
  const displayName = name ? name.trim() : ''; const initial = displayName ? displayName.charAt(0) : '?';
  return (
    <div style={{ position: 'relative', marginRight: '15px', flexShrink: 0 }}>
        {url ? <img src={url} alt={displayName} style={style} /> : <div style={style}>{initial}</div>}
        {isOnline && <div style={styles.onlineIndicatorAvatar}></div>}
    </div>
  );
};

const AdminIndividualChatPage = () => {
    const { roomId } = useParams();
    const { user } = useAuth();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [otherUser, setOtherUser] = useState(null);
    const [isOnline, setIsOnline] = useState(false);
    const [isUploading, setIsUploading] = useState(false); // Стан для завантаження файлу
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null); // Посилання на інпут для файлів

    useEffect(() => { moment.locale('uk'); }, []);

    useEffect(() => {
        const markAsRead = async () => { /* ... */ };
        
        const fetchInitialData = async () => {
            const { data: roomData } = await supabase.from('chat_rooms').select('participant1_id, participant2_id').eq('id', roomId).single();
            if (!roomData) return null;
            
            const otherUserId = roomData.participant1_id === user.id ? roomData.participant2_id : roomData.participant1_id;
            const { data: userData } = await supabase.from('profiles').select('id, full_name, avatar_url, last_seen').eq('id', otherUserId).single();
            setOtherUser(userData);

            const { data: messagesData } = await supabase.from('messages').select('*').eq('room_id', roomId).order('created_at', { ascending: true });
            setMessages(messagesData || []);

            await supabase.rpc('mark_messages_as_read', { p_room_id: roomId });
            return otherUserId;
        };
        
        fetchInitialData().then((otherUserId) => {
            // Підписка на нові повідомлення
            const messagesChannel = supabase.channel(`admin-chat-${roomId}`)
                .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `room_id=eq.${roomId}` }, (payload) => {
                    setMessages(current => [...current, payload.new]);
                    supabase.rpc('mark_messages_as_read', { p_room_id: roomId });
                }).subscribe();
            
            // ✅ ВИПРАВЛЕНО: Надійна підписка на онлайн-статус
            const presenceChannel = supabase.channel('online-users');
            presenceChannel.on('presence', { event: 'sync' }, () => {
                const presenceState = presenceChannel.presenceState();
                if (otherUserId) {
                    const isPresent = Object.values(presenceState).some(p => p[0]?.user_id === otherUserId);
                    setIsOnline(isPresent);
                }
            }).subscribe(async (status) => {
                if (status === 'SUBSCRIBED') await presenceChannel.track({ user_id: user.id });
            });

            return () => {
                supabase.removeChannel(messagesChannel);
                supabase.removeChannel(presenceChannel);
            };
        });
    }, [roomId, user.id]);
    
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (newMessage.trim() === '') return;
        await supabase.from('messages').insert({ room_id: roomId, sender_id: user.id, content: newMessage });
        setNewMessage('');
    };

    // ✨ ДОДАНО: Функція для завантаження зображення
    const handleImageUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setIsUploading(true);
        const fileExt = file.name.split('.').pop();
        const filePath = `public/${roomId}/${Date.now()}.${fileExt}`;

        try {
            const { error: uploadError } = await supabase.storage.from('chat_images').upload(filePath, file);
            if (uploadError) throw uploadError;

            const { data: urlData } = supabase.storage.from('chat_images').getPublicUrl(filePath);
            
            await supabase.from('messages').insert({
                room_id: roomId,
                sender_id: user.id,
                image_url: urlData.publicUrl,
            });

        } catch (error) {
            alert("Помилка завантаження зображення: " + error.message);
        } finally {
            setIsUploading(false);
            // Скидаємо значення інпуту, щоб можна було завантажити той самий файл знову
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };
    
    return (
        <div style={styles.pageContainer}>
            <header style={styles.header}>
                <Link to="/chats" style={styles.backButton}>
                    <svg width="24" height="24" viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </Link>
                {otherUser && (
                    <div style={styles.headerProfile}>
                        <div style={{position: 'relative'}}>
                            <Avatar url={otherUser.avatar_url} name={otherUser.full_name} size="44px" />
                            {isOnline && <div style={styles.onlineIndicator}></div>}
                        </div>
                        <div style={styles.headerText}>
                            <p style={styles.headerName}>{otherUser.full_name}</p>
                            <p style={styles.headerStatus}>{isOnline ? 'Онлайн' : (otherUser.last_seen ? `Був(ла) ${moment(otherUser.last_seen).fromNow()}`: 'Офлайн')}</p>
                        </div>
                    </div>
                )}
                <div style={{width: '40px'}}></div>
            </header>

            <main style={styles.chatArea}>
                {messages.map(msg => (
                    <div key={msg.id} style={{...styles.messageRow, justifyContent: msg.sender_id === user.id ? 'flex-end' : 'flex-start'}}>
                        <div style={{...styles.messageBubble, ...(msg.sender_id === user.id ? styles.myMessage : styles.theirMessage)}}>
                            {/* ✨ ДОДАНО: Відображення або тексту, або зображення */}
                            {msg.content && <p style={styles.messageContent}>{msg.content}</p>}
                            {msg.image_url && (
                                <a href={msg.image_url} target="_blank" rel="noopener noreferrer">
                                    <img src={msg.image_url} alt="Uploaded content" style={styles.chatImage} />
                                </a>
                            )}
                            <span style={{...styles.messageTime, color: msg.sender_id === user.id ? '#e0e0e0' : '#6c757d'}}>{moment(msg.created_at).format('HH:mm')}</span>
                        </div>
                    </div>
                ))}
                {isUploading && <div style={styles.uploadingIndicator}>Завантаження зображення...</div>}
                <div ref={messagesEndRef} />
            </main>

            <footer style={styles.footer}>
                <form onSubmit={handleSendMessage} style={styles.inputForm}>
                    {/* ✨ ДОДАНО: Кнопка для завантаження файлу */}
                    <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageUpload} style={{ display: 'none' }} />
                    <button type="button" onClick={() => fileInputRef.current.click()} style={styles.attachButton} disabled={isUploading}>
                        <svg width="24" height="24" viewBox="0 0 24 24"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" stroke="currentColor" strokeWidth="2" fill="none"/></svg>
                    </button>
                    <input type="text" value={newMessage} onChange={e => setNewMessage(e.target.value)} style={styles.textInput} placeholder="Напишіть повідомлення..." />
                    <button type="submit" style={styles.sendButton}>
                        <svg width="24" height="24" viewBox="0 0 24 24"><path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-6z" stroke="currentColor" strokeWidth="2" fill="none"/></svg>
                    </button>
                </form>
            </footer>
        </div>
    );
};

// --- СТИЛІ ---
const styles = {
    pageContainer: { display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', backgroundColor: '#f3f4f6', fontFamily: 'system-ui, sans-serif' },
    header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', backgroundColor: 'white', borderBottom: '1px solid #e5e7eb', flexShrink: 0 },
    backButton: { color: '#374151', padding: '8px' },
    headerProfile: { display: 'flex', alignItems: 'center', gap: '12px' },
    onlineIndicator: { position: 'absolute', bottom: 0, right: 0, width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#28a745', border: '2px solid white' },
    headerText: { display: 'flex', flexDirection: 'column' },
    headerName: { margin: 0, fontWeight: '600', fontSize: '1rem', color: '#111827' },
    headerStatus: { margin: 0, fontSize: '0.8rem', color: '#6b7280' },
    chatArea: { flexGrow: 1, overflowY: 'auto', padding: '16px' },
    messageRow: { display: 'flex', width: '100%', marginBottom: '16px' },
    messageBubble: { maxWidth: '75%', padding: '8px', borderRadius: '20px', position: 'relative' },
    myMessage: { backgroundColor: '#007bff', color: 'white', borderBottomRightRadius: '4px' },
    theirMessage: { backgroundColor: 'white', color: 'black', borderBottomLeftRadius: '4px' },
    messageContent: { margin: 0, wordBreak: 'break-word', lineHeight: '1.5', padding: '4px 8px' },
    messageTime: { fontSize: '0.75rem', textAlign: 'right', marginTop: '4px', padding: '0 8px 4px 8px' },
    chatImage: { maxWidth: '100%', maxHeight: '250px', borderRadius: '15px', display: 'block' },
    uploadingIndicator: { alignSelf: 'center', color: '#6b7280', fontStyle: 'italic' },
    footer: { backgroundColor: 'white', borderTop: '1px solid #e5e7eb', flexShrink: 0 },
    inputForm: { display: 'flex', alignItems: 'center', padding: '12px 16px', gap: '12px' },
    textInput: { flexGrow: 1, padding: '12px 16px', borderRadius: '24px', border: '1px solid #d1d5db', fontSize: '1rem', outline: 'none' },
    attachButton: { background: 'transparent', color: '#6b7280', border: 'none', borderRadius: '50%', width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
    sendButton: { background: '#007bff', color: 'white', border: 'none', borderRadius: '50%', width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
};

export default AdminIndividualChatPage;