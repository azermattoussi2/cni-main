// ============================================
// Validations inscriptions — même présentation que Candidatures & Stages
// ============================================
import { useMemo, useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock } from 'lucide-react';
import api from '../../lib/api';
import { useAuthStore } from '../../stores/authStore';
import toast from 'react-hot-toast';
import LoadingState from '../../components/common/LoadingState';
import EmptyState from '../../components/common/EmptyState';
import { PageStatGrid } from '../../components/common/PageStatGrid';

function labelStatut(statut: string): string {
  const m: Record<string, string> = {
    En_attente_manager: 'En attente manager',
    En_attente_RH: 'En attente RH',
    Validee: 'Validée',
    Refusee: 'Refusée',
    Liste_attente: 'Liste d’attente',
    Annulee: 'Annulée',
    Terminee: 'Terminée',
  };
  return m[statut] ?? statut;
}

function badgeClassStatut(statut: string): string {
  if (statut === 'En_attente_manager' || statut === 'En_attente_RH') return 'badge-warning text-xs';
  if (statut === 'Validee' || statut === 'Liste_attente') return 'badge-success text-xs';
  if (statut === 'Refusee' || statut === 'Annulee') return 'badge-danger text-xs';
  return 'badge-info text-xs';
}

function messageSansAction(statut: string, isRH: boolean): string {
  if (isRH) {
    if (statut === 'En_attente_manager') {
      return 'En attente du manager du département.';
    }
    if (statut === 'Validee') return 'Inscription validée.';
    if (statut === 'Liste_attente') return 'Liste d’attente.';
    if (statut === 'Refusee' || statut === 'Annulee') return 'Demande clôturée.';
    if (statut === 'Terminee') return 'Formation terminée.';
    return 'Aucune action RH.';
  }
  if (statut === 'En_attente_RH') return 'Transmis à la RH.';
  if (statut === 'Validee' || statut === 'Liste_attente' || statut === 'Refusee' || statut === 'Annulee' || statut === 'Terminee') {
    return 'Déjà traitée.';
  }
  return 'Aucune action manager.';
}

