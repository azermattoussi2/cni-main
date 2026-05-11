// ============================================
// Fichier : pages/DashboardFormateur.tsx
// Design : Premium Trainer Dashboard
// ============================================

import { useState, useEffect, useRef } from 'react';
import { Star, Clock, CheckCircle, X, BookOpen, Download, Award, Zap, Users, TrendingUp, ArrowUpRight, MessageCircle, Activity } from 'lucide-react';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell,
} from 'recharts';
import api from '../lib/api';
import { useAuthStore } from '../stores/authStore';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import LoadingState from '../components/common/LoadingState';
import EmptyState from '../components/common/EmptyState';
import { exportPageToPdf } from '../utils/downloadPdf';

// ── Styles ───────────────────────────────────────
const S = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=Manrope:wght@300;400;500;600;700;800&display=swap');

  .fmt-root { font-family:'Manrope',sans-serif; }
  .fmt-root h1,h2,h3,h4 { font-family:'Syne',sans-serif; }

  @keyframes slideUp  { from{opacity:0;transform:translateY(16px);} to{opacity:1;transform:translateY(0);} }
  @keyframes fadeIn   { from{opacity:0;} to{opacity:1;} }
  @keyframes shine    { 0%,100%{background-position:-200% center;} 50%{background-position:200% center;} }
  @keyframes badgePop { 0%{transform:scale(0);} 70%{transform:scale(1.15);} 100%{transform:scale(1);} }

  .fmt-kpi {
    background:white; border-radius:22px;
    border:1px solid rgba(0,0,0,.06);
    padding:22px; overflow:hidden; position:relative;
    transition:all .3s cubic-bezier(.4,0,.2,1);
    animation:slideUp .4s ease both;
  }
  .fmt-kpi:hover { transform:translateY(-5px); box-shadow:0 24px 52px rgba(0,0,0,.1); }

  .fmt-card {
    background:white; border-radius:22px;
    border:1px solid rgba(0,0,0,.06);
    padding:22px; transition:box-shadow .3s;
    animation:slideUp .4s ease both;
  }
  .fmt-card:hover { box-shadow:0 8px 28px rgba(0,0,0,.07); }

  .opport-card {
    border-radius:18px; padding:18px;
    background:white;
    border:1px solid rgba(249,115,22,.15);
    transition:all .25s;
  }
  .opport-card:hover { box-shadow:0 8px 28px rgba(249,115,22,.12); transform:translateY(-2px); }

  .fmt-formation-row {
    display:flex; align-items:center; gap:14px;
    padding:12px 14px; border-radius:14px;
    background:#f8fafc; border:1px solid rgba(0,0,0,.04);
    transition:all .2s;
  }
  .fmt-formation-row:hover { background:#fff7ed; border-color:rgba(249,115,22,.2); transform:translateX(4px); }

  .badge-chip {
    display:inline-flex; align-items:center; gap:5px;
    padding:5px 12px; border-radius:100px;
    font-size:11px; font-weight:800;
    animation:badgePop .35s ease;
  }

  .star-rating { display:flex; gap:2px; }
  .star-rating svg { transition:transform .15s; }
  .star-rating svg:hover { transform:scale(1.2); }

  .tag-label { font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#94a3b8;margin-bottom:6px;display:block; }

  .btn-fmt-primary {
    display:inline-flex;align-items:center;gap:8px;
    padding:10px 20px;border-radius:13px;border:none;cursor:pointer;
    font-weight:800;font-size:13px;transition:all .2s;
    background:linear-gradient(135deg,#f97316,#ea580c);color:white;
    box-shadow:0 4px 14px rgba(249,115,22,.35);
  }
  .btn-fmt-primary:hover { transform:translateY(-1px);box-shadow:0 6px 20px rgba(249,115,22,.45); }

  .btn-fmt-success {
    display:inline-flex;align-items:center;gap:6px;
    padding:8px 14px;border-radius:11px;border:none;cursor:pointer;
    font-weight:700;font-size:12px;transition:all .2s;
    background:linear-gradient(135deg,#10b981,#059669);color:white;
    box-shadow:0 3px 10px rgba(16,185,129,.3);
  }
  .btn-fmt-success:hover { transform:translateY(-1px);box-shadow:0 5px 16px rgba(16,185,129,.4); }

  .btn-fmt-danger {
    display:inline-flex;align-items:center;gap:6px;
    padding:8px 14px;border-radius:11px;border:none;cursor:pointer;
    font-weight:700;font-size:12px;transition:all .2s;
    background:white;color:#ef4444;border:1.5px solid #fecaca;
  }
  .btn-fmt-danger:hover { background:#fff1f2;transform:translateY(-1px); }

  .btn-fmt-sec {
    display:inline-flex;align-items:center;gap:7px;
    padding:9px 18px;border-radius:12px;cursor:pointer;
    font-weight:600;font-size:13px;transition:all .2s;
    background:white;color:#374151;border:1px solid rgba(0,0,0,.1);
  }
  .btn-fmt-sec:hover { background:#f8fafc;transform:translateY(-1px);box-shadow:0 3px 10px rgba(0,0,0,.07); }

  .fmt-g4 { display:grid;grid-template-columns:repeat(4,1fr);gap:14px; }
  .fmt-g2 { display:grid;grid-template-columns:1fr 1fr;gap:20px; }
  .fmt-g3 { display:grid;grid-template-columns:1fr 2fr;gap:20px; }
  @media(max-width:1100px){.fmt-g4{grid-template-columns:1fr 1fr;}}
  @media(max-width:700px){.fmt-g4{grid-template-columns:1fr 1fr;}.fmt-g2{grid-template-columns:1fr;}.fmt-g3{grid-template-columns:1fr;}}

  .stagiaire-row {
    display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:12px;
    padding:14px 16px;border-radius:14px;
    background:#f8fafc;border:1px solid rgba(0,0,0,.04);
    transition:all .2s;
  }
  .stagiaire-row:hover { background:#f0fdfa;border-color:rgba(13,148,136,.15); }

  .noteMoyenne-display {
    background:linear-gradient(135deg,#fffbeb,#fef3c7);
    border-radius:20px;padding:20px;
    border:1px solid rgba(245,158,11,.2);
    text-align:center;
  }
`;

function KpiCard({ label, value, icon: Icon, color, bg, sub, delay = 0 }: any) {
  return (
    <div className="fmt-kpi" style={{ animationDelay: `${delay}ms` }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg,${color},${color}55)`, borderRadius: '22px 22px 0 0' }} />
      <div style={{ position: 'absolute', top: -25, right: -15, width: 80, height: 80, borderRadius: '50%', background: bg, opacity: .5 }} />
      <div style={{ width: 42, height: 42, borderRadius: 13, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
        <Icon size={19} style={{ color }} />
      </div>
      <div style={{ fontSize: 30, fontWeight: 900, color: '#0f172a', letterSpacing: '-1px', lineHeight: 1, marginBottom: 4 }}>{value}</div>
      <div style={{ fontSize: 12, color: '#475569', fontWeight: 700 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 3 }}>{sub}</div>}
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

export default function DashboardFormateur() {
  const pdfRootRef = useRef<HTMLDivElement>(null);
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [tuteurData, setTuteurData] = useState<{ stagiairesSuivis: any[] } | null>(null);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchData = () => {
    api.get('/formateurs/dashboard').then(r => setData(r.data.data)).catch(() => setData(getMockFormateur())).finally(() => setLoading(false));
    api.get('/reporting/tuteur').then(r => setTuteurData(r.data?.data || { stagiairesSuivis: [] })).catch(() => setTuteurData({ stagiairesSuivis: [] }));
    api.get('/messages/unread-count').then(r => setUnreadMessages(Number(r.data?.data?.count || 0))).catch(() => setUnreadMessages(0));
  };
  useEffect(() => { fetchData(); }, []);

  const repondreOpportunite = async (id: number, action: 'accepter' | 'refuser') => {
    try {
      await api.post(`/formateurs/demandes/${id}/repondre`, { action });
      toast.success(action === 'accepter' ? 'Opportunité acceptée !' : 'Refus enregistré');
      fetchData();
    } catch (e: any) { toast.error(e.response?.data?.message || 'Erreur'); }
  };

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
      toast.success('Stage clôturé.'); fetchData();
    } catch (e: any) { toast.error(e.response?.data?.message || 'Erreur.'); }
  };
  const handleExportPdf = async () => {
    const el = pdfRootRef.current; if (!el) return;
    const tid = toast.loading('Génération PDF...');
    try { await exportPageToPdf(el, `formateur-${new Date().toISOString().slice(0, 10)}.pdf`); toast.success('PDF téléchargé.', { id: tid }); }
    catch { toast.error('Échec PDF.', { id: tid }); }
  };

  if (loading) return <LoadingState message="Chargement de l'espace formateur…" />;
  const d = data || getMockFormateur();
  const opportunites = (d.demandes || []).filter((dem: any) => dem.statut === 'En_attente');
  const formationsAcceptees = (d.demandes || []).filter((dem: any) => dem.statut === 'Acceptee');
  const linkedStagiaires = tuteurData?.stagiairesSuivis || [];

  // Radar data for skills
  const radarData = [
    { subject: 'Technique', A: 88 },
    { subject: 'Pédagogie', A: 75 },
    { subject: 'Communication', A: 92 },
    { subject: 'Organisation', A: 70 },
    { subject: 'Innovation', A: 80 },
  ];

  // Compensation bar data
  const compData = formationsAcceptees.slice(0, 5).map((dem: any) => ({
    name: (dem.formation?.titre || 'Formation').slice(0, 12) + '…',
    heures: dem.compensationHeures || 0,
    prime: dem.compensationPrime || 0,
  }));

  const STAR_COLOR = '#f59e0b';

  return (
    <div ref={pdfRootRef} className="fmt-root" style={{ padding: '0 0 40px' }}>
      <style>{S}</style>

      {/* ── Header ── */}
      <div className="fmt-card" style={{
        borderRadius: 20,
        border: '1px solid rgba(148,163,184,.25)',
        background: 'linear-gradient(90deg, #ffffff 0%, #f8fafc 55%, #fff7ed 100%)',
        boxShadow: '0 8px 24px rgba(15,23,42,.06)',
        marginBottom: 20, padding: '18px 20px', minHeight: 106,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 12,
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
            <span
              className="pill-tag"
              style={{ background: '#fff7ed', color: '#c2410c', border: '1px solid #fed7aa', padding: '4px 12px', borderRadius: 999, minHeight: 24, lineHeight: 1, fontSize: 11, fontWeight: 700, letterSpacing: '.5px', textTransform: 'uppercase' }}
            >
              <Star size={10} />
              Espace Formateur
            </span>
            {(d.badges || []).length > 0 && (
              <span
                className="pill-tag"
                style={{ background: '#fffbeb', color: '#b45309', border: '1px solid #fde68a', padding: '4px 12px', borderRadius: 999, minHeight: 24, lineHeight: 1, fontSize: 11, fontWeight: 700, letterSpacing: '.5px', textTransform: 'uppercase' }}
              >
                {(d.badges || []).length} badge(s)
              </span>
            )}
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-0.5px' }}>
            Tableau de bord
          </h1>
          <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0', fontWeight: 500 }}>
            Bonjour <strong style={{ color: '#0f172a' }}>{user?.prenom}</strong> — activité formateur en temps réel
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {unreadMessages > 0 && (
            <button onClick={() => navigate('/app/messages')} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 12, border: '1.5px solid #fecaca', background: 'rgba(254,202,202,.1)', color: '#fca5a5', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
              <MessageCircle size={13} /> {unreadMessages} message(s)
            </button>
          )}
          <button className="btn-fmt-sec" onClick={handleExportPdf}>
            <Download size={13} /> Exporter PDF
          </button>
          <button className="btn-fmt-sec" onClick={fetchData}>
            <Activity size={13} /> Actualiser
          </button>
        </div>
      </div>

      {/* ── KPI Row ── */}
      <div className="fmt-g4" style={{ marginBottom: 20 }}>
        <KpiCard label="Formations animées" value={d.totalFormations ?? 0} icon={BookOpen} color="#f97316" bg="#fff7ed" sub="Sessions dispensées" delay={0} />
        <KpiCard label="Heures totales" value={`${d.totalHeures ?? 0}h`} icon={Clock} color="#2563eb" bg="#eff6ff" sub="Volume cumulé" delay={80} />
        <KpiCard label="Note moyenne" value={d.noteMoyenne ? `${d.noteMoyenne}/5` : '—'} icon={Star} color="#f59e0b" bg="#fffbeb" sub="Évaluation participants" delay={160} />
        <KpiCard label="Opportunités" value={opportunites.length} icon={Zap} color="#10b981" bg="#ecfdf5" sub="En attente de réponse" delay={240} />
      </div>

      {/* ── Opportunités urgentes ── */}
      {opportunites.length > 0 && (
        <div className="fmt-card" style={{
          marginBottom: 20,
          background: 'linear-gradient(135deg,#fff7ed,#fffbeb)',
          border: '1.5px solid rgba(249,115,22,.25)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#f97316', animation: 'shine 2s ease infinite', flexShrink: 0 }} />
            <h3 style={{ fontWeight: 900, fontSize: 15, color: '#9a3412', margin: 0 }}>
              🎯 Opportunités en attente ({opportunites.length})
            </h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {opportunites.map((dem: any) => {
              const limite = new Date(dem.dateLimiteReponse);
              const joursRestants = Math.ceil((limite.getTime() - Date.now()) / (1000 * 3600 * 24));
              return (
                <div key={dem.id} className="opport-card">
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 800, fontSize: 14, color: '#1e293b', margin: '0 0 8px' }}>{dem.formation?.titre || 'Formation'}</p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        <span className="badge-chip" style={{ background: '#eff6ff', color: '#2563eb' }}>{dem.formation?.domaine}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#64748b' }}>
                          <Clock size={12} />
                          {dem.formation?.dureeJours ? `${dem.formation.dureeJours} jours` : 'Durée à confirmer'}
                        </span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: joursRestants <= 1 ? '#ef4444' : joursRestants <= 3 ? '#f97316' : '#64748b' }}>
                          ⏰ {joursRestants}j restant{joursRestants > 1 ? 's' : ''}
                        </span>
                      </div>
                      {dem.messagePersonnalise && (
                        <p style={{ fontSize: 11, color: '#94a3b8', fontStyle: 'italic', marginTop: 6, padding: '6px 10px', background: 'rgba(0,0,0,.03)', borderRadius: 8 }}>
                          {dem.messagePersonnalise}
                        </p>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                      <button className="btn-fmt-success" onClick={() => repondreOpportunite(dem.id, 'accepter')}>
                        <CheckCircle size={13} /> Accepter
                      </button>
                      <button className="btn-fmt-danger" onClick={() => repondreOpportunite(dem.id, 'refuser')}>
                        <X size={13} /> Refuser
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Charts + Note ── */}
      <div className="fmt-g2" style={{ marginBottom: 20 }}>
        {/* Radar Chart */}
        <div className="fmt-card" style={{ animationDelay: '80ms' }}>
          <span className="tag-label">Profil de compétences</span>
          <h3 style={{ fontWeight: 800, fontSize: 15, color: '#0f172a', margin: '0 0 16px', letterSpacing: '-0.3px' }}>
            Mes compétences formateur
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={radarData} margin={{ top: 0, right: 20, bottom: 0, left: 20 }}>
              <PolarGrid stroke="#e2e8f0" />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
              <Radar name="Score" dataKey="A" stroke="#f97316" fill="#f97316" fillOpacity={0.18} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Note moyenne + compensation */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="noteMoyenne-display fmt-card" style={{ padding: 20, border: '1px solid rgba(245,158,11,.2)', background: 'linear-gradient(135deg,#fffbeb,#fef3c7)', flex: '0 0 auto' }}>
            <span className="tag-label">Évaluation</span>
            <div style={{ fontSize: 52, fontWeight: 900, color: '#f59e0b', letterSpacing: '-2px', lineHeight: 1, marginBottom: 8 }}>
              {d.noteMoyenne ?? '—'}<span style={{ fontSize: 20, color: '#fcd34d', fontWeight: 600 }}>/5</span>
            </div>
            <div className="star-rating" style={{ justifyContent: 'center', marginBottom: 8 }}>
              {[1, 2, 3, 4, 5].map(i => (
                <Star key={i} size={20} color={STAR_COLOR} fill={i <= Math.round(d.noteMoyenne || 0) ? STAR_COLOR : 'none'} strokeWidth={1.5} />
              ))}
            </div>
            <p style={{ fontSize: 12, color: '#78350f', fontWeight: 600, margin: 0 }}>Note moyenne des participants</p>
          </div>

          {compData.length > 0 && (
            <div className="fmt-card" style={{ flex: 1 }}>
              <span className="tag-label">Compensation</span>
              <h3 style={{ fontWeight: 800, fontSize: 14, color: '#0f172a', margin: '0 0 14px' }}>Heures créditées</h3>
              <ResponsiveContainer width="100%" height={120}>
                <BarChart data={compData} margin={{ left: -20, right: 0, top: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="heures" name="Heures" radius={[6, 6, 0, 0]} barSize={20}>
                    {compData.map((_: any, i: number) => (
                      <Cell key={i} fill={['#f97316', '#2563eb', '#10b981', '#7c3aed', '#f59e0b'][i % 5]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* ── Formations animées ── */}
      <div className="fmt-card" style={{ marginBottom: 20, animationDelay: '120ms' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <span className="tag-label">Historique</span>
            <h3 style={{ fontWeight: 800, fontSize: 15, color: '#0f172a', margin: 0, letterSpacing: '-0.3px' }}>
              Mes formations animées
            </h3>
          </div>
          <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>{formationsAcceptees.length} session(s)</span>
        </div>
        {formationsAcceptees.length === 0 ? (
          <EmptyState title="Aucune formation animée pour l'instant" subtitle="Acceptez des opportunités pour commencer" icon={<BookOpen size={28} />} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {formationsAcceptees.map((dem: any) => (
              <div key={dem.id} className="fmt-formation-row">
                <div style={{ width: 38, height: 38, borderRadius: 12, background: '#fff7ed', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Star size={16} color="#f97316" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 700, fontSize: 13, color: '#1e293b', margin: '0 0 2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {dem.formation?.titre}
                  </p>
                  <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>{dem.formation?.domaine}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  {dem.compensationPrime && (
                    <span className="badge-chip" style={{ background: '#ecfdf5', color: '#10b981' }}>
                      +{dem.compensationPrime} TND
                    </span>
                  )}
                  <span className="badge-chip" style={{ background: '#eff6ff', color: '#2563eb' }}>
                    <Clock size={10} /> {dem.compensationHeures}h
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Stagiaires liés ── */}
      {linkedStagiaires.length > 0 && (
        <div className="fmt-card" style={{ animationDelay: '160ms' }}>
          <span className="tag-label">Tutorat</span>
          <h3 style={{ fontWeight: 800, fontSize: 15, color: '#0f172a', margin: '0 0 16px', letterSpacing: '-0.3px' }}>
            Stagiaires liés à mon profil
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {linkedStagiaires.map((s: any, i: number) => (
              <div key={s.id} className="stagiaire-row">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 50, background: ['#fff7ed', '#ecfdf5', '#eff6ff'][i % 3], display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13, color: ['#f97316', '#10b981', '#2563eb'][i % 3], flexShrink: 0 }}>
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
                  <button className="btn-fmt-sec" style={{ fontSize: 11, padding: '7px 13px' }} onClick={() => sendPlanning(s.id)}>
                    Envoyer planning
                  </button>
                  {(s.statut === 'En_cours' || s.statut === 'Accepte') && (
                    <button className="btn-fmt-primary" style={{ fontSize: 11, padding: '7px 14px' }} onClick={() => closeWithNote(s.id)}>
                      <Star size={11} /> Noter & terminer
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

function getMockFormateur() {
  return {
    totalFormations: 5, totalHeures: 70, noteMoyenne: 4.5,
    badges: ['Formateur 50h', "Étoile d'Or", 'Expert Certifié'],
    demandes: [
      { id: 1, statut: 'En_attente', formation: { titre: 'React 18 & TypeScript', domaine: 'Informatique', dureeJours: 3 }, dateLimiteReponse: new Date(Date.now() + 2 * 86400000).toISOString(), messagePersonnalise: 'Score compatibilité : 9/10 — Correspondance parfaite avec votre profil.' },
      { id: 2, statut: 'Acceptee', formation: { titre: 'Node.js Avancé', domaine: 'Informatique' }, compensationPrime: 1200, compensationHeures: 24 },
      { id: 3, statut: 'Acceptee', formation: { titre: 'Docker & Kubernetes', domaine: 'DevOps' }, compensationPrime: 800, compensationHeures: 16 },
    ],
  };
}