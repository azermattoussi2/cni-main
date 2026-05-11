// ============================================
// Fichier : pages/DashboardRH.tsx
// Design : Ultra-Professional KPI Dashboard
// ============================================

import { useState, useEffect, useRef } from 'react';
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart, Legend,
} from 'recharts';
import {
  Users, TrendingUp, AlertTriangle, CheckCircle, Clock,
  Bell, RefreshCw, Download, ArrowUpRight, ArrowDownRight,
  Activity, Layers, Target, Zap, BarChart2, PieChartIcon,
} from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { useAuthStore } from '../stores/authStore';
import LoadingState from '../components/common/LoadingState';
import ErrorState from '../components/common/ErrorState';
import { exportPageToPdf } from '../utils/downloadPdf';

const PALETTE = {
  blue: '#2563eb',
  orange: '#f97316',
  emerald: '#10b981',
  violet: '#7c3aed',
  rose: '#f43f5e',
  amber: '#f59e0b',
  teal: '#0d9488',
  indigo: '#4f46e5',
};

const PIE_COLORS = [PALETTE.blue, PALETTE.emerald, PALETTE.orange, PALETTE.rose];
const MOIS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

// ── Shared styles ──────────────────────────────────
const S = `
  @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@400;500;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');

  .db-root { font-family: 'DM Sans', sans-serif; }
  .db-root h1,h2,h3,h4 { font-family: 'Bricolage Grotesque', sans-serif; }

  @keyframes slideUp   { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
  @keyframes fadeIn    { from { opacity:0; } to { opacity:1; } }
  @keyframes countUp   { from { opacity:0; transform:scale(0.85); } to { opacity:1; transform:scale(1); } }
  @keyframes shimmer   { 0%,100% { opacity:.6; } 50% { opacity:1; } }
  @keyframes pulseRing { 0% { box-shadow:0 0 0 0 rgba(37,99,235,.4); } 70% { box-shadow:0 0 0 10px rgba(37,99,235,0); } 100% { box-shadow:0 0 0 0 rgba(37,99,235,0); } }
  @keyframes barGrow   { from { transform:scaleY(0); transform-origin:bottom; } to { transform:scaleY(1); } }

  .slide-up  { animation: slideUp .5s ease both; }
  .fade-in   { animation: fadeIn .6s ease both; }
  .count-up  { animation: countUp .4s ease both; }

  .kpi-card {
    background: white;
    border-radius: 20px;
    border: 1px solid rgba(0,0,0,.06);
    padding: 24px;
    position: relative;
    overflow: hidden;
    transition: all .3s cubic-bezier(.4,0,.2,1);
    cursor: default;
  }
  .kpi-card::before {
    content:''; position:absolute; top:0; left:0; right:0; height:3px;
    border-radius:20px 20px 0 0;
    transition: opacity .3s;
  }
  .kpi-card:hover { transform:translateY(-4px); box-shadow:0 20px 48px rgba(0,0,0,.1); }
  .kpi-card:hover::before { opacity:1 !important; }

  .chart-card {
    background: white;
    border-radius: 24px;
    border: 1px solid rgba(0,0,0,.06);
    padding: 24px;
    transition: box-shadow .3s;
  }
  .chart-card:hover { box-shadow: 0 8px 32px rgba(0,0,0,.08); }

  .alert-dept {
    border-radius:16px;
    border:1px solid rgba(245,158,11,.2);
    background:white;
    padding:16px;
    transition: all .25s;
  }
  .alert-dept:hover { box-shadow:0 8px 24px rgba(245,158,11,.15); transform:translateY(-2px); }

  .quick-stat {
    display:flex; align-items:center; gap:14px;
    padding:18px 20px; border-radius:18px;
    border:1px solid rgba(0,0,0,.05);
    background:white;
    transition: all .25s;
  }
  .quick-stat:hover { box-shadow:0 8px 24px rgba(0,0,0,.08); transform:translateY(-2px); }

  .prog-bar {
    height:8px; border-radius:100px; background:#f1f5f9;
    overflow:hidden; margin-top:8px;
  }
  .prog-fill {
    height:100%; border-radius:100px;
    transition: width .8s cubic-bezier(.4,0,.2,1);
  }

  .header-pill {
    display:inline-flex; align-items:center; gap:6px;
    padding:4px 12px; border-radius:999px;
    min-height:24px; line-height:1;
    font-size:11px; font-weight:700; letter-spacing:.5px; text-transform:uppercase;
  }

  .tag-label {
    font-size:11px; font-weight:700; letter-spacing:1px; text-transform:uppercase;
    color:#94a3b8; margin-bottom:6px; display:block;
  }

  .db-grid-4 { display:grid; grid-template-columns:repeat(4,1fr); gap:16px; }
  .db-grid-2 { display:grid; grid-template-columns:repeat(2,1fr); gap:20px; }
  @media(max-width:1100px){.db-grid-4{grid-template-columns:repeat(2,1fr);}}
  @media(max-width:640px){.db-grid-4{grid-template-columns:1fr 1fr;}.db-grid-2{grid-template-columns:1fr;}}

  .btn-rh-primary {
    display:inline-flex; align-items:center; gap:8px;
    padding:10px 20px; border-radius:12px; border:none; cursor:pointer;
    font-weight:600; font-size:13px; transition:all .2s;
    background:linear-gradient(135deg,#2563eb,#1d4ed8);
    color:white; box-shadow:0 4px 14px rgba(37,99,235,.35);
  }
  .btn-rh-primary:hover { transform:translateY(-1px); box-shadow:0 6px 20px rgba(37,99,235,.45); }
  .btn-rh-primary:disabled { opacity:.6; cursor:not-allowed; transform:none; }

  .btn-rh-secondary {
    display:inline-flex; align-items:center; gap:8px;
    padding:10px 18px; border-radius:12px; cursor:pointer;
    font-weight:600; font-size:13px; transition:all .2s;
    background:white; color:#374151;
    border:1px solid rgba(0,0,0,.1);
  }
  .btn-rh-secondary:hover { background:#f8fafc; transform:translateY(-1px); box-shadow:0 4px 12px rgba(0,0,0,.08); }

  .legend-dot { width:8px; height:8px; border-radius:50%; flex-shrink:0; }
  .pie-legend { display:flex; align-items:center; justify-between; gap:8px; padding:8px 12px; border-radius:10px; background:#f8fafc; }
`;

