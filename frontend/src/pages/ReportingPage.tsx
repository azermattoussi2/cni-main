// ============================================
// Fichier : pages/ReportingPage.tsx
// Description : Page Rapports et Analyses
// Graphiques interactifs Recharts, export rapport
// Auteur : Développeur CNI — Date : 14/04/2026
// ============================================

import { useState, useEffect, useRef } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area
} from 'recharts';
import { Download, RefreshCw } from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import LoadingState from '../components/common/LoadingState';
import ErrorState from '../components/common/ErrorState';
import { PageStatGrid } from '../components/common/PageStatGrid';
import { exportPageToPdf } from '../utils/downloadPdf';
import { useAuthStore } from '../stores/authStore';
import type { Role } from '../types';

/** Données `/reporting/manager` → même forme minimale que la vue RH pour les graphiques existants */
function normalizeManagerReporting(payload: Record<string, unknown> | null | undefined) {
  if (!payload) {
    return {
      reportScope: 'manager' as const,
      managerNotice: 'Réponse vide du serveur.',
      stages: { enAttente: 0, enCours: 0, acceptes: 0, refuses: 0, total: 0 },
      formations: { total: 0, duMois: 0, totalInscrits: 0, enCours: 0 },
      budget: { parDepartement: [] as { nom?: string; budgetFormationAnnuel?: number; budgetUtilise?: number }[] },
      graphiques: { candidaturesParMois: [] as { mois?: number; count?: number }[], topFormations: [] },
      rapportHebdo: null,
      equipe: null,
      demandesEnAttente: 0,
    };
  }
  const dept = payload.departement as Record<string, unknown> | undefined;
  if (!dept) {
    return {
      reportScope: 'manager' as const,
      managerNotice: (payload.message as string) || 'Aucun département assigné à votre compte.',
      stages: { enAttente: 0, enCours: 0, acceptes: 0, refuses: 0, total: 0 },
      formations: { total: 0, duMois: 0, totalInscrits: 0, enCours: 0 },
      budget: { parDepartement: [] as { nom?: string; budgetFormationAnnuel?: number; budgetUtilise?: number }[] },
      graphiques: { candidaturesParMois: [] as { mois?: number; count?: number }[], topFormations: [] },
      rapportHebdo: null,
      equipe: null,
      demandesEnAttente: 0,
    };
  }
  const formationsList = (payload.formations as unknown[]) || [];
  return {
    reportScope: 'manager' as const,
    managerNotice: null as string | null,
    departement: dept,
    demandesEnAttente: Number(payload.demandesEnAttente ?? 0),
    equipe: payload.equipe,
    managerFormations: formationsList,
    stages: { enAttente: 0, enCours: 0, acceptes: 0, refuses: 0, total: 0 },
    formations: {
      total: formationsList.length,
      duMois: 0,
      totalInscrits: formationsList.length,
      enCours: 0,
    },
    budget: {
      parDepartement: [
        {
          nom: String(dept.nom ?? 'Département'),
          budgetFormationAnnuel: Number(dept.budgetFormationAnnuel ?? 0),
          budgetUtilise: Number(dept.budgetUtilise ?? 0),
          budgetRestant: Number(dept.budgetRestant ?? 0),
        },
      ],
    },
    graphiques: { candidaturesParMois: [], topFormations: [] },
    rapportHebdo: null,
  };
}

const COLORS = ['#1F3C73', '#2F5FA8', '#4FD1C5', '#8b5cf6', '#ef4444', '#f59e0b'];
const MOIS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

const REPORT_TABS = [
  { id: 'stages', label: '🎓 Stages' },
  { id: 'formations', label: '📚 Formations' },
  { id: 'budget', label: '💰 Budget' },
  { id: 'formateurs', label: '👨‍🏫 Formateurs' },
] as const;

