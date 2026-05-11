// ============================================
// Fichier : pages/DashboardEmploye.tsx
// Design : Premium Employee Dashboard
// ============================================

import { useState, useEffect, useRef } from 'react';
import {
  BookOpen, Award, Clock, TrendingUp, ChevronRight,
  CheckCircle, Star, Download, ArrowUpRight, Zap,
  Layers, Target, Users, MessageCircle, Calendar,
  Activity,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../lib/api';
import { useAuthStore } from '../stores/authStore';
import toast from 'react-hot-toast';
import LoadingState from '../components/common/LoadingState';
import EmptyState from '../components/common/EmptyState';
import { exportPageToPdf } from '../utils/downloadPdf';

// ── Styles ───────────────────────────────────────
const S = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

  .emp-root { font-family:'Plus Jakarta Sans',sans-serif; }
  .emp-root h1,h2,h3,h4 { font-family:'Outfit',sans-serif; }

  @keyframes slideUp { from{opacity:0;transform:translateY(18px);} to{opacity:1;transform:translateY(0);} }
  @keyframes pulse   { 0%,100%{transform:scale(1);} 50%{transform:scale(1.05);} }
  @keyframes glow    { 0%,100%{box-shadow:0 0 0 0 rgba(37,99,235,.3);} 50%{box-shadow:0 0 0 8px rgba(37,99,235,0);} }

  .emp-kpi {
    background:white; border-radius:20px;
    border:1px solid rgba(0,0,0,.06);
    padding:20px 22px; overflow:hidden; position:relative;
    transition:all .3s cubic-bezier(.4,0,.2,1);
    animation:slideUp .4s ease both;
  }
  .emp-kpi:hover { transform:translateY(-4px); box-shadow:0 20px 48px rgba(0,0,0,.1); }

  .emp-card {
    background:white; border-radius:20px;
    border:1px solid rgba(0,0,0,.06);
    padding:22px;
    transition:box-shadow .3s;
    animation:slideUp .4s ease both;
  }
  .emp-card:hover { box-shadow:0 8px 28px rgba(0,0,0,.07); }

  .formation-item {
    display:flex; align-items:center; gap:14px;
    padding:14px 16px; border-radius:14px;
    background:#f8fafc; border:1px solid rgba(0,0,0,.04);
    transition:all .2s; cursor:pointer;
  }
  .formation-item:hover { background:#eff6ff; border-color:rgba(37,99,235,.15); transform:translateX(4px); }

  .cert-item {
    display:flex; align-items:center; gap:10px;
    padding:10px 14px; border-radius:12px;
    background:linear-gradient(135deg,#fffbeb,#fef3c7);
    border:1px solid rgba(245,158,11,.15);
    transition:all .2s;
  }
  .cert-item:hover { transform:translateX(4px); box-shadow:0 4px 12px rgba(245,158,11,.15); }

  .catalogue-card {
    padding:16px; border-radius:16px;
    background:#f8fafc; border:1px solid rgba(0,0,0,.05);
    transition:all .25s; cursor:pointer;
  }
  .catalogue-card:hover { background:#eff6ff; border-color:rgba(37,99,235,.2); transform:translateY(-3px); box-shadow:0 8px 24px rgba(37,99,235,.1); }

  .tag-label { font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#94a3b8;margin-bottom:6px;display:block; }

  .pill { display:inline-flex;align-items:center;gap:5px;padding:3px 10px;border-radius:100px;font-size:11px;font-weight:700; }

  .btn-emp-primary {
    display:inline-flex;align-items:center;gap:8px;
    padding:10px 20px;border-radius:12px;border:none;cursor:pointer;
    font-weight:700;font-size:13px;transition:all .2s;
    background:linear-gradient(135deg,#2563eb,#1d4ed8);color:white;
    box-shadow:0 4px 14px rgba(37,99,235,.35);
  }
  .btn-emp-primary:hover { transform:translateY(-1px);box-shadow:0 6px 20px rgba(37,99,235,.45); }

  .btn-emp-sec {
    display:inline-flex;align-items:center;gap:7px;
    padding:8px 16px;border-radius:11px;cursor:pointer;
    font-weight:600;font-size:12px;transition:all .2s;
    background:white;color:#374151;border:1px solid rgba(0,0,0,.1);
  }
  .btn-emp-sec:hover { background:#f8fafc;transform:translateY(-1px);box-shadow:0 3px 10px rgba(0,0,0,.07); }

  .emp-g4 { display:grid;grid-template-columns:repeat(4,1fr);gap:14px; }
  .emp-g3 { display:grid;grid-template-columns:2fr 1fr;gap:20px; }
  .emp-g-cat { display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px; }
  @media(max-width:1100px){.emp-g4{grid-template-columns:1fr 1fr;}}
  @media(max-width:700px){.emp-g4{grid-template-columns:1fr 1fr;}.emp-g3{grid-template-columns:1fr;}}

  .stagiaire-row {
    display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:12px;
    padding:14px 16px;border-radius:14px;
    background:#f8fafc;border:1px solid rgba(0,0,0,.04);
    transition:all .2s;
  }
  .stagiaire-row:hover { background:#eff6ff;border-color:rgba(37,99,235,.15); }

  .progress-ring { position:relative; display:inline-flex;align-items:center;justify-content:center; }
  .notif-badge {
    display:inline-flex;align-items:center;gap:6px;
    padding:8px 16px;border-radius:12px;
    background:#fff1f2;border:1px solid #fecdd3;
    color:#e11d48;font-size:13px;font-weight:700;cursor:pointer;
    transition:all .2s;
  }
  .notif-badge:hover { background:#ffe4e6;transform:translateY(-1px); }

  .badge-pill {
    display:inline-flex;align-items:center;gap:4px;
    padding:4px 10px;border-radius:100px;
    font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.5px;
  }
`;

function KpiCard({ label, value, icon: Icon, color, bg, sub, progress, delay = 0 }: any) {
  return (
    <div className="emp-kpi" style={{ animationDelay: `${delay}ms` }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg,${color},${color}55)`, borderRadius: '20px 20px 0 0' }} />
      <div style={{ position: 'absolute', top: -25, right: -15, width: 70, height: 70, borderRadius: '50%', background: bg, opacity: .4 }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={18} style={{ color }} />
        </div>
      </div>
      <div style={{ fontSize: 28, fontWeight: 900, color: '#0f172a', letterSpacing: '-0.8px', lineHeight: 1, marginBottom: 4 }}>{value}</div>
      <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{sub}</div>}
      {progress !== undefined && (
        <div style={{ height: 4, borderRadius: 100, background: '#f1f5f9', overflow: 'hidden', marginTop: 10 }}>
          <div style={{ height: '100%', borderRadius: 100, width: `${progress}%`, background: `linear-gradient(90deg,${color},${color}88)`, transition: 'width .8s' }} />
        </div>
      )}
    </div>
  );
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, padding: '10px 14px', boxShadow: '0 8px 24px rgba(0,0,0,.1)' }}>
      <p style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{p.name}: {p.value}</p>
      ))}
    </div>
  );
}

