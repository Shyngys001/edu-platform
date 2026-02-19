import { useState, useEffect, useRef } from 'react';
import { api, getAuth, STATIC_BASE } from '../../utils/api';
import { useT } from '../../utils/i18n';
import toast from 'react-hot-toast';
import { FiSend, FiUsers, FiUser, FiMessageCircle, FiPaperclip, FiMic, FiSquare, FiFile, FiDownload } from 'react-icons/fi';

function isImageUrl(url) {
  return /\.(jpg|jpeg|png|gif|webp)$/i.test(url || '');
}

function MessageContent({ m, t }) {
  const type = m.message_type || 'text';
  const fileUrl = m.file_url ? `${STATIC_BASE}${m.file_url}` : null;

  if (type === 'voice' && fileUrl) {
    return (
      <div>
        {m.content && <div style={{ fontSize: '0.9rem', marginBottom: 6 }}>{m.content}</div>}
        <audio controls src={fileUrl} style={{ maxWidth: '100%', height: 36 }} />
      </div>
    );
  }

  if (type === 'file' && fileUrl) {
    if (isImageUrl(fileUrl)) {
      return (
        <div>
          {m.content && <div style={{ fontSize: '0.9rem', marginBottom: 6 }}>{m.content}</div>}
          <img
            src={fileUrl} alt="attachment"
            style={{ maxWidth: '100%', maxHeight: 240, borderRadius: 8, cursor: 'pointer' }}
            onClick={() => window.open(fileUrl, '_blank')}
          />
        </div>
      );
    }
    const fileName = fileUrl.split('/').pop();
    return (
      <div>
        {m.content && <div style={{ fontSize: '0.9rem', marginBottom: 6 }}>{m.content}</div>}
        <a
          href={fileUrl} target="_blank" rel="noopener noreferrer"
          style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
            background: 'rgba(0,0,0,0.1)', borderRadius: 8, textDecoration: 'none',
            color: 'inherit', fontSize: '0.85rem',
          }}
        >
          <FiFile size={18} />
          <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fileName}</span>
          <FiDownload size={16} />
        </a>
      </div>
    );
  }

  return <div style={{ fontSize: '0.9rem', wordBreak: 'break-word' }}>{m.content}</div>;
}