// ── KPI Card ──────────────────────────────────────
function KpiCard({
  label, value, sub, icon: Icon, color, bg, trend, trendUp, delay = 0
}: any) {
  return (
    <div className="kpi-card slide-up" style={{ animationDelay: `${delay}ms`, '--card-color': color } as any}>
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 3,
        background: `linear-gradient(90deg, ${color}, ${color}88)`,
        borderRadius: '20px 20px 0 0',
      }} />
      <div style={{
        position: 'absolute', top: -40, right: -20,
        width: 100, height: 100, borderRadius: '50%',
        background: `${bg}`, opacity: .35,
      }} />
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 14,
          background: `${color}15`, display: 'flex',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={20} style={{ color }} />
        </div>
        {trend !== undefined && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 3,
            fontSize: 11, fontWeight: 700,
            color: trendUp ? '#10b981' : '#f43f5e',
            background: trendUp ? '#ecfdf5' : '#fff1f2',
            padding: '3px 8px', borderRadius: 100,
          }}>
            {trendUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {trend}
          </div>
        )}
      </div>
      <div style={{ fontSize: 32, fontWeight: 800, color: '#0f172a', letterSpacing: '-1px', lineHeight: 1, marginBottom: 6 }} className="count-up">
        {value}
      </div>
      <div style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

// ── Custom Tooltip ────────────────────────────────
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'white', border: '1px solid #e2e8f0', borderRadius: 12,
      padding: '10px 14px', boxShadow: '0 8px 24px rgba(0,0,0,.1)',
    }}>
      <p style={{ fontSize: 11, color: '#64748b', marginBottom: 4, fontWeight: 600 }}>{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ fontSize: 13, fontWeight: 700, color: p.color }}>
          {p.name}: <span style={{ color: '#0f172a' }}>{p.value}</span>
        </p>
      ))}
    </div>
  );
}

// ── Main Component ────────────────────────────────
interface DashData { stages: any; formations: any; budget: any; formateurs: any; graphiques: any; }

