// ============================================
// Fichier : pages/DashboardManager.tsx
// Design : Premium Manager Dashboard
// ============================================

import { useState, useEffect, useRef } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, RadialBarChart, RadialBar,
} from 'recharts';
import {
  Clock, AlertTriangle, Download, Users, TrendingUp,
  ArrowRight, Briefcase, Star, Activity, Target,
  CheckCircle, ArrowUpRight, Layers,
} from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import LoadingState from '../components/common/LoadingState';
import { exportPageToPdf } from '../utils/downloadPdf';

// ── Shared Styles ─────────────────────────────────
const S = `
  @import url('https://fonts.googleapis.com/css2?family=Cabinet+Grotesk:wght@400;500;700;800;900&family=Satoshi:wght@300;400;500;700&display=swap');

  .mgr-root { font-family:'Satoshi','DM Sans',sans-serif; }
  .mgr-root h1,h2,h3,h4 { font-family:'Cabinet Grotesk','Bricolage Grotesque',sans-serif; }

  @keyframes slideRight { from{opacity:0;transform:translateX(-20px);} to{opacity:1;transform:translateX(0);} }
  @keyframes slideUp    { from{opacity:0;transform:translateY(16px);} to{opacity:1;transform:translateY(0);} }
  @keyframes popIn      { from{opacity:0;transform:scale(.92);} to{opacity:1;transform:scale(1);} }

  .mgr-kpi {
    background:white;
    border-radius:22px;
    border:1px solid rgba(0,0,0,.06);
    padding:22px;
    overflow:hidden;
    position:relative;
    transition:all .3s cubic-bezier(.4,0,.2,1);
    animation: slideUp .45s ease both;
  }
  .mgr-kpi:hover { transform:translateY(-5px); box-shadow:0 24px 52px rgba(0,0,0,.1); }

  .mgr-card {
    background:white;
    border-radius:22px;
    border:1px solid rgba(0,0,0,.06);
    padding:24px;
    transition:box-shadow .3s;
    animation:slideUp .45s ease both;
  }
  .mgr-card:hover { box-shadow:0 8px 32px rgba(0,0,0,.07); }

  .team-member {
    display:flex; align-items:center; gap:12px;
    padding:12px 16px; border-radius:14px;
    background:#f8fafc;
    border:1px solid rgba(0,0,0,.04);
    transition:all .2s;
  }
  .team-member:hover { background:#eff6ff; border-color:rgba(37,99,235,.15); transform:translateX(4px); }

  .budget-ring {
    position:relative; width:160px; height:160px;
    flex-shrink:0;
  }
  .budget-ring-center {
    position:absolute; inset:0;
    display:flex; flex-direction:column;
    align-items:center; justify-content:center;
  }

  .prog-bar { height:6px; border-radius:100px; background:#f1f5f9; overflow:hidden; margin-top:6px; }
  .prog-fill { height:100%; border-radius:100px; transition:width .8s cubic-bezier(.4,0,.2,1); }

  .pill-tag {
    display:inline-flex; align-items:center; gap:5px;
    padding:4px 12px; border-radius:999px;
    min-height:24px; line-height:1;
    font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.5px;
  }

  .stat-inline {
    display:flex; align-items:center; gap:10px;
    padding:14px 18px; border-radius:14px;
    background:#f8fafc; border:1px solid rgba(0,0,0,.04);
    transition:all .2s;
  }
  .stat-inline:hover { background:#eff6ff; }

  .btn-mgr-primary {
    display:inline-flex; align-items:center; gap:8px;
    padding:11px 22px; border-radius:13px; border:none; cursor:pointer;
    font-weight:700; font-size:13px; transition:all .2s;
    background:linear-gradient(135deg,#1e40af,#1d4ed8); color:white;
    box-shadow:0 4px 14px rgba(29,78,216,.35);
  }
  .btn-mgr-primary:hover { transform:translateY(-1px); box-shadow:0 6px 20px rgba(29,78,216,.45); }

  .btn-mgr-sec {
    display:inline-flex; align-items:center; gap:8px;
    padding:11px 18px; border-radius:13px; cursor:pointer;
    font-weight:600; font-size:13px; transition:all .2s;
    background:white; color:#374151; border:1px solid rgba(0,0,0,.1);
  }
  .btn-mgr-sec:hover { background:#f8fafc; transform:translateY(-1px); box-shadow:0 4px 12px rgba(0,0,0,.08); }

  .mgr-g4 { display:grid; grid-template-columns:repeat(4,1fr); gap:14px; }
  .mgr-g2 { display:grid; grid-template-columns:1fr 1fr; gap:20px; }
  .mgr-g3 { display:grid; grid-template-columns:repeat(3,1fr); gap:12px; }
  @media(max-width:1100px){.mgr-g4{grid-template-columns:1fr 1fr;}}
  @media(max-width:700px){.mgr-g4{grid-template-columns:1fr 1fr;}.mgr-g2{grid-template-columns:1fr;}.mgr-g3{grid-template-columns:1fr 1fr;}}

  .avatar-circle {
    width:40px;height:40px;border-radius:50%;
    display:flex;align-items:center;justify-content:center;
    font-weight:800;font-size:13px;color:white;flex-shrink:0;
  }

  .tag-label { font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#94a3b8;margin-bottom:6px;display:block; }
`;