export default function Messenger() {
  const [tab, setTab] = useState('direct');
  const [contacts, setContacts] = useState([]);
  const [grades, setGrades] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [selectedGrade, setSelectedGrade] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [filterGrade, setFilterGrade] = useState('');
  const [recording, setRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const messagesEnd = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const pollRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const t = useT();
  const uploadPath = '/teacher/messages/upload';

  useEffect(() => {
    loadContacts();
    loadGrades();
  }, []);

  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    if (tab === 'group' && selectedGrade) {
      loadGroupMessages(selectedGrade);
      pollRef.current = setInterval(() => loadGroupMessages(selectedGrade), 5000);
    } else if (tab === 'direct' && selectedContact) {
      loadDirectMessages(selectedContact.id);
      pollRef.current = setInterval(() => loadDirectMessages(selectedContact.id), 5000);
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [tab, selectedContact, selectedGrade]);

  async function loadContacts() {
    try {
      const data = await api.get('/teacher/messages/contacts');
      setContacts(data);
    } catch (e) { toast.error(e.message); }
  }

  async function loadGrades() {
    try {
      const data = await api.get('/teacher/messages/grades');
      setGrades(data);
    } catch (e) { /* silent */ }
  }

  async function loadDirectMessages(userId) {
    try {
      const data = await api.get(`/teacher/messages/direct/${userId}`);
      setMessages(data);
    } catch (e) { /* silent */ }
  }

  async function loadGroupMessages(grade) {
    try {
      const data = await api.get(`/teacher/messages/group/${encodeURIComponent(grade)}`);
      setMessages(data);
    } catch (e) { /* silent */ }
  }

  async function sendMsg(content, messageType = 'text', fileUrl = null) {
    const body = { content, message_type: messageType, file_url: fileUrl };
    if (tab === 'group' && selectedGrade) {
      await api.post(`/teacher/messages/group/${encodeURIComponent(selectedGrade)}`, body);
      loadGroupMessages(selectedGrade);
    } else if (tab === 'direct' && selectedContact) {
      await api.post(`/teacher/messages/direct/${selectedContact.id}`, body);
      loadDirectMessages(selectedContact.id);
    }
  }

  async function sendMessage(e) {
    e.preventDefault();
    if (!input.trim() || sending) return;
    setSending(true);
    try {
      await sendMsg(input.trim());
      setInput('');
    } catch (e) { toast.error(e.message); }
    finally { setSending(false); inputRef.current?.focus(); }
  }

  async function handleFileUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error(t('fileTooBig'));
      return;
    }
    setSending(true);
    try {
      const res = await api.uploadFile(uploadPath, file);
      await sendMsg(file.name, 'file', res.url);
    } catch (e) { toast.error(e.message); }
    finally {
      setSending(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const file = new File([blob], `voice_${Date.now()}.webm`, { type: 'audio/webm' });

        setSending(true);
        try {
          const res = await api.uploadFile(uploadPath, file);
          await sendMsg('', 'voice', res.url);
        } catch (e) { toast.error(e.message); }
        finally { setSending(false); }
      };

      mediaRecorder.start();
      setRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => setRecordingTime(t => t + 1), 1000);
    } catch (e) {
      toast.error(t('microphoneError'));
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setRecording(false);
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }

  function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  const filteredContacts = filterGrade
    ? contacts.filter(c => c.grade === filterGrade)
    : contacts;

  const uniqueGradesFromContacts = [...new Set(contacts.map(c => c.grade).filter(Boolean))].sort();
  const totalUnread = contacts.reduce((sum, c) => sum + (c.unread || 0), 0);

  return (
    <div>
      <h1 style={{ marginBottom: 16 }}>
        <FiMessageCircle style={{ verticalAlign: 'middle', marginRight: 8 }} />
        {t('messenger')}
      </h1>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 16, height: 'calc(100vh - 160px)' }}>
        {/* Left panel */}
        <div className="card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
            <button
              onClick={() => setTab('direct')}
              style={{
                flex: 1, padding: '12px 8px', border: 'none', cursor: 'pointer',
                background: tab === 'direct' ? 'var(--primary)' : 'transparent',
                color: tab === 'direct' ? 'white' : 'var(--text-secondary)',
                fontWeight: 600, fontSize: '0.85rem', transition: 'all 0.15s',
              }}
            >
              <FiUser style={{ verticalAlign: 'middle', marginRight: 4 }} />
              {t('directMessages')}
              {totalUnread > 0 && <span style={{
                background: '#EF4444', color: 'white', borderRadius: 10,
                padding: '2px 6px', fontSize: '0.7rem', marginLeft: 4,
              }}>{totalUnread}</span>}
            </button>
            <button
              onClick={() => { setTab('group'); setSelectedContact(null); }}
              style={{
                flex: 1, padding: '12px 8px', border: 'none', cursor: 'pointer',
                background: tab === 'group' ? 'var(--primary)' : 'transparent',
                color: tab === 'group' ? 'white' : 'var(--text-secondary)',
                fontWeight: 600, fontSize: '0.85rem', transition: 'all 0.15s',
              }}
            >
              <FiUsers style={{ verticalAlign: 'middle', marginRight: 4 }} />
              {t('groupChat')}
            </button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {tab === 'direct' && (
              <>
                <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)' }}>
                  <select
                    className="form-input"
                    value={filterGrade}
                    onChange={e => setFilterGrade(e.target.value)}
                    style={{ fontSize: '0.8rem', padding: '6px 8px' }}
                  >
                    <option value="">{t('allGrades')}</option>
                    {uniqueGradesFromContacts.map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
                {filteredContacts.map(c => (
                  <div
                    key={c.id}
                    onClick={() => { setSelectedContact(c); setTab('direct'); }}
                    style={{
                      padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid var(--border)',
                      background: selectedContact?.id === c.id ? 'var(--bg)' : 'transparent',
                      transition: 'background 0.15s',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{c.full_name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{c.grade || ''}</div>
                      </div>
                      {c.unread > 0 && <span style={{
                        background: 'var(--primary)', color: 'white', borderRadius: 10,
                        padding: '2px 8px', fontSize: '0.7rem', fontWeight: 700,
                      }}>{c.unread}</span>}
                    </div>
                    {c.last_message && (
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {c.last_message}
                      </div>
                    )}
                  </div>
                ))}
                {filteredContacts.length === 0 && (
                  <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    {t('noStudentsFound')}
                  </div>
                )}
              </>
            )}
            {tab === 'group' && grades.map(g => (
              <div
                key={g}
                onClick={() => setSelectedGrade(g)}
                style={{
                  padding: '14px 16px', cursor: 'pointer', borderBottom: '1px solid var(--border)',
                  background: selectedGrade === g ? 'var(--bg)' : 'transparent',
                  transition: 'background 0.15s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FiUsers size={16} />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{t('classChat')} {g}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {contacts.filter(c => c.grade === g).length} {t('studentsCount')}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right panel — chat */}
        <div className="card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', fontWeight: 600 }}>
            {tab === 'group' && selectedGrade ? (
              <><FiUsers style={{ verticalAlign: 'middle', marginRight: 8 }} />{t('classChat')} {selectedGrade}</>
            ) : tab === 'direct' && selectedContact ? (
              <><FiUser style={{ verticalAlign: 'middle', marginRight: 8 }} />{selectedContact.full_name} <span style={{ fontWeight: 400, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>({selectedContact.grade})</span></>
            ) : t('selectContact')}
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
            {messages.length === 0 && (
              <div className="empty-state">
                <div className="icon"><FiMessageCircle size={32} /></div>
                <p>{t('noMessages')}</p>
              </div>
            )}
            {messages.map(m => (
              <div key={m.id} style={{
                display: 'flex', justifyContent: m.is_mine ? 'flex-end' : 'flex-start',
                marginBottom: 8,
              }}>
                <div style={{
                  maxWidth: '70%', padding: '10px 14px', borderRadius: 12,
                  background: m.is_mine ? 'var(--primary)' : 'var(--bg)',
                  color: m.is_mine ? 'white' : 'var(--text)',
                }}>
                  {!m.is_mine && (
                    <div style={{ fontSize: '0.7rem', fontWeight: 700, marginBottom: 2, opacity: 0.8 }}>
                      {m.sender_name} {m.sender_role === 'teacher' ? '('+t('teacher')+')' : ''}
                    </div>
                  )}
                  <MessageContent m={m} t={t} />
                  <div style={{ fontSize: '0.65rem', opacity: 0.6, marginTop: 4, textAlign: 'right' }}>
                    {m.created_at ? new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEnd} />
          </div>

          {/* Input area */}
          {((tab === 'group' && selectedGrade) || (tab === 'direct' && selectedContact)) && (
            <div style={{ borderTop: '1px solid var(--border)', padding: 12 }}>
              {recording ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 8, flex: 1,
                    padding: '10px 16px', background: 'var(--bg)', borderRadius: 8,
                  }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#EF4444', animation: 'pulse 1s infinite' }} />
                    <span style={{ fontWeight: 600, color: '#EF4444' }}>{t('recording')}</span>
                    <span style={{ color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{formatTime(recordingTime)}</span>
                  </div>
                  <button
                    className="btn"
                    onClick={stopRecording}
                    style={{ background: '#EF4444', color: 'white', borderRadius: '50%', width: 40, height: 40, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <FiSquare size={16} />
                  </button>
                </div>
              ) : (
                <form onSubmit={sendMessage} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input type="file" ref={fileInputRef} onChange={handleFileUpload} style={{ display: 'none' }} />
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={sending}
                    style={{ padding: '8px 10px', flexShrink: 0 }}
                    title={t('attachFile')}
                  >
                    <FiPaperclip size={18} />
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={startRecording}
                    disabled={sending}
                    style={{ padding: '8px 10px', flexShrink: 0 }}
                    title={t('voiceMessage')}
                  >
                    <FiMic size={18} />
                  </button>
                  <input
                    ref={inputRef}
                    className="form-input"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder={t('typeYourMessage')}
                    disabled={sending}
                    style={{ flex: 1 }}
                  />
                  <button className="btn btn-primary" type="submit" disabled={sending || !input.trim()} style={{ padding: '8px 12px', flexShrink: 0 }}>
                    <FiSend size={18} />
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
