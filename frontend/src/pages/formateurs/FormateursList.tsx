// ============================================
// Formateurs internes — même UX que Candidatures & Stages (mode gestion RH/Manager)
// ============================================

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Plus,
  Pencil,
  Archive,
  ShieldOff,
  CheckCircle,
  RotateCcw,
  Eye,
  GraduationCap,
} from 'lucide-react';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../stores/authStore';
import type { Departement } from '../../types';

type DepartementOption = { id: number; nom: string };

function parseJsonStringArray(raw: unknown): string[] {
  if (raw == null || raw === '') return [];
  if (Array.isArray(raw)) return raw.map(String).filter(Boolean);
  if (typeof raw === 'string') {
    try {
      const v = JSON.parse(raw);
      return Array.isArray(v) ? v.map(String).filter(Boolean) : [];
    } catch {
      return [];
    }
  }
  return [];
}

function competencesTextToArray(text: string): string[] {
  return text
    .split(/[,;\n]/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 2);
}

const emptyForm = {
  nom: '',
  prenom: '',
  email: '',
  motDePasse: '',
  telephone: '',
  poste: '',
  departementId: '' as string | number,
  competencesText: '',
  disponibiliteHeures: '8',
  isActif: true,
};

type FormateurRow = {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  poste?: string;
  departement?: Departement | null;
  domainesCompetences?: string;
  totalHeuresFormation?: number;
  noteFormateur?: number | null;
  disponibiliteHeures?: number;
  isActif?: boolean;
  isArchived?: boolean;
};

