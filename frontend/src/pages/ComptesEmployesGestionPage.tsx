// ============================================
// Gestion des comptes employés (même UX que Candidatures & Stages)
// mode RH : tous départements ; mode Manager : département du manager uniquement
// ============================================

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Search,
  Plus,
  Pencil,
  Archive,
  ShieldOff,
  CheckCircle,
  RotateCcw,
  Users,
} from 'lucide-react';
import api from '../lib/api';
import { useAuthStore } from '../stores/authStore';
import type { Departement, Role } from '../types';
import { ROLE_LABELS } from '../types';
import toast from 'react-hot-toast';

type Mode = 'rh' | 'manager';

type EmployeRow = {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  role: Role;
  poste?: string;
  telephone?: string;
  isActif: boolean;
  isArchived?: boolean;
  departementId?: number;
  departement?: Departement | null;
};

const ROLES_CREATE: { value: Role; label: string }[] = [
  { value: 'Manager', label: 'Manager' },
  { value: 'Employe', label: 'Employé' },
  { value: 'Formateur_Interne', label: 'Formateur interne' },
  { value: 'Formateur_Externe', label: 'Formateur externe' },
];

const ROLE_BADGE: Record<string, string> = {
  Direction_RH: 'badge-info',
  Manager: 'badge-info',
  Employe: 'badge-gray',
  Formateur_Interne: 'badge-warning',
  Formateur_Externe: 'badge-warning',
};

