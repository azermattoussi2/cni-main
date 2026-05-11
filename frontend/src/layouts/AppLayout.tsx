// ============================================
// Fichier : layouts/AppLayout.tsx
// Description : Layout principal avec sidebar + topbar
// Affiche la navigation selon le rôle connecté
// ============================================

import { useState, useEffect, useRef, useCallback } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import {
  LayoutDashboard, BookOpen, UserCheck, BarChart3,
  LogOut, Menu, X, Bell, ChevronDown, GraduationCap,
  Award, CalendarDays, ClipboardCheck, MessageSquare, UserPlus, Users,
  RefreshCw, AlertTriangle, Info, CheckCircle, ChevronRight,
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useLangStore } from '../stores/langStore';
import type { Role } from '../types';
import toast from 'react-hot-toast';
import BrandLogo from '../components/common/BrandLogo';

type NavItem = { label: string; icon: any; path: string };

const EMPLOYE_NAV: NavItem[] = [
  { label: 'Tableau de bord', icon: LayoutDashboard, path: '/app/dashboard' },
  { label: 'Catalogue formations', icon: BookOpen, path: '/app/formations' },
  { label: 'Devenir formateur', icon: Award, path: '/app/formateurs/profil' },
  { label: 'Stages suivis', icon: GraduationCap, path: '/app/stagiaires' },
  { label: 'Calendrier', icon: CalendarDays, path: '/app/calendar' },
  { label: 'Messagerie', icon: MessageSquare, path: '/app/messages' },
];

// Navigation par rôle
const NAV_BY_ROLE: Record<string, NavItem[]> = {
  Direction_RH: [
    { label: 'Tableau de bord', icon: LayoutDashboard, path: '/app/dashboard' },
    { label: 'Comptes & rôles (RH)', icon: UserPlus, path: '/app/rh/creer-compte' },
    { label: 'Candidatures / Stages', icon: GraduationCap, path: '/app/stagiaires' },
    { label: 'Formateurs', icon: UserCheck, path: '/app/formateurs' },
    { label: 'Formations', icon: BookOpen, path: '/app/formations' },
    { label: 'Validations inscriptions', icon: ClipboardCheck, path: '/app/formations/validations' },
    { label: 'Rapports', icon: BarChart3, path: '/app/reporting' },
    { label: 'Calendrier', icon: CalendarDays, path: '/app/calendar' },
    { label: 'Messagerie', icon: MessageSquare, path: '/app/messages' },
  ],
  Manager: [
    { label: 'Tableau de bord', icon: LayoutDashboard, path: '/app/dashboard' },
    { label: 'Mon équipe & comptes', icon: Users, path: '/app/manager/comptes' },
    { label: 'Stagiaires', icon: GraduationCap, path: '/app/stagiaires' },
    { label: 'Formateurs', icon: UserCheck, path: '/app/formateurs' },
    { label: 'Formations', icon: BookOpen, path: '/app/formations' },
    { label: 'Validations', icon: ClipboardCheck, path: '/app/formations/validations' },
    { label: 'Rapports', icon: BarChart3, path: '/app/reporting' },
    { label: 'Calendrier', icon: CalendarDays, path: '/app/calendar' },
    { label: 'Messagerie', icon: MessageSquare, path: '/app/messages' },
  ],
  Employe: EMPLOYE_NAV,
  Formateur_Interne: EMPLOYE_NAV,
  Formateur_Externe: [
    { label: 'Tableau de bord', icon: LayoutDashboard, path: '/app/dashboard' },
    { label: 'Formations assignées', icon: BookOpen, path: '/app/formations' },
    { label: 'Mon profil formateur', icon: Award, path: '/app/formateurs/profil' },
    { label: 'Calendrier', icon: CalendarDays, path: '/app/calendar' },
    { label: 'Messagerie', icon: MessageSquare, path: '/app/messages' },
  ],
  Stagiaire: [
    { label: 'Mon stage', icon: GraduationCap, path: '/app/dashboard' },
  ],
};

const ROLE_COLORS: Record<string, string> = {
  Direction_RH: 'bg-purple-100 text-purple-700',
  Manager: 'bg-blue-100 text-blue-700',
  Employe: 'bg-green-100 text-green-700',
  Formateur_Interne: 'bg-orange-100 text-orange-700',
  Formateur_Externe: 'bg-amber-100 text-amber-700',
  Stagiaire: 'bg-cyan-100 text-cyan-700',
};

type NotifItem = {
  id: string;
  title: string;
  description: string;
  href: string;
  kind?: 'info' | 'warning' | 'success';
};

