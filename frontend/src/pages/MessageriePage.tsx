// ============================================
// Messagerie interne (contacts autorisés + fil temps réel Socket.IO)
// ============================================

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { MessageCircle, Send, User } from 'lucide-react';
import api from '../lib/api';
import { useAuthStore } from '../stores/authStore';
import toast from 'react-hot-toast';
import LoadingState from '../components/common/LoadingState';

type Contact = {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  poste?: string;
  role: string;
  departementId?: number;
  departement?: { id: number; nom: string; code: string };
};

type ChatMessage = {
  id: number;
  senderId: number;
  recipientId: number;
  body: string;
  createdAt: string;
  sender?: { id: number; nom: string; prenom: string; role: string };
};

export default function MessageriePage() {
  const { user, accessToken } = useAuthStore();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [peerId, setPeerId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingThread, setLoadingThread] = useState(false);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const peerIdRef = useRef<number | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  peerIdRef.current = peerId;

  const mergeMessage = useCallback((m: ChatMessage) => {
    setMessages((prev) => {
      if (prev.some((x) => x.id === m.id)) return prev;
      return [...prev, m].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    });
  }, []);

  useEffect(() => {
    setLoadingContacts(true);
    api
      .get('/messages/contacts')
      .then((r) => setContacts(r.data.data || []))
      .catch(() => {
        toast.error('Impossible de charger les contacts');
        setContacts([]);
      })
      .finally(() => setLoadingContacts(false));
  }, []);

  useEffect(() => {
    if (!accessToken) return;
    const socket = io(typeof window !== 'undefined' ? window.location.origin : '', {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      auth: { token: accessToken },
    });
    socketRef.current = socket;
    socket.on('connect_error', () => {
      toast.error('Connexion temps réel indisponible (vérifiez le serveur)');
    });
    socket.on('new_message', (payload: ChatMessage) => {
      const me = user?.id;
      const p = peerIdRef.current;
      if (!me || !p) return;
      const involves =
        (payload.senderId === me && payload.recipientId === p) ||
        (payload.senderId === p && payload.recipientId === me);
      if (involves) mergeMessage(payload);
    });
    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [accessToken, user?.id, mergeMessage]);

  useEffect(() => {
    if (!peerId) {
      setMessages([]);
      return;
    }
    setLoadingThread(true);
    api
      .get(`/messages/thread/${peerId}`)
      .then((r) => setMessages(r.data.data || []))
      .then(() => window.dispatchEvent(new Event('messages:updated')))
      .catch(() => {
        toast.error('Impossible de charger la conversation');
        setMessages([]);
      })
      .finally(() => setLoadingThread(false));
  }, [peerId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, peerId]);

  const peer = useMemo(() => contacts.find((c) => c.id === peerId), [contacts, peerId]);

  const send = async () => {
    if (!peerId || !draft.trim()) return;
    setSending(true);
    try {
      const res = await api.post('/messages', { recipientId: peerId, body: draft.trim() });
      const created = res.data.data as ChatMessage;
      if (created) mergeMessage(created);
      setDraft('');
      window.dispatchEvent(new Event('messages:updated'));
    } catch (e: unknown) {
      const msg =
        typeof e === 'object' && e !== null && 'response' in e
          ? (e as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      toast.error(msg || 'Envoi impossible');
    } finally {
      setSending(false);
    }
  };

  if (loadingContacts) {
    return <LoadingState message="Chargement des contacts…" />;
  }

  const initials = (c: Contact) =>
    `${c.prenom?.[0] ?? ''}${c.nom?.[0] ?? ''}`.toUpperCase() || '?';

  return (
    <div className="space-y-5 animate-fadeIn min-h-[calc(100vh-7rem)] flex flex-col">
      <div className="page-header shrink-0">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-slate-800 to-indigo-700 text-white shadow-md">
            <MessageCircle size={20} strokeWidth={2} />
          </div>
          <div>
            <h1 className="page-title">Messagerie</h1>
            <p className="page-subtitle text-slate-600">Échanges sécurisés avec vos contacts autorisés.</p>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 flex flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_8px_30px_rgb(15,23,42,0.06)] ring-1 ring-slate-950/[0.04]">
        <div className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-[minmax(240px,320px)_1fr]">
          <aside className="flex max-h-[40vh] flex-col border-b border-slate-100 bg-slate-50/80 md:max-h-none md:border-b-0 md:border-r">
            <div className="border-b border-slate-100 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Contacts</p>
              <p className="mt-0.5 text-xs text-slate-400">{contacts.length} disponible(s)</p>
            </div>
            <div className="flex-1 overflow-y-auto">
              {contacts.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 px-6 py-12 text-center">
                  <User className="text-slate-300" size={36} strokeWidth={1.25} />
                  <p className="text-sm font-medium text-slate-600">Aucun contact</p>
                  <p className="text-xs text-slate-400">Les contacts apparaissent selon votre rôle et département.</p>
                </div>
              ) : (
                <ul className="p-2">
                  {contacts.map((c) => {
                    const active = peerId === c.id;
                    return (
                      <li key={c.id} className="mb-1">
                        <button
                          type="button"
                          onClick={() => setPeerId(c.id)}
                          className={`flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition ${
                            active
                              ? 'bg-white shadow-sm ring-1 ring-indigo-200/80'
                              : 'hover:bg-white/80'
                          }`}
                        >
                          <span
                            className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                              active ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {initials(c)}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate font-semibold text-slate-900">
                              {c.prenom} {c.nom}
                            </span>
                            <span className="block truncate text-xs text-slate-500">{c.poste || c.role}</span>
                            {c.departement && (
                              <span className="mt-0.5 block truncate text-[11px] font-medium text-indigo-600/90">
                                {c.departement.nom}
                              </span>
                            )}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </aside>

          <section className="flex min-h-[50vh] flex-1 flex-col bg-gradient-to-b from-slate-50/90 to-white md:min-h-0">
            {!peerId && (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 px-8 py-16 text-center">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <MessageCircle className="text-indigo-500" size={32} />
                </div>
                <p className="text-sm font-semibold text-slate-700">Choisissez une conversation</p>
                <p className="max-w-sm text-xs leading-relaxed text-slate-500">
                  Sélectionnez un contact dans la liste pour afficher l’historique et envoyer un message.
                </p>
              </div>
            )}
            {peerId && (
              <>
                <header className="shrink-0 border-b border-slate-100 bg-white/95 px-5 py-4 backdrop-blur-sm">
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-800">
                      {peer ? initials(peer) : '?'}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-bold text-slate-900">
                        {peer ? `${peer.prenom} ${peer.nom}` : `Utilisateur #${peerId}`}
                      </p>
                      <p className="truncate text-xs text-slate-500">{peer?.email}</p>
                    </div>
                  </div>
                </header>
                <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4 sm:px-5">
                  {loadingThread ? (
                    <LoadingState message="Chargement de la conversation…" />
                  ) : (
                    messages.map((m) => {
                      const mine = m.senderId === user?.id;
                      return (
                        <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                          <div
                            className={`max-w-[min(100%,28rem)] rounded-2xl px-3.5 py-2.5 text-sm shadow-sm ${
                              mine
                                ? 'rounded-br-md bg-indigo-600 text-white shadow-indigo-600/15'
                                : 'rounded-bl-md border border-slate-200/80 bg-white text-slate-800'
                            }`}
                          >
                            {!mine && (
                              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                                {m.sender?.prenom} {m.sender?.nom}
                              </p>
                            )}
                            <p className="whitespace-pre-wrap break-words leading-relaxed">{m.body}</p>
                            <p
                              className={`mt-1.5 text-[10px] tabular-nums ${
                                mine ? 'text-indigo-100/90' : 'text-slate-400'
                              }`}
                            >
                              {new Date(m.createdAt).toLocaleString('fr-FR', {
                                day: '2-digit',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={bottomRef} />
                </div>
                <footer className="shrink-0 border-t border-slate-100 bg-white p-3 sm:p-4">
                  <div className="flex gap-2 rounded-xl border border-slate-200 bg-slate-50/50 p-1.5 focus-within:border-indigo-300 focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-500/20">
                    <textarea
                      className="max-h-36 min-h-[48px] flex-1 resize-y border-0 bg-transparent px-2 py-2 text-sm text-slate-800 outline-none placeholder:text-slate-400"
                      placeholder="Écrivez votre message… (Entrée pour envoyer, Maj+Entrée pour une ligne)"
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          void send();
                        }
                      }}
                    />
                    <button
                      type="button"
                      disabled={sending || !draft.trim()}
                      onClick={() => void send()}
                      className="inline-flex shrink-0 items-center justify-center gap-2 self-end rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-45"
                    >
                      <Send size={18} />
                      <span className="hidden sm:inline">Envoyer</span>
                    </button>
                  </div>
                </footer>
              </>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