export default function ComptesEmployesGestionPage({ mode }: { mode: Mode }) {
  const { user } = useAuthStore();
  const [rows, setRows] = useState<EmployeRow[]>([]);
  const [departements, setDepartements] = useState<Departement[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [etatFilter, setEtatFilter] = useState(''); // '' | actif | bloque | archive

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selected, setSelected] = useState<EmployeRow | null>(null);

  const [createForm, setCreateForm] = useState({
    nom: '',
    prenom: '',
    email: '',
    password: '',
    role: 'Employe' as Role,
    departementId: '' as string | number,
    poste: '',
    telephone: '',
  });
  const [editForm, setEditForm] = useState<Record<string, unknown>>({});

  const fetchRows = useCallback(() => {
    setLoading(true);
    const p = new URLSearchParams();
    p.set('scope', 'gestion');
    p.set('includeArchived', '1');
    if (search.trim()) p.set('search', search.trim());
    if (roleFilter) p.set('role', roleFilter);
    if (etatFilter === 'actif') {
      p.set('isActif', 'true');
      p.set('isArchived', 'false');
    } else if (etatFilter === 'bloque') {
      p.set('isActif', 'false');
      p.set('isArchived', 'false');
    } else if (etatFilter === 'archive') {
      p.set('isArchived', 'true');
    }
    api
      .get(`/employes?${p}`)
      .then((r) => setRows(r.data.data || []))
      .catch(() => {
        toast.error('Impossible de charger les comptes');
        setRows([]);
      })
      .finally(() => setLoading(false));
  }, [search, roleFilter, etatFilter]);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  useEffect(() => {
    if (mode !== 'rh') return;
    api
      .get('/departements')
      .then((r) => setDepartements(r.data.data || []))
      .catch(() => setDepartements([]));
  }, [mode]);

  const counts = useMemo(() => {
    const total = rows.length;
    const actifs = rows.filter((e) => e.isActif && !e.isArchived).length;
    const bloques = rows.filter((e) => !e.isActif && !e.isArchived).length;
    const archives = rows.filter((e) => e.isArchived).length;
    return { total, actifs, bloques, archives };
  }, [rows]);

  const resetCreate = () => {
    setCreateForm({
      nom: '',
      prenom: '',
      email: '',
      password: '',
      role: 'Employe',
      departementId: '',
      poste: '',
      telephone: '',
    });
  };

  const openEdit = (e: EmployeRow) => {
    setSelected(e);
    setEditForm({
      nom: e.nom,
      prenom: e.prenom,
      email: e.email,
      poste: e.poste || '',
      telephone: e.telephone || '',
      departementId: e.departementId != null ? String(e.departementId) : '',
      password: '',
    });
    setIsEditOpen(true);
  };

  const submitCreateFixed = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (mode === 'rh' && !createForm.departementId) {
      toast.error('Le département est obligatoire.');
      return;
    }
    setSubmitting(true);
    try {
      const path = mode === 'rh' ? '/employes/rh' : '/employes/manager';
      const body: Record<string, unknown> = {
        nom: createForm.nom.trim(),
        prenom: createForm.prenom.trim(),
        email: createForm.email.trim().toLowerCase(),
        password: createForm.password,
        role: createForm.role,
        poste: createForm.poste.trim() || undefined,
        telephone: createForm.telephone.trim() || undefined,
      };
      if (mode === 'rh') body.departementId = Number(createForm.departementId);
      await api.post(path, body);
      toast.success('Compte créé.');
      setIsCreateOpen(false);
      resetCreate();
      fetchRows();
    } catch (err: unknown) {
      const msg =
        typeof err === 'object' && err !== null && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      toast.error(msg || 'Création impossible');
    } finally {
      setSubmitting(false);
    }
  };

  const submitEdit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!selected) return;
    setSubmitting(true);
    try {
      const path = mode === 'rh' ? `/employes/rh/${selected.id}` : `/employes/manager/${selected.id}`;
      const payload: Record<string, unknown> = {
        nom: editForm.nom,
        prenom: editForm.prenom,
        email: editForm.email,
        poste: (editForm.poste as string) || undefined,
        telephone: (editForm.telephone as string) || undefined,
      };
      if (mode === 'rh' && editForm.departementId) {
        payload.departementId = Number(editForm.departementId);
      }
      if (editForm.password && String(editForm.password).length >= 6) {
        payload.password = editForm.password;
      }
      await api.put(path, payload);
      toast.success('Compte mis à jour.');
      setIsEditOpen(false);
      setSelected(null);
      fetchRows();
    } catch (err: unknown) {
      const msg =
        typeof err === 'object' && err !== null && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      toast.error(msg || 'Modification impossible');
    } finally {
      setSubmitting(false);
    }
  };

  const patchActif = async (id: number, isActif: boolean) => {
    const path =
      mode === 'rh' ? `/employes/rh/${id}/actif` : `/employes/manager/${id}/actif`;
    try {
      await api.patch(path, { isActif });
      toast.success(isActif ? 'Compte réactivé.' : 'Compte bloqué.');
      fetchRows();
    } catch (err: unknown) {
      const msg =
        typeof err === 'object' && err !== null && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      toast.error(msg || 'Action impossible');
    }
  };

  const patchArchive = async (id: number, isArchived: boolean) => {
    const path =
      mode === 'rh' ? `/employes/rh/${id}/archive` : `/employes/manager/${id}/archive`;
    try {
      await api.patch(path, { isArchived });
      toast.success(isArchived ? 'Compte archivé.' : 'Compte désarchivé.');
      fetchRows();
    } catch (err: unknown) {
      const msg =
        typeof err === 'object' && err !== null && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      toast.error(msg || 'Action impossible');
    }
  };

  const title = mode === 'rh' ? 'Comptes employés & rôles (RH)' : 'Mon équipe & comptes';
  const sousTitre =
    mode === 'manager'
      ? `Département : ${user?.departement?.nom || (user?.departementId != null ? `#${user.departementId}` : '—')}`
      : 'Gestion des comptes employés.';

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="page-header">
        <div>
          <h1 className="page-title">{title}</h1>
          <p className="page-subtitle text-slate-600">{sousTitre}</p>
        </div>
        <button type="button" onClick={() => setIsCreateOpen(true)} className="btn-primary text-sm">
          <Plus size={14} /> Nouveau compte
        </button>
      </div>

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
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="input w-auto min-w-44"
        >
          <option value="">Tous les rôles</option>
          {ROLES_CREATE.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
          {mode === 'rh' && <option value="Direction_RH">Direction RH</option>}
        </select>
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

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-cni-blue border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Collaborateur</th>
                <th>Département</th>
                <th>Rôle</th>
                <th>État</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((e) => (
                <tr key={e.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cni-blue to-cni-orange flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {e.prenom?.[0]}
                        {e.nom?.[0]}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {e.prenom} {e.nom}
                        </p>
                        <p className="text-xs text-gray-400">{e.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="text-gray-600">{e.departement?.nom || '—'}</td>
                  <td>
                    <span className={ROLE_BADGE[e.role] || 'badge-gray'}>{ROLE_LABELS[e.role] || e.role}</span>
                  </td>
                  <td>
                    {e.isArchived ? (
                      <span className="badge-warning">Archivé</span>
                    ) : e.isActif ? (
                      <span className="badge-success">Actif</span>
                    ) : (
                      <span className="badge-danger">Bloqué</span>
                    )}
                  </td>
                  <td>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openEdit(e)}
                        className="p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-600 transition-colors"
                        title="Modifier"
                      >
                        <Pencil size={15} />
                      </button>
                      {!e.isArchived && e.isActif && (
                        <button
                          type="button"
                          onClick={() => patchActif(e.id, false)}
                          className="p-1.5 rounded-lg hover:bg-orange-50 text-orange-600 transition-colors"
                          title="Bloquer"
                        >
                          <ShieldOff size={15} />
                        </button>
                      )}
                      {!e.isArchived && !e.isActif && (
                        <button
                          type="button"
                          onClick={() => patchActif(e.id, true)}
                          className="p-1.5 rounded-lg hover:bg-green-50 text-green-600 transition-colors"
                          title="Réactiver"
                        >
                          <CheckCircle size={15} />
                        </button>
                      )}
                      {!e.isArchived ? (
                        <button
                          type="button"
                          onClick={() => patchArchive(e.id, true)}
                          className="p-1.5 rounded-lg hover:bg-amber-50 text-amber-600 transition-colors"
                          title="Archiver"
                        >
                          <Archive size={15} />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => patchArchive(e.id, false)}
                          className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors"
                          title="Désarchiver"
                        >
                          <RotateCcw size={15} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-gray-400">
                    <Users className="mx-auto mb-2 opacity-40" size={32} />
                    <p className="text-sm">Aucun résultat</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {isCreateOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Nouveau compte</h2>
              <p className="text-sm text-gray-500">Création rapide (même flux que les candidatures)</p>
            </div>
            <form onSubmit={submitCreateFixed} className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Nom</label>
                <input
                  className="input"
                  required
                  value={createForm.nom}
                  onChange={(ev) => setCreateForm((s) => ({ ...s, nom: ev.target.value }))}
                />
              </div>
              <div>
                <label className="label">Prénom</label>
                <input
                  className="input"
                  required
                  value={createForm.prenom}
                  onChange={(ev) => setCreateForm((s) => ({ ...s, prenom: ev.target.value }))}
                />
              </div>
              <div className="md:col-span-2">
                <label className="label">E-mail</label>
                <input
                  type="email"
                  className="input"
                  required
                  value={createForm.email}
                  onChange={(ev) => setCreateForm((s) => ({ ...s, email: ev.target.value }))}
                />
              </div>
              <div className="md:col-span-2">
                <label className="label">Mot de passe initial</label>
                <input
                  type="password"
                  className="input"
                  required
                  minLength={6}
                  value={createForm.password}
                  onChange={(ev) => setCreateForm((s) => ({ ...s, password: ev.target.value }))}
                />
              </div>
              {mode === 'rh' && (
                <div className="md:col-span-2">
                  <label className="label">Département</label>
                  <select
                    className="input"
                    required
                    value={createForm.departementId === '' ? '' : String(createForm.departementId)}
                    onChange={(ev) =>
                      setCreateForm((s) => ({ ...s, departementId: ev.target.value ? Number(ev.target.value) : '' }))
                    }
                  >
                    <option value="">Sélectionner</option>
                    {departements.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.nom} ({d.code})
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className="md:col-span-2">
                <label className="label">Rôle</label>
                <select
                  className="input"
                  value={createForm.role}
                  onChange={(ev) => setCreateForm((s) => ({ ...s, role: ev.target.value as Role }))}
                >
                  {ROLES_CREATE.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Poste</label>
                <input
                  className="input"
                  value={createForm.poste}
                  onChange={(ev) => setCreateForm((s) => ({ ...s, poste: ev.target.value }))}
                />
              </div>
              <div>
                <label className="label">Téléphone</label>
                <input
                  className="input"
                  value={createForm.telephone}
                  onChange={(ev) => setCreateForm((s) => ({ ...s, telephone: ev.target.value }))}
                />
              </div>
              <div className="md:col-span-2 flex justify-end gap-2">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setIsCreateOpen(false);
                    resetCreate();
                  }}
                >
                  Annuler
                </button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? 'Création…' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isEditOpen && selected && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Modifier le compte</h2>
              <p className="text-sm text-gray-500">
                {selected.prenom} {selected.nom}
              </p>
            </div>
            <form onSubmit={submitEdit} className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Nom</label>
                <input
                  className="input"
                  value={String(editForm.nom || '')}
                  onChange={(ev) => setEditForm((s) => ({ ...s, nom: ev.target.value }))}
                />
              </div>
              <div>
                <label className="label">Prénom</label>
                <input
                  className="input"
                  value={String(editForm.prenom || '')}
                  onChange={(ev) => setEditForm((s) => ({ ...s, prenom: ev.target.value }))}
                />
              </div>
              <div className="md:col-span-2">
                <label className="label">E-mail</label>
                <input
                  type="email"
                  className="input"
                  value={String(editForm.email || '')}
                  onChange={(ev) => setEditForm((s) => ({ ...s, email: ev.target.value }))}
                />
              </div>
              <div className="md:col-span-2">
                <label className="label">Nouveau mot de passe (optionnel)</label>
                <input
                  type="password"
                  className="input"
                  minLength={6}
                  placeholder="Laisser vide pour ne pas changer"
                  value={String(editForm.password || '')}
                  onChange={(ev) => setEditForm((s) => ({ ...s, password: ev.target.value }))}
                />
              </div>
              {mode === 'rh' && (
                <div className="md:col-span-2">
                  <label className="label">Département</label>
                  <select
                    className="input"
                    value={String(editForm.departementId || '')}
                    onChange={(ev) => setEditForm((s) => ({ ...s, departementId: ev.target.value }))}
                  >
                    <option value="">—</option>
                    {departements.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.nom}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="label">Poste</label>
                <input
                  className="input"
                  value={String(editForm.poste || '')}
                  onChange={(ev) => setEditForm((s) => ({ ...s, poste: ev.target.value }))}
                />
              </div>
              <div>
                <label className="label">Téléphone</label>
                <input
                  className="input"
                  value={String(editForm.telephone || '')}
                  onChange={(ev) => setEditForm((s) => ({ ...s, telephone: ev.target.value }))}
                />
              </div>
              <div className="md:col-span-2 flex justify-end gap-2">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setIsEditOpen(false);
                    setSelected(null);
                  }}
                >
                  Annuler
                </button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? 'Enregistrement…' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