export default function FormateursList() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const canManage = user?.role === 'Direction_RH' || user?.role === 'Manager';

  const [formateurs, setFormateurs] = useState<FormateurRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [departements, setDepartements] = useState<DepartementOption[]>([]);
  const [search, setSearch] = useState('');
  const [etatFilter, setEtatFilter] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const loadFormateurs = useCallback(() => {
    setLoading(true);
    const p = new URLSearchParams();
    if (canManage) {
      p.set('listMode', 'gestion');
      p.set('includeArchived', '1');
      if (search.trim()) p.set('search', search.trim());
      if (etatFilter === 'actif') {
        p.set('isActif', 'true');
        p.set('isArchived', 'false');
      } else if (etatFilter === 'bloque') {
        p.set('isActif', 'false');
        p.set('isArchived', 'false');
      } else if (etatFilter === 'archive') {
        p.set('isArchived', 'true');
      }
    }
    const url = canManage ? `/formateurs?${p}` : '/formateurs';
    api
      .get(url)
      .then((r) => setFormateurs(r.data.data || []))
      .catch(() => setFormateurs([]))
      .finally(() => setLoading(false));
  }, [canManage, search, etatFilter]);

  useEffect(() => {
    loadFormateurs();
  }, [loadFormateurs]);

  useEffect(() => {
    if (!canManage) return;
    api
      .get('/departements')
      .then((r) => setDepartements(r.data.data || []))
      .catch(() => setDepartements([]));
  }, [canManage]);

  const counts = useMemo(() => {
    const total = formateurs.length;
    const actifs = formateurs.filter((f) => f.isActif !== false && !f.isArchived).length;
    const bloques = formateurs.filter((f) => f.isActif === false && !f.isArchived).length;
    const archives = formateurs.filter((f) => f.isArchived).length;
    return { total, actifs, bloques, archives };
  }, [formateurs]);

  const openCreate = () => {
    setEditId(null);
    setForm({ ...emptyForm });
    setModalOpen(true);
  };

  const openEdit = async (id: number) => {
    setEditId(id);
    setModalOpen(true);
    setLoadingDetail(true);
    setForm({ ...emptyForm });
    try {
      const r = await api.get(`/formateurs/${id}`);
      const d = r.data.data;
      if (!d) {
        toast.error('Formateur introuvable');
        setModalOpen(false);
        return;
      }
      const comps = parseJsonStringArray(d.domainesCompetences);
      setForm({
        nom: d.nom ?? '',
        prenom: d.prenom ?? '',
        email: d.email ?? '',
        motDePasse: '',
        telephone: d.telephone ?? '',
        poste: d.poste ?? '',
        departementId: d.departementId != null ? String(d.departementId) : '',
        competencesText: comps.join(', '),
        disponibiliteHeures: d.disponibiliteHeures != null ? String(d.disponibiliteHeures) : '8',
        isActif: d.isActif !== false,
      });
    } catch {
      toast.error('Impossible de charger le formateur');
      setModalOpen(false);
    } finally {
      setLoadingDetail(false);
    }
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditId(null);
    setForm({ ...emptyForm });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const domainesCompetences = competencesTextToArray(form.competencesText);
    if (domainesCompetences.length === 0) {
      toast.error('Indiquez au moins une compétence (séparées par des virgules).');
      return;
    }
    const disponibiliteHeures = parseInt(String(form.disponibiliteHeures), 10);
    if (!disponibiliteHeures || disponibiliteHeures < 1) {
      toast.error('Disponibilité (heures / mois) invalide.');
      return;
    }

    setSaving(true);
    try {
      if (editId == null) {
        if (!form.motDePasse || form.motDePasse.length < 6) {
          toast.error('Mot de passe requis (min. 6 caractères) pour un nouveau compte.');
          setSaving(false);
          return;
        }
        await api.post('/formateurs', {
          nom: form.nom.trim(),
          prenom: form.prenom.trim(),
          email: form.email.trim(),
          motDePasse: form.motDePasse,
          telephone: form.telephone.trim() || undefined,
          poste: form.poste.trim() || undefined,
          departementId: form.departementId ? Number(form.departementId) : undefined,
          domainesCompetences,
          disponibiliteHeures,
        });
        toast.success('Compte formateur interne créé.');
      } else {
        const payload: Record<string, unknown> = {
          nom: form.nom.trim(),
          prenom: form.prenom.trim(),
          email: form.email.trim(),
          telephone: form.telephone.trim() || undefined,
          poste: form.poste.trim() || undefined,
          departementId: form.departementId ? Number(form.departementId) : null,
          domainesCompetences,
          disponibiliteHeures,
          isActif: form.isActif,
        };
        if (form.motDePasse.trim().length >= 6) {
          payload.motDePasse = form.motDePasse;
        }
        await api.put(`/formateurs/${editId}`, payload);
        toast.success('Formateur mis à jour.');
      }
      closeModal();
      loadFormateurs();
    } catch (err: unknown) {
      const msg =
        typeof err === 'object' && err !== null && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      toast.error(msg || 'Erreur lors de l’enregistrement');
    } finally {
      setSaving(false);
    }
  };

  const patchFormateur = async (id: number, payload: Record<string, unknown>, okMsg: string) => {
    try {
      await api.put(`/formateurs/${id}`, payload);
      toast.success(okMsg);
      loadFormateurs();
    } catch (err: unknown) {
      const msg =
        typeof err === 'object' && err !== null && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      toast.error(msg || 'Action impossible');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="page-header">
        <div>
          <h1 className="page-title">Formateurs internes</h1>
          <p className="page-subtitle text-slate-600">Répertoire et suivi des formateurs.</p>
        </div>
        {canManage && (
          <button type="button" onClick={openCreate} className="btn-primary text-sm">
            <Plus size={14} /> Nouveau formateur
          </button>
        )}
      </div>

      {canManage && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total', value: counts.total, color: 'bg-gray-50 border-gray-200', text: 'text-gray-700' },
            { label: 'Actifs', value: counts.actifs, color: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700' },
            { label: 'Bloqués', value: counts.bloques, color: 'bg-orange-50 border-orange-200', text: 'text-orange-700' },
            { label: 'Archivés', value: counts.archives, color: 'bg-amber-50 border-amber-200', text: 'text-amber-700' },
          ].map((c) => (
            <div key={c.label} className={`${c.color} border rounded-xl p-4 text-center`}>
              <div className={`text-2xl font-black ${c.text}`}>{c.value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{c.label}</div>
            </div>
          ))}
        </div>
      )}

      {canManage && (
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-48">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par nom, e-mail…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-9"
            />
          </div>
          <select
            value={etatFilter}
            onChange={(e) => setEtatFilter(e.target.value)}
            className="input w-auto min-w-40"
          >
            <option value="">Tous les états</option>
            <option value="actif">Actifs uniquement</option>
            <option value="bloque">Bloqués</option>
            <option value="archive">Archivés</option>
          </select>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-cni-blue border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Formateur</th>
                <th>Département</th>
                <th>Compétences</th>
                <th>Heures</th>
                <th>Note</th>
                <th>État</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {formateurs.map((f) => {
                const competences = parseJsonStringArray(f.domainesCompetences);
                return (
                  <tr key={f.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cni-orange to-orange-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {f.prenom?.[0]}
                          {f.nom?.[0]}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {f.prenom} {f.nom}
                          </p>
                          <p className="text-xs text-gray-400">{f.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="text-gray-600">{f.departement?.nom || '—'}</td>
                    <td className="text-xs text-gray-600 max-w-[200px]">
                      {competences.slice(0, 4).join(', ')}
                      {competences.length > 4 ? '…' : ''}
                    </td>
                    <td className="text-sm text-gray-700">{f.totalHeuresFormation ?? 0} h</td>
                    <td className="text-sm">{f.noteFormateur ?? '—'}</td>
                    <td>
                      {f.isArchived ? (
                        <span className="badge-warning">Archivé</span>
                      ) : f.isActif === false ? (
                        <span className="badge-danger">Bloqué</span>
                      ) : (
                        <span className="badge-success">Actif</span>
                      )}
                    </td>
                    <td>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => navigate('/app/formateurs/profil')}
                          className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors"
                          title="Profil"
                        >
                          <Eye size={15} />
                        </button>
                        {canManage && (
                          <>
                            <button
                              type="button"
                              onClick={() => openEdit(f.id)}
                              className="p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-600 transition-colors"
                              title="Modifier"
                            >
                              <Pencil size={15} />
                            </button>
                            {!f.isArchived && f.isActif !== false && (
                              <button
                                type="button"
                                onClick={() => patchFormateur(f.id, { isActif: false }, 'Formateur bloqué.')}
                                className="p-1.5 rounded-lg hover:bg-orange-50 text-orange-600 transition-colors"
                                title="Bloquer"
                              >
                                <ShieldOff size={15} />
                              </button>
                            )}
                            {!f.isArchived && f.isActif === false && (
                              <button
                                type="button"
                                onClick={() => patchFormateur(f.id, { isActif: true }, 'Formateur réactivé.')}
                                className="p-1.5 rounded-lg hover:bg-green-50 text-green-600 transition-colors"
                                title="Réactiver"
                              >
                                <CheckCircle size={15} />
                              </button>
                            )}
                            {!f.isArchived ? (
                              <button
                                type="button"
                                onClick={() => patchFormateur(f.id, { isArchived: true }, 'Formateur archivé.')}
                                className="p-1.5 rounded-lg hover:bg-amber-50 text-amber-600 transition-colors"
                                title="Archiver"
                              >
                                <Archive size={15} />
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() =>
                                  patchFormateur(f.id, { isArchived: false, isActif: true }, 'Formateur désarchivé.')
                                }
                                className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors"
                                title="Désarchiver"
                              >
                                <RotateCcw size={15} />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {formateurs.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-400">
                    <GraduationCap className="mx-auto mb-2 opacity-40" size={32} />
                    <p className="text-sm">Aucun formateur interne</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && canManage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">
                {editId == null ? 'Nouveau formateur interne' : 'Modifier le formateur'}
              </h2>
              <p className="text-sm text-gray-500">Même principe que la création candidature / stage</p>
            </div>
            {loadingDetail ? (
              <div className="p-8 flex justify-center">
                <div className="w-8 h-8 border-2 border-cni-blue border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-5 space-y-4">
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="label">Nom *</label>
                    <input
                      className="input"
                      value={form.nom}
                      onChange={(e) => setForm((s) => ({ ...s, nom: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <label className="label">Prénom *</label>
                    <input
                      className="input"
                      value={form.prenom}
                      onChange={(e) => setForm((s) => ({ ...s, prenom: e.target.value }))}
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="label">Email *</label>
                  <input
                    type="email"
                    className="input"
                    autoComplete="email"
                    value={form.email}
                    onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <label className="label">
                    {editId == null ? 'Mot de passe *' : 'Nouveau mot de passe (optionnel)'}
                  </label>
                  <input
                    type="password"
                    className="input"
                    value={form.motDePasse}
                    onChange={(e) => setForm((s) => ({ ...s, motDePasse: e.target.value }))}
                    placeholder={editId == null ? 'Minimum 6 caractères' : 'Laisser vide pour ne pas changer'}
                  />
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="label">Téléphone</label>
                    <input
                      className="input"
                      value={form.telephone}
                      onChange={(e) => setForm((s) => ({ ...s, telephone: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="label">Poste</label>
                    <input
                      className="input"
                      value={form.poste}
                      onChange={(e) => setForm((s) => ({ ...s, poste: e.target.value }))}
                    />
                  </div>
                </div>
                <div>
                  <label className="label">Département</label>
                  <select
                    className="input"
                    value={form.departementId === '' ? '' : String(form.departementId)}
                    onChange={(e) => setForm((s) => ({ ...s, departementId: e.target.value }))}
                  >
                    <option value="">—</option>
                    {departements.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.nom}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Compétences * (virgules)</label>
                  <textarea
                    className="input resize-none"
                    rows={2}
                    value={form.competencesText}
                    onChange={(e) => setForm((s) => ({ ...s, competencesText: e.target.value }))}
                    placeholder="React, Node.js, Cybersécurité"
                    required
                  />
                </div>
                <div>
                  <label className="label">Disponibilité (h / mois) *</label>
                  <input
                    type="number"
                    min={1}
                    max={200}
                    className="input"
                    value={form.disponibiliteHeures}
                    onChange={(e) => setForm((s) => ({ ...s, disponibiliteHeures: e.target.value }))}
                    required
                  />
                </div>
                {editId != null && (
                  <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.isActif}
                      onChange={(e) => setForm((s) => ({ ...s, isActif: e.target.checked }))}
                    />
                    Compte actif
                  </label>
                )}
                <div className="flex gap-2 pt-2 border-t border-gray-100">
                  <button type="button" onClick={closeModal} className="btn-secondary flex-1 justify-center">
                    Annuler
                  </button>
                  <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">
                    {saving ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : editId == null ? (
                      'Créer le compte'
                    ) : (
                      'Enregistrer'
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