export default function InscriptionsValidation() {
  const { user } = useAuthStore();
  const [inscriptions, setInscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentaires, setCommentaires] = useState<Record<number, string>>({});
  const [filtreStatutRH, setFiltreStatutRH] = useState<string>('');

  const fetchList = () => {
    setLoading(true);
    api
      .get('/formations/inscriptions/en-attente')
      .then((r) => {
        const rows = r.data.data ?? [];
        setInscriptions(
          rows.map((row: Record<string, unknown>) => ({
            id: row.id,
            statut: row.statut,
            dateDemandeEmploye: row.dateDemandeEmploye,
            employe: row.employe,
            formation: row.formation,
          }))
        );
      })
      .catch(() => {
        setInscriptions([]);
        toast.error('Impossible de charger les demandes.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchList();
  }, []);

  const valider = async (id: number, action: 'valider' | 'refuser', useEndpointRH: boolean) => {
    try {
      const endpoint = useEndpointRH ? `/formations/inscriptions/${id}/valider-rh` : `/formations/inscriptions/${id}/valider-manager`;
      const commentaire = commentaires[id]?.trim();
      await api.post(endpoint, {
        action,
        ...(commentaire ? { commentaire } : {}),
      });
      toast.success(action === 'valider' ? 'Validé !' : 'Refusé');
      setCommentaires((c) => {
        const next = { ...c };
        delete next[id];
        return next;
      });
      fetchList();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Erreur');
    }
  };

  const isRH = user?.role === 'Direction_RH';

  const listeAffichee = isRH
    ? filtreStatutRH
      ? inscriptions.filter((i) => i.statut === filtreStatutRH)
      : inscriptions
    : inscriptions;

  const enAttenteManager = inscriptions.filter((i) => i.statut === 'En_attente_manager').length;
  const enAttenteRH = inscriptions.filter((i) => i.statut === 'En_attente_RH').length;
  const validees = inscriptions.filter((i) => i.statut === 'Validee' || i.statut === 'Liste_attente').length;

  const stats = useMemo(
    () => [
      { label: 'Total', value: inscriptions.length, color: 'bg-gray-50 border-gray-200', text: 'text-gray-700' },
      { label: 'Att. manager', value: enAttenteManager, color: 'bg-amber-50 border-amber-200', text: 'text-amber-700' },
      { label: 'Att. RH', value: enAttenteRH, color: 'bg-orange-50 border-orange-200', text: 'text-orange-700' },
      { label: 'Validées / liste', value: validees, color: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700' },
    ],
    [inscriptions.length, enAttenteManager, enAttenteRH, validees]
  );

  const titrePage = isRH ? 'Validations des inscriptions' : 'Validation des inscriptions (équipe)';

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="page-header flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="page-title">{titrePage}</h1>
          <p className="page-subtitle text-slate-600">
            {isRH ? 'Traitement des demandes côté RH.' : 'Demandes du département à valider ou transmettre.'}
          </p>
        </div>
        {isRH && (
          <div className="flex items-center gap-2">
            <label htmlFor="filtre-statut-rh" className="text-sm text-gray-600 whitespace-nowrap">
              Statut
            </label>
            <select
              id="filtre-statut-rh"
              value={filtreStatutRH}
              onChange={(e) => setFiltreStatutRH(e.target.value)}
              className="input text-sm min-w-[200px]"
            >
              <option value="">Tous les statuts</option>
              <option value="En_attente_manager">En attente manager</option>
              <option value="En_attente_RH">En attente RH</option>
              <option value="Validee">Validée</option>
              <option value="Liste_attente">Liste d’attente</option>
              <option value="Refusee">Refusée</option>
              <option value="Terminee">Terminée</option>
              <option value="Annulee">Annulée</option>
            </select>
          </div>
        )}
      </div>

      <PageStatGrid items={stats} />

      <p className="text-xs text-gray-500">
        <strong>Manager</strong> : actions sur les lignes « en attente manager ». <strong>RH</strong> : actions sur « en
        attente RH » uniquement.
      </p>

      {loading ? (
        <LoadingState message="Chargement des validations..." />
      ) : inscriptions.length === 0 ? (
        <EmptyState title="Aucune inscription" subtitle="Aucune demande enregistrée pour le moment." icon={<CheckCircle size={40} />} />
      ) : listeAffichee.length === 0 ? (
        <EmptyState title="Aucun résultat" subtitle="Aucune ligne pour ce filtre de statut." icon={<Clock size={40} />} />
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Statut</th>
                <th>Collaborateur</th>
                <th>Département</th>
                <th>Formation</th>
                <th>Demandé le</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {listeAffichee.map((insc) => {
                const dept = insc.employe?.departement;
                const deptLabel = dept?.nom ?? dept?.code ?? '—';
                const canActRH = isRH && insc.statut === 'En_attente_RH';
                const canActManager = !isRH && insc.statut === 'En_attente_manager';
                const showActions = canActRH || canActManager;

                return (
                  <tr key={insc.id}>
                    <td>
                      <span className={badgeClassStatut(insc.statut)}>{labelStatut(insc.statut)}</span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cni-blue to-cni-orange flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {(insc.employe?.prenom?.[0] ?? '?')}
                          {(insc.employe?.nom?.[0] ?? '?')}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 text-sm">
                            {insc.employe?.prenom} {insc.employe?.nom}
                          </p>
                          <p className="text-xs text-gray-400">{insc.employe?.poste ?? '—'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="text-sm text-gray-600">{deptLabel}</td>
                    <td>
                      <p className="font-semibold text-cni-blue text-sm">{insc.formation?.titre ?? '—'}</p>
                      <div className="flex flex-wrap gap-1 mt-0.5">
                        <span className="badge-info text-[10px]">{insc.formation?.domaine ?? ''}</span>
                        {insc.formation?.cout ? (
                          <span className="text-[10px] text-cni-orange font-medium">{insc.formation.cout} TND</span>
                        ) : (
                          <span className="badge-success text-[10px]">Gratuit</span>
                        )}
                      </div>
                    </td>
                    <td className="text-xs text-gray-500">
                      {insc.dateDemandeEmploye ? new Date(insc.dateDemandeEmploye).toLocaleDateString('fr-FR') : '—'}
                    </td>
                    <td>
                      {showActions ? (
                        <div className="flex flex-col gap-2 min-w-[200px]">
                          <input
                            type="text"
                            placeholder="Commentaire (optionnel)"
                            value={commentaires[insc.id] || ''}
                            onChange={(e) => setCommentaires((c) => ({ ...c, [insc.id]: e.target.value }))}
                            className="input text-xs"
                          />
                          <div className="flex gap-1">
                            <button
                              type="button"
                              onClick={() => valider(insc.id, 'valider', canActRH)}
                              className="btn-success text-xs flex-1 justify-center py-1.5"
                            >
                              <CheckCircle size={13} /> Valider
                            </button>
                            <button
                              type="button"
                              onClick={() => valider(insc.id, 'refuser', canActRH)}
                              className="btn-danger text-xs flex-1 justify-center py-1.5"
                            >
                              <XCircle size={13} /> Refuser
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-gray-600 leading-snug max-w-[220px]">{messageSansAction(insc.statut, isRH)}</p>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