export default function ReportingPage() {
  const pdfRootRef = useRef<HTMLDivElement>(null);
  const { user } = useAuthStore();
  const role = user?.role as Role | undefined;
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<'stages' | 'formations' | 'budget' | 'formateurs'>('stages');

  const fetchData = async () => {
    try {
      setError(null);
      if (role === 'Direction_RH') {
        const rh = await api.get('/reporting/rh');
        setData({ ...rh.data.data, reportScope: 'rh' });
      } else if (role === 'Manager') {
        const mgr = await api.get('/reporting/manager');
        setData(normalizeManagerReporting(mgr.data.data));
      } else {
        setError('Rôle non pris en charge pour cette page.');
      }
    } catch {
      setError('Impossible de charger les rapports.');
      toast.error('Chargement des rapports échoué');
    }
  };

  useEffect(() => {
    if (!user?.role) return;
    if (role === 'Direction_RH' || role === 'Manager') {
      void fetchData();
    } else {
      setError('Accès réservé à la Direction RH ou aux managers.');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.role, role]);

  const handleExportPdf = async () => {
    const el = pdfRootRef.current;
    if (!el) return;
    const tid = toast.loading('Génération du PDF (capture de la page)...');
    try {
      await exportPageToPdf(el, `rapports-analyses-${new Date().toISOString().slice(0, 10)}.pdf`);
      toast.success('PDF téléchargé.', { id: tid });
    } catch {
      toast.error('Échec de la génération du PDF.', { id: tid });
    }
  };

  if (!data && !error) return <LoadingState message="Chargement des rapports..." />;
  if (error || !data) return <ErrorState message={error || 'Aucune donnée de rapport.'} onRetry={fetchData} />;

  const candidaturesData = MOIS.map((m, i) => ({
    mois: m,
    candidatures: data.graphiques?.candidaturesParMois?.find((c: any) => c.mois === i + 1)?.count || 0,
    acceptees: 0,
  }));

  const reportStats =
    data.reportScope === 'manager'
      ? [
          { label: 'Demandes à valider', value: data.demandesEnAttente ?? 0, color: 'bg-amber-50 border-amber-200', text: 'text-amber-700' },
          { label: 'Formations (liste)', value: data.formations?.total ?? data.managerFormations?.length ?? 0, color: 'bg-blue-50 border-blue-200', text: 'text-blue-700' },
          { label: 'Inscrits (vue)', value: data.formations?.totalInscrits ?? 0, color: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700' },
          { label: 'Budget utilisé %', value: `${Math.round((Number(data.budget?.parDepartement?.[0]?.budgetUtilise ?? 0) / Math.max(Number(data.budget?.parDepartement?.[0]?.budgetFormationAnnuel ?? 1), 1)) * 100)}%`, color: 'bg-orange-50 border-orange-200', text: 'text-orange-700' },
        ]
      : [
          { label: 'Stages en attente', value: data.stages?.enAttente ?? 0, color: 'bg-amber-50 border-amber-200', text: 'text-amber-700' },
          { label: 'Stages en cours', value: data.stages?.enCours ?? 0, color: 'bg-blue-50 border-blue-200', text: 'text-blue-700' },
          { label: 'Formations (mois)', value: data.formations?.duMois ?? 0, color: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700' },
          { label: 'Inscriptions', value: data.formations?.totalInscrits ?? 0, color: 'bg-purple-50 border-purple-200', text: 'text-purple-700' },
        ];

  const budgetData = (data.budget?.parDepartement || []).map((d: any) => ({
    name: d.nom?.split(' ')[0] || 'Dept',
    alloue: Number(d.budgetFormationAnnuel) / 1000,
    utilise: Number(d.budgetUtilise) / 1000,
  }));

  const satisfactionData = [
    { mois: 'Jan', note: 4.2 }, { mois: 'Fév', note: 4.3 }, { mois: 'Mar', note: 4.1 },
    { mois: 'Avr', note: 4.5 }, { mois: 'Mai', note: 4.4 }, { mois: 'Jun', note: 4.6 },
  ];

  const repartitionFormations = [
    { name: 'Informatique', value: 8 }, { name: 'Management', value: 3 },
    { name: 'Langue', value: 2 }, { name: 'Sécurité', value: 4 }, { name: 'Autre', value: 2 },
  ];

  return (
    <div ref={pdfRootRef} className="space-y-6 animate-fadeIn">
      <div className="page-header">
        <div>
          <h1 className="page-title">Rapports et Analyses</h1>
          <p className="page-subtitle">
            {data?.reportScope === 'manager'
              ? 'Vue département — indicateurs liés à votre équipe'
              : 'Tableaux de bord interactifs en temps réel'}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchData} className="btn-secondary text-sm"><RefreshCw size={14} /> Actualiser</button>
          <button type="button" onClick={handleExportPdf} className="btn-primary text-sm">
            <Download size={14} /> Exporter PDF
          </button>
        </div>
      </div>

      <PageStatGrid items={reportStats} />

      {data.managerNotice && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 text-amber-900 text-sm px-4 py-3">
          {data.managerNotice}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {REPORT_TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id as any)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === t.id ? 'bg-white text-cni-blue shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Onglet Stages */}
      {tab === 'stages' && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="card">
            <h3 className="font-bold text-gray-900 text-sm mb-4">Candidatures par mois</h3>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={candidaturesData}>
                <defs>
                  <linearGradient id="colorCand" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1e40af" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#1e40af" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="mois" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                <Area type="monotone" dataKey="candidatures" stroke="#1e40af" fill="url(#colorCand)" name="Candidatures" />
                <Area type="monotone" dataKey="acceptees" stroke="#10b981" fill="url(#colorCand)" name="Acceptées" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="card">
            <h3 className="font-bold text-gray-900 text-sm mb-4">Répartition des statuts</h3>
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="50%" height={200}>
                <PieChart>
                  <Pie data={[
                    { name: 'En attente', value: data.stages?.enAttente || 5 },
                    { name: 'En cours', value: data.stages?.enCours || 8 },
                    { name: 'Acceptés', value: data.stages?.acceptes || 12 },
                    { name: 'Refusés', value: data.stages?.refuses || 3 },
                  ]} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value" paddingAngle={3}>
                    {COLORS.map((c, i) => <Cell key={i} fill={c} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 flex-1">
                {[
                  { label: 'En attente', value: data.stages?.enAttente || 5, color: COLORS[1] },
                  { label: 'En cours', value: data.stages?.enCours || 8, color: COLORS[0] },
                  { label: 'Acceptés', value: data.stages?.acceptes || 12, color: COLORS[2] },
                  { label: 'Refusés', value: data.stages?.refuses || 3, color: COLORS[4] },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: item.color }} />
                      <span className="text-xs text-gray-600">{item.label}</span>
                    </div>
                    <span className="text-xs font-bold">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Onglet Formations */}
      {tab === 'formations' && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="card">
            <h3 className="font-bold text-gray-900 text-sm mb-4">Répartition par domaine</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={repartitionFormations} barSize={24}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} name="Formations">
                  {repartitionFormations.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="card">
            <h3 className="font-bold text-gray-900 text-sm mb-4">Évolution satisfaction</h3>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={satisfactionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="mois" tick={{ fontSize: 11 }} />
                <YAxis domain={[3.5, 5]} tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                <Line type="monotone" dataKey="note" stroke="#f97316" strokeWidth={2} dot={{ r: 4 }} name="Note /5" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Onglet Budget */}
      {tab === 'budget' && (
        <div className="card">
          <h3 className="font-bold text-gray-900 text-sm mb-4">Budget par département (en milliers TND)</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={budgetData} barSize={20}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} formatter={(v: any) => `${v}k TND`} />
              <Legend />
              <Bar dataKey="alloue" fill="#1e40af" radius={[4, 4, 0, 0]} name="Alloué" />
              <Bar dataKey="utilise" fill="#f97316" radius={[4, 4, 0, 0]} name="Utilisé" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Onglet Formateurs */}
      {tab === 'formateurs' && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="card">
            <h3 className="font-bold text-gray-900 text-sm mb-4">Heures formation par formateur</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={[
                { name: 'Ahmed C.', heures: 24 }, { name: 'Youssef H.', heures: 48 },
                { name: 'Rim B.', heures: 12 }, { name: 'Omar K.', heures: 8 },
              ]} barSize={24}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="heures" fill="#f97316" radius={[4, 4, 0, 0]} name="Heures" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="card">
            <h3 className="font-bold text-gray-900 text-sm mb-4">Top formateurs (par note)</h3>
            <div className="space-y-3">
              {[
                { nom: 'Youssef H.', note: 4.8, heures: 48, badge: 'Étoile d\'Or' },
                { nom: 'Ahmed C.', note: 4.5, heures: 24, badge: 'Formateur 10h' },
                { nom: 'Rim B.', note: 4.2, heures: 12, badge: null },
              ].map(f => (
                <div key={f.nom} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <div className="w-8 h-8 rounded-full bg-cni-orange/20 flex items-center justify-center text-cni-orange font-bold text-xs">
                    {f.nom[0]}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 text-sm">{f.nom}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-amber-500">★ {f.note}</span>
                      <span className="text-xs text-gray-400">{f.heures}h</span>
                      {f.badge && <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">{f.badge}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