export default function DashboardEmploye() {
  const pdfRootRef = useRef<HTMLDivElement>(null);
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [tuteurData, setTuteurData] = useState<{ stagiairesSuivis: any[] } | null>(null);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/reporting/employe').then(r => setData(r.data.data)).catch(() => setData(getMockEmploye())).finally(() => setLoading(false));
    api.get('/reporting/tuteur').then(r => setTuteurData(r.data?.data || { stagiairesSuivis: [] })).catch(() => setTuteurData({ stagiairesSuivis: [] }));
    api.get('/messages/unread-count').then(r => setUnreadMessages(Number(r.data?.data?.count || 0))).catch(() => setUnreadMessages(0));
  }, []);

  const sendPlanning = async (id: number) => {
    try { await api.post(`/stagiaires/${id}/workflow/send-schedule`, {}); toast.success('Planning envoyé.'); }
    catch (e: any) { toast.error(e.response?.data?.message || 'Erreur.'); }
  };
  const closeWithNote = async (id: number) => {
    const noteRaw = window.prompt('Note finale /5');
    if (!noteRaw) return;
    const note = Number(noteRaw);
    if (!Number.isFinite(note) || note < 0 || note > 5) { toast.error('Note invalide.'); return; }
    const commentaire = window.prompt('Commentaire final');
    if (!commentaire || commentaire.trim().length < 3) { toast.error('Commentaire requis.'); return; }
    try {
      await api.post(`/stagiaires/${id}/workflow/close-stage`, { noteFinale: note, evaluationFinale: commentaire.trim() });
      toast.success('Stage clôturé.');
    } catch (e: any) { toast.error(e.response?.data?.message || 'Erreur.'); }
  };
  const handleExportPdf = async () => {
    const el = pdfRootRef.current; if (!el) return;
    const tid = toast.loading('Génération PDF...');
    try { await exportPageToPdf(el, `employe-${new Date().toISOString().slice(0, 10)}.pdf`); toast.success('PDF téléchargé.', { id: tid }); }
    catch { toast.error('Échec PDF.', { id: tid }); }
  };

  if (loading) return <LoadingState message="Chargement de votre espace…" />;
  const d = data || getMockEmploye();
  const linkedStagiaires = tuteurData?.stagiairesSuivis || [];

  // Dummy progression chart data
  const progressData = ['Jan','Fév','Mar','Avr','Mai','Jun'].map((m, i) => ({
    mois: m, heures: Math.floor(Math.random() * 15) + 3,
  }));

  const DOMAIN_COLORS: Record<string, string> = { Informatique: '#2563eb', Management: '#7c3aed', Securite: '#ef4444', Finance: '#f59e0b', RH: '#10b981' };

  return (
    <div ref={pdfRootRef} className="emp-root" style={{ padding: '0 0 40px' }}>
      <style>{S}</style>

      {/* ── Header ── */}
      <div className="emp-card" style={{
        borderRadius: 20,
        border: '1px solid rgba(148,163,184,.25)',
        background: 'linear-gradient(90deg, #ffffff 0%, #f8fafc 55%, #eff6ff 100%)',
        boxShadow: '0 8px 24px rgba(15,23,42,.06)',
        marginBottom: 20, padding: '18px 20px', minHeight: 106,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 12,
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span
              className="pill-tag"
              style={{ background: '#ecfeff', color: '#0f766e', border: '1px solid #99f6e4', padding: '4px 12px', borderRadius: 999, minHeight: 24, lineHeight: 1, fontSize: 11, fontWeight: 700, letterSpacing: '.5px', textTransform: 'uppercase' }}
            >
              Mon espace
            </span>
            <span
              className="pill-tag"
              style={{ background: '#eff6ff', color: '#1d4ed8', border: '1px solid #dbeafe', padding: '4px 12px', borderRadius: 999, minHeight: 24, lineHeight: 1, fontSize: 11, fontWeight: 700, letterSpacing: '.5px', textTransform: 'uppercase' }}
            >
              {d.profil?.departement?.nom || 'CNI'}
            </span>
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-0.5px' }}>
            Tableau de bord
          </h1>
          <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0', fontWeight: 500 }}>
            Bonjour <strong style={{ color: '#0f172a' }}>{user?.prenom}</strong> — {user?.poste || 'Employé'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          {unreadMessages > 0 && (
            <button className="notif-badge" onClick={() => navigate('/app/messages')}>
              <MessageCircle size={14} />
              {unreadMessages > 9 ? '9+' : unreadMessages} message(s)
            </button>
          )}
          <button className="btn-emp-sec" onClick={handleExportPdf}>
            <Download size={13} /> Exporter PDF
          </button>
        </div>
      </div>

      {/* ── KPI Row ── */}
      <div className="emp-g4" style={{ marginBottom: 20 }}>
        <KpiCard label="Formations suivies" value={d.stats?.totalFormations ?? 0} icon={Layers} color="#2563eb" bg="#eff6ff" sub="Depuis votre arrivée" delay={0} />
        <KpiCard label="En cours" value={d.stats?.enCours ?? 0} icon={Activity} color="#0d9488" bg="#f0fdfa" sub="À poursuivre" delay={80} />
        <KpiCard label="Certificats" value={d.stats?.certificats ?? 0} icon={Award} color="#f59e0b" bg="#fffbeb" sub="Obtenus ce trimestre" delay={160} />
        <KpiCard label="Heures formation" value={`${d.stats?.heuresFormation ?? 0}h`} icon={Clock} color="#7c3aed" bg="#f5f3ff" sub="Volume cumulé" progress={Math.min(((d.stats?.heuresFormation ?? 0) / 100) * 100, 100)} delay={240} />
      </div>

      {/* ── Main Grid ── */}
      <div className="emp-g3" style={{ marginBottom: 20 }}>
        {/* Left: formations + chart */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Formations à venir */}
          <div className="emp-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <span className="tag-label">Planifié</span>
                <h3 style={{ fontWeight: 800, fontSize: 15, color: '#0f172a', margin: 0, letterSpacing: '-0.3px' }}>
                  Mes formations à venir
                </h3>
              </div>
              <button className="btn-emp-sec" onClick={() => navigate('/app/formations')}>
                Tout voir <ChevronRight size={12} />
              </button>
            </div>
            {d.formationsAVenir?.length === 0 ? (
              <div style={{ padding: '20px 0' }}>
                <EmptyState title="Aucune formation planifiée" icon={<BookOpen size={28} />} />
                <div style={{ textAlign: 'center', marginTop: 12 }}>
                  <button className="btn-emp-primary" onClick={() => navigate('/app/formations')}>
                    Explorer le catalogue
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {(d.formationsAVenir || []).slice(0, 4).map((insc: any, i: number) => (
                  <div key={insc.id} className="formation-item" onClick={() => navigate(`/app/formations/${insc.formation?.id || insc.id}`)}>
                    <div style={{ width: 38, height: 38, borderRadius: 12, background: `${Object.values(DOMAIN_COLORS)[i % 5]}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <BookOpen size={16} style={{ color: Object.values(DOMAIN_COLORS)[i % 5] }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 700, fontSize: 13, color: '#1e293b', margin: '0 0 2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {insc.formation?.titre || 'Formation'}
                      </p>
                      <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>
                        {insc.formation?.dateDebut ? new Date(insc.formation.dateDebut).toLocaleDateString('fr-FR') : 'Date à confirmer'}
                        {insc.formation?.lieu ? ` · ${insc.formation.lieu}` : ''}
                      </p>
                    </div>
                    <span className="badge-pill" style={{ background: `${DOMAIN_COLORS[insc.formation?.domaine] || '#2563eb'}15`, color: DOMAIN_COLORS[insc.formation?.domaine] || '#2563eb' }}>
                      {insc.formation?.domaine}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Progress Chart */}
          <div className="emp-card">
            <span className="tag-label">Progression</span>
            <h3 style={{ fontWeight: 800, fontSize: 15, color: '#0f172a', margin: '0 0 16px', letterSpacing: '-0.3px' }}>
              Heures de formation (6 mois)
            </h3>
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={progressData} margin={{ left: -24, right: 0, top: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="empArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0d9488" stopOpacity={.25} />
                    <stop offset="100%" stopColor="#0d9488" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="mois" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="heures" name="Heures" stroke="#0d9488" strokeWidth={2.5} fill="url(#empArea)" dot={{ fill: '#0d9488', r: 3 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Certificates */}
          <div className="emp-card">
            <span className="tag-label">Accomplissements</span>
            <h3 style={{ fontWeight: 800, fontSize: 15, color: '#0f172a', margin: '0 0 14px', letterSpacing: '-0.3px' }}>
              Mes certificats
            </h3>
            {!d.certifications?.length ? (
              <div style={{ padding: '16px 0', textAlign: 'center' }}>
                <Award size={28} color="#e2e8f0" style={{ margin: '0 auto 8px' }} />
                <p style={{ fontSize: 12, color: '#94a3b8', fontWeight: 500 }}>Complétez des formations pour décrocher vos certificats</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {d.certifications?.slice(0, 3).map((c: any) => (
                  <div key={c.id} className="cert-item">
                    <Award size={15} color="#f59e0b" />
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#78350f', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {c.formation?.titre}
                    </span>
                    <CheckCircle size={13} color="#f59e0b" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Formateur block */}
          {d.estFormateur ? (
            <div className="emp-card" style={{ background: 'linear-gradient(135deg,#fff7ed,#fffbeb)', border: '1px solid rgba(249,115,22,.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div style={{ width: 38, height: 38, borderRadius: 12, background: '#fed7aa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Star size={18} color="#f97316" />
                </div>
                <div>
                  <span style={{ fontWeight: 800, fontSize: 14, color: '#9a3412' }}>Formateur Interne</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                    {(d.badges || []).map((b: string) => (
                      <span key={b} className="badge-pill" style={{ background: '#fed7aa', color: '#9a3412', fontSize: 9 }}>{b}</span>
                    ))}
                  </div>
                </div>
              </div>
              <p style={{ fontSize: 12, color: '#c2410c', marginBottom: 12 }}>Consultez vos opportunités et votre espace formateur.</p>
              <button className="btn-emp-primary" style={{ width: '100%', justifyContent: 'center', background: 'linear-gradient(135deg,#f97316,#ea580c)', boxShadow: '0 4px 14px rgba(249,115,22,.3)' }} onClick={() => navigate('/app/formateurs/profil')}>
                Mon profil formateur <ArrowUpRight size={13} />
              </button>
            </div>
          ) : (
            <div className="emp-card" style={{ border: '2px dashed rgba(37,99,235,.2)' }}>
              <div style={{ textAlign: 'center', padding: '4px 0' }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
                  <TrendingUp size={22} color="#2563eb" />
                </div>
                <p style={{ fontWeight: 800, fontSize: 14, color: '#1e293b', marginBottom: 4 }}>Devenir formateur ?</p>
                <p style={{ fontSize: 12, color: '#64748b', marginBottom: 14 }}>Valorisez vos compétences et obtenez une compensation</p>
                <button className="btn-emp-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => navigate('/app/formateurs/profil')}>
                  S'inscrire maintenant
                </button>
              </div>
            </div>
          )}

          {/* Quick nav */}
          <div className="emp-card" style={{ padding: '16px' }}>
            <span className="tag-label" style={{ marginBottom: 10 }}>Raccourcis</span>
            {[
              { icon: BookOpen, label: 'Catalogue formations', href: '/app/formations', color: '#2563eb' },
              { icon: Calendar, label: 'Mon planning', href: '/app/planning', color: '#0d9488' },
              { icon: MessageCircle, label: 'Messages', href: '/app/messages', color: '#7c3aed', badge: unreadMessages > 0 ? unreadMessages : undefined },
            ].map(item => (
              <button
                key={item.label}
                onClick={() => navigate(item.href)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 12px', borderRadius: 12, border: 'none', cursor: 'pointer',
                  background: 'transparent', textAlign: 'left', transition: 'all .2s', marginBottom: 4,
                }}
                onMouseOver={e => { (e.currentTarget as HTMLElement).style.background = '#f8fafc'; }}
                onMouseOut={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
              >
                <div style={{ width: 34, height: 34, borderRadius: 10, background: `${item.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <item.icon size={15} style={{ color: item.color }} />
                </div>
                <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: '#334155' }}>{item.label}</span>
                {item.badge && <span className="badge-pill" style={{ background: '#fff1f2', color: '#e11d48' }}>{item.badge}</span>}
                <ChevronRight size={14} color="#94a3b8" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Catalogue recommandé ── */}
      <div className="emp-card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <span className="tag-label">Recommandations</span>
            <h3 style={{ fontWeight: 800, fontSize: 15, color: '#0f172a', margin: 0, letterSpacing: '-0.3px' }}>
              Formations recommandées
            </h3>
          </div>
          <button className="btn-emp-sec" onClick={() => navigate('/app/formations')}>
            Voir tout <ChevronRight size={12} />
          </button>
        </div>
        <div className="emp-g-cat">
          {(d.catalogue || []).slice(0, 4).map((f: any) => {
            const color = DOMAIN_COLORS[f.domaine] || '#2563eb';
            return (
              <div key={f.id} className="catalogue-card" onClick={() => navigate(`/app/formations/${f.id}`)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <span className="badge-pill" style={{ background: `${color}15`, color }}>{f.domaine}</span>
                  {f.cout === 0 && <span className="badge-pill" style={{ background: '#ecfdf5', color: '#10b981' }}>Gratuit</span>}
                </div>
                <p style={{ fontWeight: 700, fontSize: 13, color: '#1e293b', marginBottom: 8, lineHeight: 1.4 }}>{f.titre}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: '#94a3b8' }}>
                  <Clock size={11} />
                  <span>{f.dureeJours ? `${f.dureeJours}j` : `${f.dureeHeures}h`}</span>
                  <span>·</span>
                  <Users size={11} />
                  <span>{f.nbInscrits}/{f.maxParticipants || '∞'}</span>
                </div>
                <div style={{ marginTop: 10, height: 3, borderRadius: 100, background: '#f1f5f9', overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: 100, width: `${Math.min(((f.nbInscrits || 0) / (f.maxParticipants || 30)) * 100, 100)}%`, background: `linear-gradient(90deg,${color},${color}88)` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Stagiaires liés ── */}
      {linkedStagiaires.length > 0 && (
        <div className="emp-card">
          <span className="tag-label">Tutorat</span>
          <h3 style={{ fontWeight: 800, fontSize: 15, color: '#0f172a', margin: '0 0 16px', letterSpacing: '-0.3px' }}>
            Mes stagiaires liés
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {linkedStagiaires.map((s: any, i: number) => (
              <div key={s.id} className="stagiaire-row">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 50, background: ['#eff6ff', '#f0fdfa', '#f5f3ff'][i % 3], display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 12, color: ['#2563eb', '#0d9488', '#7c3aed'][i % 3] }}>
                    {s.prenom?.[0]}{s.nom?.[0]}
                  </div>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: 13, color: '#1e293b', margin: 0 }}>{s.prenom} {s.nom}</p>
                    <p style={{ fontSize: 11, color: '#64748b', margin: '2px 0 0' }}>
                      {s.statut} · {s.dateFinStage ? new Date(s.dateFinStage).toLocaleDateString('fr-FR') : 'Fin non définie'}
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn-emp-sec" style={{ fontSize: 11 }} onClick={() => sendPlanning(s.id)}>
                    <Calendar size={12} /> Planning
                  </button>
                  {(s.statut === 'En_cours' || s.statut === 'Accepte') && (
                    <button className="btn-emp-primary" style={{ fontSize: 11, padding: '8px 14px' }} onClick={() => closeWithNote(s.id)}>
                      <Star size={12} /> Noter
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function getMockEmploye() {
  return {
    profil: { departement: { nom: 'Développement Logiciel' } },
    stats: { totalFormations: 3, enCours: 1, certificats: 2, heuresFormation: 42 },
    estFormateur: false, badges: [], formationsAVenir: [], certifications: [],
    catalogue: [
      { id: 1, titre: 'React 18 & TypeScript', domaine: 'Informatique', dureeJours: 3, cout: 0, nbInscrits: 4, maxParticipants: 12 },
      { id: 2, titre: 'Management & Leadership', domaine: 'Management', dureeJours: 2, cout: 350, nbInscrits: 7, maxParticipants: 20 },
      { id: 3, titre: 'Cybersécurité Avancée', domaine: 'Securite', dureeJours: 5, cout: 0, nbInscrits: 2, maxParticipants: 8 },
      { id: 4, titre: 'DevOps Docker/K8s', domaine: 'Informatique', dureeJours: 4, cout: 1200, nbInscrits: 12, maxParticipants: 30 },
    ],
  };
}