function notifIcon(kind: NotifItem['kind']) {
  if (kind === 'success') return <CheckCircle size={18} className="text-emerald-600" />;
  if (kind === 'warning') return <AlertTriangle size={18} className="text-amber-600" />;
  return <Info size={18} className="text-sky-600" />;
}

function notifAccent(kind: NotifItem['kind']) {
  if (kind === 'success') return 'border-l-emerald-500 bg-emerald-50/40';
  if (kind === 'warning') return 'border-l-amber-500 bg-amber-50/35';
  return 'border-l-sky-500 bg-sky-50/30';
}

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifs, setNotifs] = useState<NotifItem[]>([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const notifRef = useRef<HTMLDivElement>(null);
  const { user, logout } = useAuthStore();
  const { lang, toggle } = useLangStore();
  const navigate = useNavigate();

  const loadNotifications = useCallback((opts?: { silent?: boolean }) => {
    const silent = opts?.silent ?? false;
    if (!silent) setNotifLoading(true);
    api
      .get('/notifications/feed')
      .then((r) => {
        const raw = r.data?.data;
        setNotifs(Array.isArray(raw) ? raw : []);
      })
      .catch(() => setNotifs([]))
      .finally(() => {
        if (!silent) setNotifLoading(false);
      });
  }, []);

  const loadUnreadMessages = useCallback(() => {
    api
      .get('/messages/unread-count')
      .then((r) => setUnreadMessages(Number(r.data?.data?.count || 0)))
      .catch(() => setUnreadMessages(0));
  }, []);

  useEffect(() => {
    loadNotifications({ silent: true });
    loadUnreadMessages();
  }, [user?.id, user?.role, loadNotifications, loadUnreadMessages]);

  /** Rafraîchir le badge même sans ouvrir le panneau (aligné flux / feed API) */
  useEffect(() => {
    if (!user?.id) return;
    const t = window.setInterval(() => {
      loadNotifications({ silent: true });
      loadUnreadMessages();
    }, 120_000);
    return () => window.clearInterval(t);
  }, [user?.id, loadNotifications, loadUnreadMessages]);

  useEffect(() => {
    if (!notifOpen && !profileOpen) return;
    const close = (e: MouseEvent) => {
      const el = notifRef.current;
      if (el && !el.contains(e.target as Node)) {
        setNotifOpen(false);
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [notifOpen, profileOpen]);

  useEffect(() => {
    const handler = () => {
      loadUnreadMessages();
      loadNotifications({ silent: true });
    };
    window.addEventListener('messages:updated', handler as EventListener);
    return () => window.removeEventListener('messages:updated', handler as EventListener);
  }, [loadNotifications, loadUnreadMessages]);

  const role = user?.role as Role;
  const navItems = NAV_BY_ROLE[role] || NAV_BY_ROLE['Employe'];

  const handleLogout = async () => {
    await logout();
    toast.success('Déconnexion réussie');
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 to-blue-50/40 overflow-hidden">
      {/* ============ SIDEBAR ============ */}
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-16'
        } bg-white/95 backdrop-blur border-r border-gray-100 flex flex-col transition-all duration-300 flex-shrink-0 shadow-sm`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-4 border-b border-gray-100 gap-3">
          <BrandLogo className="w-8 h-8 flex-shrink-0" />
          {sidebarOpen && (
            <div>
              <p className="text-sm font-bold text-gray-900">CNI - Stages & Formations</p>
              <p className="text-[10px] text-gray-400 leading-tight">Centre National de l'Informatique</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-2">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `sidebar-item mb-1 ${isActive ? 'active' : ''}`
              }
              title={!sidebarOpen ? item.label : undefined}
            >
              <span className="relative">
                <item.icon size={18} className="flex-shrink-0" />
                {item.path === '/app/messages' && unreadMessages > 0 && (
                  <span className="absolute -right-2 -top-2 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white" />
                )}
              </span>
              {sidebarOpen && <span>{item.label}</span>}
              {sidebarOpen && item.path === '/app/messages' && unreadMessages > 0 && (
                <span className="ml-auto rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                  {unreadMessages > 9 ? '9+' : unreadMessages}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User info bottom */}
        {sidebarOpen && user && (
          <div className="p-4 border-t border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cni-blue to-cni-orange flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {user.prenom?.[0]}{user.nom?.[0]}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {user.prenom} {user.nom}
                </p>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${ROLE_COLORS[role] || 'bg-gray-100 text-gray-600'}`}>
                  {role?.replace('_', ' ')}
                </span>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* ============ MAIN CONTENT ============ */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="relative z-[80] h-16 bg-white/85 backdrop-blur border-b border-gray-100 flex items-center justify-between px-4 flex-shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
            >
              {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
            <div className="hidden md:flex items-center gap-2">
              <BrandLogo className="w-7 h-7" />
              <span className="text-sm font-bold text-gray-800">CNI - Stages & Formations</span>
            </div>
          </div>

          <div ref={notifRef} className="flex items-center gap-2">
            {/* Langue */}
            <button
              type="button"
              onClick={toggle}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-gray-600"
            >
              {lang === 'fr' ? '🇹🇳 عربي' : '🇫🇷 Français'}
            </button>

            {/* Notifications */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setNotifOpen((o) => !o);
                  if (!notifOpen) loadNotifications({ silent: true });
                  loadUnreadMessages();
                  setProfileOpen(false);
                }}
                className={`relative rounded-xl p-2.5 text-slate-600 transition-colors hover:bg-slate-100 ${
                  notifOpen ? 'bg-slate-100 ring-2 ring-slate-200/80' : ''
                }`}
                aria-expanded={notifOpen}
                aria-label="Notifications"
              >
                <Bell size={19} strokeWidth={2} />
                {notifs.length > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-[19px] min-w-[19px] items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-red-500 px-1 text-[10px] font-bold text-white shadow-sm">
                    {notifs.length > 9 ? '9+' : notifs.length}
                  </span>
                )}
              </button>
              {notifOpen && (
                <div className="absolute right-0 top-full z-[100] mt-2 w-[min(100vw-1.5rem,22rem)] overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_20px_50px_-12px_rgba(15,23,42,0.25)] ring-1 ring-slate-950/[0.06]">
                  <div className="flex items-center justify-between gap-2 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-4 py-3">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">Centre</p>
                      <p className="text-sm font-bold text-slate-900">Notifications</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => loadNotifications()}
                      disabled={notifLoading}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50"
                      title="Actualiser"
                    >
                      <RefreshCw size={13} className={notifLoading ? 'animate-spin' : ''} />
                      Actualiser
                    </button>
                  </div>
                  <div className="max-h-[min(65vh,380px)] overflow-y-auto">
                    {notifLoading && notifs.length === 0 ? (
                      <p className="px-4 py-8 text-center text-sm text-slate-500">Chargement…</p>
                    ) : notifs.length === 0 ? (
                      <div className="px-5 py-10 text-center">
                        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                          <Bell size={22} />
                        </div>
                        <p className="text-sm font-medium text-slate-700">Aucune alerte</p>
                        <p className="mt-1 text-xs leading-relaxed text-slate-500">
                          Les actions à traiter apparaîtront ici automatiquement.
                        </p>
                      </div>
                    ) : (
                      <ul className="divide-y divide-slate-100 p-1.5">
                        {notifs.map((n) => (
                          <li key={n.id}>
                            <button
                              type="button"
                              onClick={() => {
                                navigate(n.href);
                                setNotifOpen(false);
                              }}
                              className={`flex w-full gap-3 rounded-xl border-l-[3px] px-3 py-3 text-left transition hover:bg-slate-50/90 ${notifAccent(n.kind)}`}
                            >
                              <span className="mt-0.5 flex-shrink-0">{notifIcon(n.kind)}</span>
                              <span className="min-w-0 flex-1">
                                <span className="flex items-start justify-between gap-2">
                                  <span className="text-sm font-semibold leading-snug text-slate-900">{n.title}</span>
                                  <ChevronRight size={16} className="mt-0.5 flex-shrink-0 text-slate-300" />
                                </span>
                                <span className="mt-1 block text-xs leading-relaxed text-slate-600">{n.description}</span>
                              </span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setProfileOpen(!profileOpen);
                  setNotifOpen(false);
                }}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cni-blue to-cni-orange flex items-center justify-center text-white text-xs font-bold">
                  {user?.prenom?.[0]}{user?.nom?.[0]}
                </div>
                <span className="text-sm font-medium text-gray-700 hidden sm:block">
                  {user?.prenom}
                </span>
                <ChevronDown size={14} className="text-gray-400" />
              </button>

              {profileOpen && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-[100]">
                  <div className="px-4 py-2 border-b border-gray-50">
                    <p className="text-sm font-semibold text-gray-900">{user?.prenom} {user?.nom}</p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut size={14} />
                    {lang === 'fr' ? 'Se déconnecter' : 'تسجيل الخروج'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="relative z-0 flex-1 overflow-y-auto p-4 sm:p-6 animate-fadeIn">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
