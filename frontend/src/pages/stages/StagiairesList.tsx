// ============================================
// Fichier : pages/stages/StagiairesList.tsx
// Description : Liste des candidatures/stagiaires avec filtres
// Actions : valider, refuser, voir détail
// Auteur : Développeur CNI — Date : 14/04/2026
// ============================================

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Eye, Plus, Pencil, Archive, ShieldOff, Trash2, CheckCircle, XCircle } from 'lucide-react';
import api from '../../lib/api';
import { useAuthStore } from '../../stores/authStore';
import { STATUT_STAGE_LABELS, type Stagiaire } from '../../types';
import toast from 'react-hot-toast';

type DepartementLite = { id: number; nom: string };
type EditForm = {
  nom?: string;
  prenom?: string;
  email?: string;
  telephone?: string;
  ecoleUniversite?: string;
  specialite?: string;
  typeStage?: string;
  statut?: string;
  departementId?: number | string;
  dateDebutStage?: string;
  dateFinStage?: string;
  motivation?: string;
};
type SortKey = 'candidat' | 'ecole' | 'departement' | 'type' | 'periode' | 'statut';

const STATUT_COLORS: Record<string, string> = {
  En_attente: 'badge-warning',
  En_examen: 'badge-info',
  Accepte: 'badge-success',
  Refuse: 'badge-danger',
  En_cours: 'bg-blue-100 text-blue-700 badge',
  Termine: 'bg-gray-100 text-gray-600 badge',
  Annule: 'badge-danger',
};

