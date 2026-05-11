// ============================================
// Actions d’inscription employé (états dynamiques)
// ============================================
import { useState } from 'react';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { mapInscriptionStatutToUi } from '../../utils/formationEnrollment';

type MonInscription = { id: number; statut: string } | null | undefined;

export type FormationEnrollActionsProps = {
  formationId: number;
  formationPubliee: boolean;
  maxParticipants?: number;
  nbInscrits: number;
  monInscription: MonInscription;
  /** Salarié / formateur interne ou externe pouvant demander une inscription au catalogue */
  allowEnrollment: boolean;
  /** Mise à jour locale après succès API */
  onMonInscriptionChange: (next: { id: number; statut: string } | null) => void;
  /** Variante compacte (carte catalogue) */
  compact?: boolean;
  /** Texte / libellé secondaire si formation complète (détail) */
  showWaitlistHint?: boolean;
};

export default function FormationEnrollActions({
  formationId,
  formationPubliee,
  maxParticipants,
  nbInscrits,
  monInscription,
  allowEnrollment,
  onMonInscriptionChange,
  compact,
  showWaitlistHint,
}: FormationEnrollActionsProps) {
  const [loading, setLoading] = useState(false);

  if (!formationPubliee || !allowEnrollment) return null;

  const placesPleines =
    maxParticipants != null && nbInscrits >= maxParticipants;

  const uiFromServer = mapInscriptionStatutToUi(monInscription?.statut);
  const showOptimisticPending =
    loading && (uiFromServer === 'none' || uiFromServer === 'rejected');
  const ui = showOptimisticPending ? 'pending' : uiFromServer;

  const btnClass = compact
    ? 'text-xs px-3 py-1.5 rounded-lg font-medium transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed'
    : 'w-full justify-center text-sm rounded-xl font-medium transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed';

  const primaryBtn = compact ? 'btn-primary ' + btnClass : 'btn-primary flex items-center gap-2 ' + btnClass;
  const secondaryWaitBtn = compact ? 'btn-secondary ' + btnClass : 'btn-secondary flex items-center gap-2 ' + btnClass;

  const spin = <span className="inline-block w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />;

  const postApply = async () => {
    setLoading(true);
    try {
      const res = await api.post(`/formations/${formationId}/inscription`, {});
      const ins = res.data.inscription;
      if (ins?.id != null && ins?.statut) {
        onMonInscriptionChange({ id: ins.id, statut: ins.statut });
      }
      toast.success(res.data.message || 'Demande enregistrée.');
    } catch (e: unknown) {
      const msg =
        typeof e === 'object' && e !== null && 'response' in e
          ? (e as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      toast.error(msg || 'Impossible d’enregistrer la demande.');
    } finally {
      setLoading(false);
    }
  };

  if (ui === 'accepted') {
    const cls = compact
      ? 'text-xs px-3 py-1.5 rounded-lg font-semibold bg-emerald-600 text-white border border-emerald-600 cursor-default opacity-95'
      : 'w-full py-2.5 text-sm rounded-xl font-semibold bg-emerald-600 text-white border border-emerald-600 cursor-default opacity-95';
    return (
      <button type="button" disabled className={cls}>
        Accepté
      </button>
    );
  }

  if (ui === 'pending') {
    const cls = `${secondaryWaitBtn} inline-flex items-center justify-center gap-2 bg-amber-50 text-amber-950 border border-amber-200 cursor-default`;
    return (
      <button type="button" disabled className={cls}>
        {loading ? spin : null}
        En attente de réponse
      </button>
    );
  }

  if (ui === 'rejected') {
    return (
      <div className={compact ? 'flex flex-col items-end gap-1.5' : 'space-y-2'}>
        <span className={`text-xs font-semibold text-red-700 ${compact ? 'text-right' : ''}`}>Refusé</span>
        <button type="button" disabled={loading} onClick={postApply} className={`${primaryBtn} inline-flex items-center justify-center gap-2`}>
          {loading ? spin : null}
          S&apos;inscrire à nouveau
        </button>
      </div>
    );
  }

  /* none */
  if (showWaitlistHint && placesPleines) {
    return (
      <div className="space-y-2">
        <p className="text-xs text-amber-600 font-medium">Formation complète — inscription en liste d&apos;attente.</p>
        <button type="button" disabled={loading} onClick={postApply} className={`${secondaryWaitBtn} inline-flex items-center justify-center gap-2`}>
          {loading ? spin : null}
          M&apos;inscrire en liste d&apos;attente
        </button>
      </div>
    );
  }

  return (
    <button type="button" disabled={loading} onClick={postApply} className={`${primaryBtn} inline-flex items-center justify-center gap-2`}>
      {loading ? spin : null}
      S&apos;inscrire
    </button>
  );
}