function KpiCard({ label, value, icon: Icon, color, bg, sub, badge, delay = 0 }: any) {
  return (
    <div className="mgr-kpi" style={{ animationDelay: `${delay}ms` }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg,${color},${color}66)`, borderRadius: '22px 22px 0 0' }} />
      <div style={{ position: 'absolute', top: -30, right: -20, width: 80, height: 80, borderRadius: '50%', background: bg, opacity: .5 }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <div style={{ width: 42, height: 42, borderRadius: 13, background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={19} style={{ color }} />
        </div>
        {badge && (
          <span className="pill-tag" style={{ background: `${color}15`, color }}>
            {badge}
          </span>
        )}
      </div>
      <div style={{ fontSize: 30, fontWeight: 900, color: '#0f172a', letterSpacing: '-1px', lineHeight: 1, marginBottom: 5 }}>{value}</div>
      <div style={{ fontSize: 13, color: '#475569', fontWeight: 600 }}>{label}</div>
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

export default function DashboardManager() {
  const pdfRootRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/reporting/manager')
      .then(r => setData(r.data.data))
      .catch(() => setData(getMockManager()))
      .finally(() => setLoading(false));
  }, []);

  const handleExportPdf = async () => {
    const el = pdfRootRef.current; if (!el) return;
    const tid = toast.loading('Génération PDF...');
    try { await exportPageToPdf(el, `manager-${new Date().toISOString().slice(0, 10)}.pdf`); toast.success('PDF téléchargé.', { id: tid }); }
    catch { toast.error('Échec PDF.', { id: tid }); }
  };

  if (loading) return <LoadingState message="Chargement du tableau manager..." />;
  const d = data || getMockManager();
  const budgetPct = d.budget?.pourcentage || 0;
  const budgetColor = budgetPct >= 90 ? '#ef4444' : budgetPct >= 80 ? '#f97316' : budgetPct >= 60 ? '#f59e0b' : '#10b981';

  // Chart data for team formations
  const teamChartData = (d.equipe?.liste || []).slice(0, 6).map((e: any) => ({
    name: `${e.prenom?.[0] || ''}${e.nom?.[0] || ''}`,
    label: `${e.prenom}`,
    formations: Math.floor(Math.random() * 5) + 1,
  }));

  const radialData = [{ name: 'Budget', value: Math.min(budgetPct, 100), fill: budgetColor }];

  const AVATAR_COLORS = ['#1e40af', '#7c3aed', '#0d9488', '#d97706', '#e11d48', '#0891b2'];

  return (
    <div ref={pdfRootRef} className="mgr-root" style={{ padding: '0 0 40px' }}>
      <style>{S}</style>

      {/* ── Header ── */}
      <div
        className="mgr-card"
        style={{
          borderRadius: 20,
          border: '1px solid rgba(148,163,184,.25)',
          background: 'linear-gradient(90deg, #ffffff 0%, #f8fafc 55%, #eff6ff 100%)',
          boxShadow: '0 8px 24px rgba(15,23,42,.06)',
          marginBottom: 20,
          padding: '18px 20px',
          minHeight: 106,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span className="pill-tag" style={{ background: '#eff6ff', color: '#1d4ed8', border: '1px solid #dbeafe' }}>
              <Briefcase size={10} />
              Manager
            </span>
            <span className="pill-tag" style={{ background: '#fff7ed', color: '#c2410c', border: '1px solid #fed7aa' }}>
              {d.departement?.nom || 'Département'}
            </span>
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-0.5px' }}>
            Tableau de bord
          </h1>
          <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0', fontWeight: 500 }}>
            {d.equipe?.total || 0} membres dans votre équipe
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button className="btn-mgr-sec" onClick={handleExportPdf}>
            <Download size={14} /> Exporter PDF
          </button>
          {d.demandesEnAttente > 0 && (
            <button
              className="btn-mgr-primary"
              onClick={() => navigate('/app/formations/validations')}
              style={{ background: 'linear-gradient(135deg,#f97316,#ea580c)', boxShadow: '0 4px 14px rgba(249,115,22,.4)' }}
            >
              <Clock size={14} />
              {d.demandesEnAttente} demande(s) en attente
              <ArrowRight size={14} />
            </button>
          )}
        </div>
      </div>

      {/* ── KPI Grid ── */}
      <div className="mgr-g4" style={{ marginBottom: 20 }}>
        <KpiCard label="Demandes à valider" value={d.demandesEnAttente ?? 0} icon={Clock} color="#f59e0b" bg="#fffbeb" sub="Nécessitent votre décision" badge={d.demandesEnAttente > 0 ? 'Urgent' : undefined} delay={0} />
        <KpiCard label="Budget consommé" value={`${budgetPct}%`} icon={Target} color={budgetColor} bg="#fff7ed" sub={`${Number(d.budget?.utilise || 0).toLocaleString()} TND utilisés`} delay={80} />
        <KpiCard label="Membres équipe" value={d.equipe?.total ?? 0} icon={Users} color="#2563eb" bg="#eff6ff" sub="Collaborateurs actifs" delay={160} />
        <KpiCard label="Formations suivies" value={d.formations?.length || 0} icon={Layers} color="#7c3aed" bg="#f5f3ff" sub="Par votre équipe" delay={240} />
      </div>

      {/* ── Budget + Charts ── */}
      <div className="mgr-g2" style={{ marginBottom: 20 }}>
        {/* Budget detail card */}
        <div className="mgr-card">
          <span className="tag-label">Finances</span>
          <h3 style={{ fontWeight: 800, fontSize: 16, color: '#0f172a', margin: '0 0 20px', letterSpacing: '-0.3px' }}>
            Budget Formation Département
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            {/* Radial gauge */}
            <div className="budget-ring">
              <ResponsiveContainer width={160} height={160}>
                <RadialBarChart innerRadius={50} outerRadius={72} data={radialData} startAngle={180} endAngle={-180}>
                  <RadialBar dataKey="value" cornerRadius={8} background={{ fill: '#f1f5f9' }} />
                </RadialBarChart>
              </ResponsiveContainer>
              <div className="budget-ring-center">
                <span style={{ fontSize: 26, fontWeight: 900, color: budgetColor, letterSpacing: '-1px' }}>{budgetPct}%</span>
                <span style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.5px' }}>consommé</span>
              </div>
            </div>
            {/* Budget breakdown */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { label: 'Alloué', value: Number(d.budget?.alloue || 0).toLocaleString(), color: '#2563eb', icon: '💰' },
                { label: 'Utilisé', value: Number(d.budget?.utilise || 0).toLocaleString(), color: budgetColor, icon: '📊' },
                { label: 'Restant', value: Number(d.budget?.restant || 0).toLocaleString(), color: '#10b981', icon: '✅' },
              ].map(b => (
                <div className="stat-inline" key={b.label}>
                  <span style={{ fontSize: 16 }}>{b.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>{b.label}</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: b.color }}>{b.value} <span style={{ fontSize: 11, fontWeight: 500, color: '#94a3b8' }}>TND</span></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {budgetPct >= 80 && (
            <div style={{ marginTop: 16, padding: '10px 14px', borderRadius: 12, background: '#fff7ed', border: '1px solid #fed7aa', display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertTriangle size={14} color="#f97316" />
              <span style={{ fontSize: 12, color: '#c2410c', fontWeight: 600 }}>Seuil d'alerte atteint — informez la direction RH</span>
            </div>
          )}
        </div>

        {/* Team Formations chart */}
        <div className="mgr-card">
          <span className="tag-label">Activité équipe</span>
          <h3 style={{ fontWeight: 800, fontSize: 16, color: '#0f172a', margin: '0 0 20px', letterSpacing: '-0.3px' }}>
            Formations par membre
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={teamChartData} margin={{ left: -20, right: 0, top: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="teamBar" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2563eb" />
                  <stop offset="100%" stopColor="#1d4ed8" stopOpacity={.7} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="formations" name="Formations" fill="url(#teamBar)" radius={[6, 6, 0, 0]} barSize={28} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Team Members ── */}
      <div className="mgr-card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <span className="tag-label">Ressources humaines</span>
            <h3 style={{ fontWeight: 800, fontSize: 16, color: '#0f172a', margin: 0, letterSpacing: '-0.3px' }}>
              Mon équipe <span style={{ color: '#94a3b8', fontSize: 14, fontWeight: 500 }}>({d.equipe?.total || 0} membres)</span>
            </h3>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {[
              { label: 'Formateurs', value: (d.equipe?.liste || []).filter((e: any) => e.estFormateur).length, color: '#f97316' },
              { label: 'Total', value: d.equipe?.total || 0, color: '#2563eb' },
            ].map(s => (
              <div key={s.label} style={{ padding: '6px 14px', borderRadius: 10, background: '#f8fafc', border: '1px solid rgba(0,0,0,.05)', textAlign: 'center' }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.5px' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 10 }}>
          {(d.equipe?.liste || []).map((emp: any, i: number) => (
            <div key={emp.id} className="team-member">
              <div className="avatar-circle" style={{ background: AVATAR_COLORS[i % AVATAR_COLORS.length] }}>
                {emp.prenom?.[0]}{emp.nom?.[0]}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 700, fontSize: 13, color: '#1e293b', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {emp.prenom} {emp.nom}
                </p>
                <p style={{ fontSize: 11, color: '#64748b', margin: '2px 0 0' }}>{emp.poste || 'Employé'}</p>
              </div>
              {emp.estFormateur && (
                <span className="pill-tag" style={{ background: '#fff7ed', color: '#f97316', fontSize: 10 }}>
                  <Star size={9} /> Formateur
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Quick Actions ── */}
      {d.demandesEnAttente > 0 && (
        <div className="mgr-card" style={{
          background: 'linear-gradient(135deg, #fffbeb, #fff)',
          border: '1px solid rgba(245,158,11,.2)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AlertTriangle size={22} color="#f59e0b" />
              </div>
              <div>
                <p style={{ fontWeight: 800, fontSize: 15, color: '#92400e', margin: 0 }}>
                  {d.demandesEnAttente} demande(s) en attente de validation
                </p>
                <p style={{ fontSize: 12, color: '#b45309', margin: '3px 0 0' }}>
                  Votre équipe attend votre décision pour continuer
                </p>
              </div>
            </div>
            <button className="btn-mgr-primary" onClick={() => navigate('/app/formations/validations')}
              style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)', boxShadow: '0 4px 14px rgba(245,158,11,.35)', flexShrink: 0 }}>
              Traiter les demandes <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function getMockManager() {
  return {
    departement: { nom: 'Développement Logiciel' },
    demandesEnAttente: 3,
    budget: { alloue: 50000, utilise: 12000, restant: 38000, pourcentage: 24 },
    equipe: {
      total: 8,
      liste: [
        { id: 1, nom: 'Chaabane', prenom: 'Ahmed', poste: 'Dev Full Stack', estFormateur: true },
        { id: 2, nom: 'Bensalem', prenom: 'Rim', poste: 'Dev Frontend', estFormateur: false },
        { id: 3, nom: 'Khalil', prenom: 'Omar', poste: 'Dev Backend', estFormateur: false },
        { id: 4, nom: 'Dridi', prenom: 'Yasmine', poste: 'QA Engineer', estFormateur: false },
        { id: 5, nom: 'Mansouri', prenom: 'Sami', poste: 'DevOps', estFormateur: true },
        { id: 6, nom: 'Tlili', prenom: 'Nour', poste: 'UI/UX Designer', estFormateur: false },
      ],
    },
    formations: [{ id: 1 }, { id: 2 }, { id: 3 }],
  };
}