export default function DashboardRH() {
  const pdfRootRef = useRef<HTMLDivElement>(null);
  const { user } = useAuthStore();
  const [data, setData] = useState<DashData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sendingReminders, setSendingReminders] = useState(false);

  const fetchData = async () => {
    try { setLoading(true); setError(null); const res = await api.get('/reporting/rh'); setData(res.data.data); }
    catch { toast.error('Erreur de chargement'); setError('Impossible de charger le tableau de bord RH.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetchData(); }, []);

  const triggerReminders = async () => {
    try {
      setSendingReminders(true);
      await Promise.all([api.post('/stagiaires/rappels'), api.post('/formations/rappels')]);
      toast.success('Rappels envoyés.');
    } catch { toast.error('Échec envoi.'); } finally { setSendingReminders(false); }
  };

  const handleExportPdf = async () => {
    const el = pdfRootRef.current; if (!el) return;
    const tid = toast.loading('Génération PDF...');
    try { await exportPageToPdf(el, `rh-${new Date().toISOString().slice(0, 10)}.pdf`); toast.success('PDF téléchargé.', { id: tid }); }
    catch { toast.error('Échec PDF.', { id: tid }); }
  };

  if (loading) return <LoadingState message="Chargement du tableau de bord RH..." />;
  if (error || !data) return <ErrorState message={error || 'Aucune donnée.'} onRetry={fetchData} />;

  const d = data!;
  const budgetPct = d.budget?.pourcentage || 0;
  const candidaturesData = MOIS.map((m, i) => ({
    mois: m,
    candidatures: d.graphiques?.candidaturesParMois?.find((c: any) => c.mois === i + 1)?.count || 0,
  }));
  const pieData = [
    { name: 'En attente', value: d.stages?.enAttente || 0 },
    { name: 'Acceptés', value: d.stages?.acceptes || 0 },
    { name: 'En cours', value: d.stages?.enCours || 0 },
    { name: 'Refusés', value: d.stages?.refuses || 0 },
  ];
  const topFormations = (d.graphiques?.topFormations ?? []).map((row: any) => {
    const f = row.formation ?? row.get?.('formation');
    const titre = String(f?.titre ?? `Formation #${row.formationId ?? ''}`);
    return { titre: titre.length > 30 ? `${titre.slice(0, 28)}…` : titre, inscriptions: Number(row.count ?? 0) };
  });
  const rappelsCibles = (Number(d.stages?.enAttente) || 0) + (Number(d.formations?.totalInscrits) || 0);

  return (
    <div ref={pdfRootRef} className="db-root" style={{ padding: '0 0 40px' }}>
      <style>{S}</style>

      {/* ── Page Header ── */}
      <div
        className="slide-up"
        style={{
          borderRadius: 20,
          border: '1px solid rgba(148,163,184,.25)',
          background: 'linear-gradient(90deg, #ffffff 0%, #f8fafc 55%, #eff6ff 100%)',
          boxShadow: '0 8px 24px rgba(15,23,42,.06)',
          padding: '18px 20px',
          minHeight: 106,
          marginBottom: 24,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <span
              className="header-pill"
              style={{ background: '#eff6ff', color: '#1d4ed8', border: '1px solid #dbeafe' }}
            >
              <Activity size={12} />
              Direction RH
            </span>
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.5px' }}>
            Tableau de bord
          </h1>
          <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0', fontWeight: 500 }}>
            Bonjour <strong style={{ color: '#0f172a' }}>{user?.prenom}</strong> — indicateurs en temps réel
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button className="btn-rh-secondary" onClick={handleExportPdf}>
            <Download size={14} /> Exporter PDF
          </button>
          <button className="btn-rh-secondary" onClick={fetchData}>
            <RefreshCw size={14} /> Actualiser
          </button>
          <button className="btn-rh-primary" onClick={triggerReminders} disabled={sendingReminders}>
            <Bell size={14} />
            {sendingReminders ? 'Envoi…' : `Rappels (${rappelsCibles})`}
          </button>
        </div>
      </div>

      {/* ── KPI Row 1 ── */}
      <div className="db-grid-4" style={{ marginBottom: 16 }}>
        {[
          { label: 'Stages en cours', value: d.stages?.enCours ?? 0, icon: Activity, color: PALETTE.blue, bg: '#eff6ff', sub: 'Collaborateurs actifs', trend: '+12%', trendUp: true, delay: 0 },
          { label: 'En attente', value: d.stages?.enAttente ?? 0, icon: Clock, color: PALETTE.amber, bg: '#fffbeb', sub: 'Dossiers à traiter', trend: '+3', trendUp: false, delay: 80 },
          { label: 'Formations ce mois', value: d.formations?.duMois ?? 0, icon: Layers, color: PALETTE.emerald, bg: '#ecfdf5', sub: 'Sessions planifiées', trend: '+5%', trendUp: true, delay: 160 },
          { label: 'Budget consommé', value: `${budgetPct}%`, icon: Target, color: budgetPct >= 80 ? PALETTE.rose : PALETTE.orange, bg: budgetPct >= 80 ? '#fff1f2' : '#fff7ed', sub: 'Du plafond annuel', delay: 240 },
        ].map(p => <KpiCard key={p.label} {...p} />)}
      </div>

      {/* ── KPI Row 2 ── */}
      <div className="db-grid-4" style={{ marginBottom: 24 }}>
        {[
          { label: 'Candidatures total', value: d.stages?.total ?? 0, icon: Users, color: PALETTE.indigo, bg: '#eef2ff', sub: 'Dossiers en base', delay: 0 },
          { label: 'Formations actives', value: d.formations?.total ?? 0, icon: BarChart2, color: PALETTE.violet, bg: '#f5f3ff', sub: 'Sessions publiées', delay: 60 },
          { label: 'Inscrits validés', value: d.formations?.totalInscrits ?? 0, icon: CheckCircle, color: PALETTE.teal, bg: '#f0fdfa', sub: 'Statut validé', delay: 120 },
          { label: 'Satisfaction moy.', value: d.formations?.satisfactionMoyenne != null ? `${d.formations.satisfactionMoyenne}/5` : '—', icon: Zap, color: PALETTE.rose, bg: '#fff1f2', sub: 'Note participants', delay: 180 },
        ].map(p => <KpiCard key={p.label} {...p} />)}
      </div>

      {/* ── Budget Alerts ── */}
      {d.budget?.alertes?.length > 0 && (
        <div className="slide-up" style={{
          borderRadius: 20, border: '1px solid rgba(245,158,11,.25)',
          background: 'linear-gradient(135deg, #fffbeb, #fff)',
          padding: 24, marginBottom: 24,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <AlertTriangle size={18} color={PALETTE.amber} />
            </div>
            <div>
              <p style={{ fontWeight: 700, color: '#92400e', fontSize: 14, margin: 0 }}>
                ⚠️ Seuil budget dépassé (&gt; 80%)
              </p>
              <p style={{ fontSize: 12, color: '#b45309', margin: '2px 0 0' }}>
                {d.budget.alertes.length} département(s) nécessitent votre attention
              </p>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
            {d.budget.alertes.map((dept: any) => {
              const pct = Number(dept.budgetFormationAnnuel) > 0
                ? Math.round((Number(dept.budgetUtilise) / Number(dept.budgetFormationAnnuel)) * 100) : 0;
              return (
                <div key={dept.nom} className="alert-dept">
                  <p style={{ fontWeight: 700, fontSize: 13, color: '#1e293b', marginBottom: 4 }}>{dept.nom}</p>
                  <p style={{ fontSize: 26, fontWeight: 800, color: pct >= 90 ? '#ef4444' : '#f59e0b', letterSpacing: '-1px', margin: '0 0 2px' }}>{pct}%</p>
                  <p style={{ fontSize: 11, color: '#94a3b8', marginBottom: 10 }}>
                    {Number(dept.budgetUtilise).toLocaleString('fr-FR')} / {Number(dept.budgetFormationAnnuel).toLocaleString('fr-FR')} TND
                  </p>
                  <div className="prog-bar">
                    <div className="prog-fill" style={{
                      width: `${Math.min(pct, 100)}%`,
                      background: pct >= 90 ? 'linear-gradient(90deg,#ef4444,#dc2626)' : 'linear-gradient(90deg,#f59e0b,#d97706)',
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Charts Row ── */}
      <div className="db-grid-2" style={{ marginBottom: 20 }}>
        {/* Area Chart */}
        <div className="chart-card slide-up" style={{ animationDelay: '100ms' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
            <div>
              <span className="tag-label">Évolution</span>
              <h3 style={{ fontWeight: 800, fontSize: 16, color: '#0f172a', margin: 0, letterSpacing: '-0.3px' }}>
                Candidatures par mois
              </h3>
              <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 3 }}>{new Date().getFullYear()}</p>
            </div>
            <div style={{
              padding: '6px 12px', borderRadius: 10,
              background: '#eff6ff', color: PALETTE.blue,
              fontSize: 12, fontWeight: 600,
            }}>
              {candidaturesData.reduce((a, c) => a + c.candidatures, 0)} total
            </div>
          </div>
          <ResponsiveContainer width="100%" height={210}>
            <AreaChart data={candidaturesData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="fillCand" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={PALETTE.blue} stopOpacity={0.25} />
                  <stop offset="100%" stopColor={PALETTE.blue} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="mois" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="candidatures" name="Candidatures" stroke={PALETTE.blue} strokeWidth={2.5} fill="url(#fillCand)" dot={{ fill: PALETTE.blue, r: 3, strokeWidth: 0 }} activeDot={{ r: 6, strokeWidth: 0 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart */}
        <div className="chart-card slide-up" style={{ animationDelay: '180ms' }}>
          <div style={{ marginBottom: 20 }}>
            <span className="tag-label">Répartition</span>
            <h3 style={{ fontWeight: 800, fontSize: 16, color: '#0f172a', margin: 0, letterSpacing: '-0.3px' }}>
              Statuts des stages
            </h3>
            <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 3 }}>Agrégé · Tous départements</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ flex: '0 0 180px' }}>
              <ResponsiveContainer width={180} height={180}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={78} dataKey="value" paddingAngle={3}>
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i]} stroke="white" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {pieData.map((item, i) => (
                <div className="pie-legend" key={item.name}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="legend-dot" style={{ background: PIE_COLORS[i] }} />
                    <span style={{ fontSize: 12, color: '#475569', fontWeight: 500 }}>{item.name}</span>
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Top Formations Bar Chart ── */}
      {topFormations.length > 0 && (
        <div className="chart-card slide-up" style={{ marginBottom: 20, animationDelay: '220ms' }}>
          <div style={{ marginBottom: 20 }}>
            <span className="tag-label">Popularité</span>
            <h3 style={{ fontWeight: 800, fontSize: 16, color: '#0f172a', margin: 0, letterSpacing: '-0.3px' }}>
              Formations les plus demandées
            </h3>
            <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 3 }}>Top 5 par nombre d'inscriptions</p>
          </div>
          <ResponsiveContainer width="100%" height={Math.max(180, topFormations.length * 52)}>
            <BarChart layout="vertical" data={topFormations} margin={{ left: 0, right: 20, top: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="barGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor={PALETTE.teal} />
                  <stop offset="100%" stopColor="#14b8a6" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} allowDecimals={false} axisLine={false} />
              <YAxis type="category" dataKey="titre" width={150} tick={{ fontSize: 11, fill: '#475569' }} interval={0} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="inscriptions" name="Inscriptions" fill="url(#barGrad)" radius={[0, 8, 8, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ── Budget par département ── */}
      <div className="chart-card slide-up" style={{ marginBottom: 20, animationDelay: '260ms' }}>
        <span className="tag-label">Consommation</span>
        <h3 style={{ fontWeight: 800, fontSize: 16, color: '#0f172a', marginBottom: 4, letterSpacing: '-0.3px' }}>
          Budget formation par département
        </h3>
        <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 20 }}>Utilisation vs plafond annuel</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {(d.budget?.parDepartement || []).map((dept: any) => {
            const pct = Number(dept.budgetFormationAnnuel) > 0
              ? Math.round((Number(dept.budgetUtilise) / Number(dept.budgetFormationAnnuel)) * 100) : 0;
            const color = pct >= 90 ? PALETTE.rose : pct >= 80 ? PALETTE.orange : pct >= 60 ? PALETTE.amber : PALETTE.emerald;
            return (
              <div key={dept.nom}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontWeight: 600, fontSize: 13, color: '#334155' }}>{dept.nom}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 11, color: '#94a3b8' }}>
                      {Number(dept.budgetUtilise).toLocaleString()} TND
                    </span>
                    <span style={{ fontWeight: 800, fontSize: 14, color, minWidth: 40, textAlign: 'right' }}>{pct}%</span>
                  </div>
                </div>
                <div className="prog-bar">
                  <div className="prog-fill" style={{ width: `${Math.min(pct, 100)}%`, background: `linear-gradient(90deg, ${color}, ${color}bb)` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Quick Stats ── */}
      <div className="db-grid-4">
        {[
          { icon: CheckCircle, label: 'Taux acceptation', value: `${d.stages?.tauxAcceptation || 0}%`, color: PALETTE.emerald, bg: '#ecfdf5' },
          { icon: Clock, label: 'En att. validation', value: d.stages?.enAttente || 0, color: PALETTE.amber, bg: '#fffbeb' },
          { icon: Users, label: 'Inscrits formations', value: d.formations?.totalInscrits || 0, color: PALETTE.blue, bg: '#eff6ff' },
          { icon: TrendingUp, label: 'Formateurs internes', value: d.formateurs?.internes || 0, color: PALETTE.violet, bg: '#f5f3ff' },
        ].map((s, i) => (
          <div className="quick-stat slide-up" key={s.label} style={{ animationDelay: `${i * 60}ms` }}>
            <div style={{ width: 44, height: 44, borderRadius: 14, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <s.icon size={20} style={{ color: s.color }} />
            </div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px', lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 4, fontWeight: 500 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}