export default function StagiairesList() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [stagiaires, setStagiaires] = useState<Stagiaire[]>([]);
  const [departements, setDepartements] = useState<DepartementLite[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>('candidat');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [search, setSearch] = useState('');
  const [statut, setStatut] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selected, setSelected] = useState<Stagiaire | null>(null);
  const [createForm, setCreateForm] = useState({
    nom: '', prenom: '', email: '', telephone: '',
    ecoleUniversite: '', specialite: '',
    departementId: '', dateDebutStage: '', dateFinStage: '',
    typeStage: 'PFE', motivation: '',
  });
  const [editForm, setEditForm] = useState<EditForm>({});
  const isRH = user?.role === 'Direction_RH';
  const isManager = user?.role === 'Manager';
  const isSupervisorView =
    user?.role === 'Employe' || user?.role === 'Formateur_Interne' || user?.role === 'Formateur_Externe';

  const fetchData = () => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (statut) params.append('statut', statut);
    api.get(`/stagiaires?${params}`)
      .then(r => setStagiaires(r.data.data || []))
      .catch(() => {
        setStagiaires([]);
        toast.error('Chargement des stagiaires impossible.');
      })
      .finally(() => setLoading(false));
  };

  const fetchDepartements = async () => {
    try {
      const r = await api.get('/departements');
      setDepartements(r.data.data || []);
    } catch {
      setDepartements([]);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search, statut]);

  useEffect(() => {
    if (isRH || isManager) fetchDepartements();
  }, [isRH, isManager]);

  const resetCreateForm = () => {
    setCreateForm({
      nom: '', prenom: '', email: '', telephone: '',
      ecoleUniversite: '', specialite: '',
      departementId: '', dateDebutStage: '', dateFinStage: '',
      typeStage: 'PFE', motivation: '',
    });
  };

  const openEdit = (s: Stagiaire) => {
    setSelected(s);
    setEditForm({
      nom: s.nom || '',
      prenom: s.prenom || '',
      email: s.email || '',
      telephone: s.telephone || '',
      ecoleUniversite: s.ecoleUniversite || '',
      specialite: s.specialite || '',
      typeStage: s.typeStage || 'PFE',
      statut: s.statut,
      departementId: s.departementId || s.departement?.id || '',
      dateDebutStage: s.dateDebutStage ? String(s.dateDebutStage).slice(0, 10) : '',
      dateFinStage: s.dateFinStage ? String(s.dateFinStage).slice(0, 10) : '',
      motivation: s.motivation || '',
    });
    setIsEditOpen(true);
  };

  const submitCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/stagiaires/internal', {
        nom: createForm.nom,
        prenom: createForm.prenom,
        email: createForm.email,
        telephone: createForm.telephone || undefined,
        ecoleUniversite: createForm.ecoleUniversite || undefined,
        specialite: createForm.specialite || undefined,
        departementId: Number(createForm.departementId),
        dateDebutStage: createForm.dateDebutStage,
        dateFinStage: createForm.dateFinStage,
        typeStage: createForm.typeStage,
        motivation: createForm.motivation || undefined,
        rgpdConsenti: true,
      });
      toast.success('Nouvelle candidature créée (sans OTP - création interne RH/Manager).');
      setIsCreateOpen(false);
      resetCreateForm();
      fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Création impossible.');
    } finally {
      setSubmitting(false);
    }
  };

  const submitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected?.id) return;
    setSubmitting(true);
    try {
      await api.put(`/stagiaires/${selected.id}`, {
        ...editForm,
        departementId: editForm.departementId ? Number(editForm.departementId) : undefined,
      });
      toast.success('Dossier modifié avec succès.');
      setIsEditOpen(false);
      setSelected(null);
      fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Modification impossible.');
    } finally {
      setSubmitting(false);
    }
  };

  const updateStatus = async (id: number, newStatut: string, successMsg: string) => {
    try {
      await api.put(`/stagiaires/${id}`, { statut: newStatut });
      toast.success(successMsg);
      fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Action impossible.');
    }
  };

  const managerDecision = async (id: number, action: 'accepter' | 'refuser') => {
    try {
      await api.post(`/stagiaires/${id}/valider-manager`, { action });
      toast.success(action === 'accepter' ? 'Candidature acceptée (manager).' : 'Candidature refusée (manager).');
      fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Validation manager impossible.');
    }
  };

  const rhDecision = async (id: number, action: 'accepter' | 'refuser') => {
    try {
      await api.post(`/stagiaires/${id}/valider-rh`, { action });
      toast.success(action === 'accepter' ? 'Candidature transmise au manager.' : 'Candidature refusée.');
      fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Validation RH impossible.');
    }
  };

  const counts = {
    total: stagiaires.length,
    enAttente: stagiaires.filter(s => s.statut === 'En_attente').length,
    enCours: stagiaires.filter(s => s.statut === 'En_cours').length,
    acceptes: stagiaires.filter(s => s.statut === 'Accepte').length,
  };
  const sortBy = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setSortKey(key);
    setSortDir('asc');
  };
  const strictRows = isSupervisorView
    ? stagiaires.filter(
        (s) => Number(s.tuteurId) === Number(user?.id) && !!s.projetPdfPath
      )
    : stagiaires;
  const rows = [...strictRows].sort((a, b) => {
    const getValue = (s: Stagiaire) => {
      if (sortKey === 'candidat') return `${s.prenom || ''} ${s.nom || ''}`.toLowerCase();
      if (sortKey === 'ecole') return (s.ecoleUniversite || '').toLowerCase();
      if (sortKey === 'departement') return (s.departement?.nom || '').toLowerCase();
      if (sortKey === 'type') return (s.typeStage || '').toLowerCase();
      if (sortKey === 'statut') return (s.statut || '').toLowerCase();
      return `${s.dateDebutStage || ''}-${s.dateFinStage || ''}`;
    };
    const va = getValue(a);
    const vb = getValue(b);
    if (va === vb) return 0;
    const cmp = va > vb ? 1 : -1;
    return sortDir === 'asc' ? cmp : -cmp;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="page-header">
        <div>
          <h1 className="page-title">{isSupervisorView ? 'Stages suivis' : 'Candidatures & Stages'}</h1>
          <p className="page-subtitle text-slate-600">
            {isSupervisorView
              ? 'Uniquement les stagiaires qui vous sont liés par la RH avec projet assigné.'
              : 'Suivi des candidatures et du parcours stage.'}
          </p>
        </div>
        {(isRH || isManager) && (
          <button onClick={() => setIsCreateOpen(true)} className="btn-primary text-sm">
            <Plus size={14} /> Nouvelle candidature
          </button>
        )}
      </div>

      {/* Compteurs rapides */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { label: 'Total', value: counts.total, color: 'bg-gray-50 border-gray-200', text: 'text-gray-700' },
          { label: 'En attente', value: counts.enAttente, color: 'bg-amber-50 border-amber-200', text: 'text-amber-700' },
          { label: 'Acceptés', value: counts.acceptes, color: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700' },
          { label: 'En cours', value: counts.enCours, color: 'bg-blue-50 border-blue-200', text: 'text-blue-700' },
        ].map(c => (
          <div key={c.label} className={`${c.color} rounded-2xl border p-4 text-center shadow-sm`}>
            <div className={`text-2xl font-black ${c.text}`}>{c.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{c.label}</div>
          </div>
        ))}
      </div>

      {/* Filtres */}
      <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text" placeholder="Rechercher par nom, email..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="input pl-9"
          />
        </div>
        <select value={statut} onChange={e => setStatut(e.target.value)} className="input w-auto min-w-40">
          <option value="">Tous les statuts</option>
          {Object.entries(STATUT_STAGE_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 border-cni-blue border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="table-container overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="table">
            <thead>
              <tr>
                <th className="cursor-pointer" onClick={() => sortBy('candidat')}>Candidat</th>
                <th className="cursor-pointer" onClick={() => sortBy('ecole')}>École</th>
                <th className="cursor-pointer" onClick={() => sortBy('departement')}>Département</th>
                <th className="cursor-pointer" onClick={() => sortBy('type')}>Type</th>
                <th>Projet RH</th>
                <th>Lié à</th>
                <th className="cursor-pointer" onClick={() => sortBy('periode')}>Période</th>
                <th className="cursor-pointer" onClick={() => sortBy('statut')}>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(s => (
                <tr key={s.id}>
                  <td className="min-w-[240px]">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cni-blue to-cni-orange flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {s.prenom?.[0]}{s.nom?.[0]}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{s.prenom} {s.nom}</p>
                        <p className="text-xs text-gray-400">{s.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="text-gray-600 whitespace-nowrap">{s.ecoleUniversite || '—'}</td>
                  <td className="text-gray-600 whitespace-nowrap">{s.departement?.nom || '—'}</td>
                  <td><span className="badge-gray whitespace-nowrap">{s.typeStage || 'PFE'}</span></td>
                  <td className="max-w-[280px]">
                    {s.sujetStage ? (
                      <div className="space-y-1">
                        <p className="truncate text-sm font-medium text-slate-800">{s.sujetStage}</p>
                        <p className="text-xs text-slate-500">{s.projetPdfPath ? 'Fiche projet générée' : 'Projet sans PDF'}</p>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">Non assigné</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap text-xs text-slate-600">
                    {s.tuteur ? `${s.tuteur.prenom} ${s.tuteur.nom}` : '—'}
                  </td>
                  <td className="text-xs text-gray-500 whitespace-nowrap">
                    {s.dateDebutStage ? new Date(s.dateDebutStage).toLocaleDateString('fr-FR') : '—'}
                    {s.dateFinStage ? ` → ${new Date(s.dateFinStage).toLocaleDateString('fr-FR')}` : ''}
                  </td>
                  <td>
                    <span className={`${STATUT_COLORS[s.statut] || 'badge-gray'} whitespace-nowrap`}>
                      {STATUT_STAGE_LABELS[s.statut] || s.statut}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => navigate(`/app/stagiaires/${s.id}`)}
                        className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors"
                        title="Voir détail"
                      >
                        <Eye size={15} />
                      </button>
                      {isRH && (
                        <>
                          <button
                            onClick={() => openEdit(s)}
                            className="p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-600 transition-colors"
                            title="Modifier"
                          >
                            <Pencil size={15} />
                          </button>
                          {s.statut === 'En_attente' && (
                            <>
                              <button
                                onClick={() => rhDecision(s.id, 'accepter')}
                                className="p-1.5 rounded-lg hover:bg-green-50 text-green-600 transition-colors"
                                title="Valider RH"
                              >
                                <CheckCircle size={15} />
                              </button>
                              <button
                                onClick={() => rhDecision(s.id, 'refuser')}
                                className="p-1.5 rounded-lg hover:bg-red-50 text-red-600 transition-colors"
                                title="Refuser RH"
                              >
                                <XCircle size={15} />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => updateStatus(s.id, 'Annule', 'Dossier archivé.')}
                            className="p-1.5 rounded-lg hover:bg-amber-50 text-amber-600 transition-colors"
                            title="Archiver"
                          >
                            <Archive size={15} />
                          </button>
                          <button
                            onClick={() => updateStatus(s.id, 'Refuse', 'Dossier bloqué.')}
                            className="p-1.5 rounded-lg hover:bg-orange-50 text-orange-600 transition-colors"
                            title="Bloquer"
                          >
                            <ShieldOff size={15} />
                          </button>
                          <button
                            onClick={() => updateStatus(s.id, 'Annule', 'Dossier supprimé (archivage logique).')}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-red-600 transition-colors"
                            title="Supprimer (logique)"
                          >
                            <Trash2 size={15} />
                          </button>
                        </>
                      )}
                      {isManager && s.statut === 'En_examen' && (
                        <>
                          <button
                            onClick={() => managerDecision(s.id, 'accepter')}
                            className="p-1.5 rounded-lg hover:bg-green-50 text-green-600 transition-colors"
                            title="Accepter (Manager)"
                          >
                            <CheckCircle size={15} />
                          </button>
                          <button
                            onClick={() => managerDecision(s.id, 'refuser')}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-red-600 transition-colors"
                            title="Refuser (Manager)"
                          >
                            <XCircle size={15} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={9} className="text-center py-12 text-gray-400">
                  <p className="text-sm">Aucun résultat trouvé</p>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal création candidature */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-xl">
            <div className="p-5 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Nouvelle candidature</h2>
              <p className="text-sm text-gray-500">Création rapide sans quitter le tableau de bord</p>
              <p className="mt-2 inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-indigo-700">
                Création interne RH/Manager (OTP non requis)
              </p>
            </div>
            <form onSubmit={submitCreate} className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="label">Nom</label><input className="input" required value={createForm.nom} onChange={e => setCreateForm(s => ({ ...s, nom: e.target.value }))} /></div>
              <div><label className="label">Prénom</label><input className="input" required value={createForm.prenom} onChange={e => setCreateForm(s => ({ ...s, prenom: e.target.value }))} /></div>
              <div className="md:col-span-2"><label className="label">Email</label><input type="email" className="input" required value={createForm.email} onChange={e => setCreateForm(s => ({ ...s, email: e.target.value }))} /></div>
              <div><label className="label">Téléphone</label><input className="input" value={createForm.telephone} onChange={e => setCreateForm(s => ({ ...s, telephone: e.target.value }))} /></div>
              <div><label className="label">Type de stage</label><select className="input" value={createForm.typeStage} onChange={e => setCreateForm(s => ({ ...s, typeStage: e.target.value }))}><option value="PFE">PFE</option><option value="PFA">PFA</option><option value="Observation">Observation</option></select></div>
              <div><label className="label">École / Université</label><input className="input" value={createForm.ecoleUniversite} onChange={e => setCreateForm(s => ({ ...s, ecoleUniversite: e.target.value }))} /></div>
              <div><label className="label">Spécialité</label><input className="input" value={createForm.specialite} onChange={e => setCreateForm(s => ({ ...s, specialite: e.target.value }))} /></div>
              <div><label className="label">Département</label><select className="input" required value={createForm.departementId} onChange={e => setCreateForm(s => ({ ...s, departementId: e.target.value }))}><option value="">Sélectionner</option>{departements.map((d) => <option key={d.id} value={d.id}>{d.nom}</option>)}</select></div>
              <div><label className="label">Date début</label><input type="date" className="input" required value={createForm.dateDebutStage} onChange={e => setCreateForm(s => ({ ...s, dateDebutStage: e.target.value }))} /></div>
              <div><label className="label">Date fin</label><input type="date" className="input" required value={createForm.dateFinStage} onChange={e => setCreateForm(s => ({ ...s, dateFinStage: e.target.value }))} /></div>
              <div className="md:col-span-2"><label className="label">Motivation</label><textarea className="input min-h-24" value={createForm.motivation} onChange={e => setCreateForm(s => ({ ...s, motivation: e.target.value }))} /></div>
              <div className="md:col-span-2 flex justify-end gap-2">
                <button type="button" className="btn-secondary" onClick={() => { setIsCreateOpen(false); resetCreateForm(); }}>Annuler</button>
                <button type="submit" className="btn-primary" disabled={submitting}>{submitting ? 'Création...' : 'Créer'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal édition dossier */}
      {isEditOpen && selected && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-xl">
            <div className="p-5 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Modifier le dossier</h2>
              <p className="text-sm text-gray-500">{selected.prenom} {selected.nom}</p>
            </div>
            <form onSubmit={submitEdit} className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="label">Nom</label><input className="input" value={editForm.nom || ''} onChange={e => setEditForm((s) => ({ ...s, nom: e.target.value }))} /></div>
              <div><label className="label">Prénom</label><input className="input" value={editForm.prenom || ''} onChange={e => setEditForm((s) => ({ ...s, prenom: e.target.value }))} /></div>
              <div className="md:col-span-2"><label className="label">Email</label><input type="email" className="input" value={editForm.email || ''} onChange={e => setEditForm((s) => ({ ...s, email: e.target.value }))} /></div>
              <div><label className="label">Téléphone</label><input className="input" value={editForm.telephone || ''} onChange={e => setEditForm((s) => ({ ...s, telephone: e.target.value }))} /></div>
              <div><label className="label">Type de stage</label><input className="input" value={editForm.typeStage || ''} onChange={e => setEditForm((s) => ({ ...s, typeStage: e.target.value }))} /></div>
              <div><label className="label">Département</label><select className="input" value={editForm.departementId || ''} onChange={e => setEditForm((s) => ({ ...s, departementId: e.target.value }))}><option value="">Sélectionner</option>{departements.map((d) => <option key={d.id} value={d.id}>{d.nom}</option>)}</select></div>
              <div><label className="label">Date début</label><input type="date" className="input" value={editForm.dateDebutStage || ''} onChange={e => setEditForm((s) => ({ ...s, dateDebutStage: e.target.value }))} /></div>
              <div><label className="label">Date fin</label><input type="date" className="input" value={editForm.dateFinStage || ''} onChange={e => setEditForm((s) => ({ ...s, dateFinStage: e.target.value }))} /></div>
              <div><label className="label">Statut</label><select className="input" value={editForm.statut || ''} onChange={e => setEditForm((s) => ({ ...s, statut: e.target.value }))}>{Object.keys(STATUT_STAGE_LABELS).map(k => <option key={k} value={k}>{STATUT_STAGE_LABELS[k as keyof typeof STATUT_STAGE_LABELS]}</option>)}</select></div>
              <div className="md:col-span-2"><label className="label">Motivation</label><textarea className="input min-h-24" value={editForm.motivation || ''} onChange={e => setEditForm((s) => ({ ...s, motivation: e.target.value }))} /></div>
              <div className="md:col-span-2 flex justify-end gap-2">
                <button type="button" className="btn-secondary" onClick={() => { setIsEditOpen(false); setSelected(null); }}>Annuler</button>
                <button type="submit" className="btn-primary" disabled={submitting}>{submitting ? 'Mise à jour...' : 'Enregistrer'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

