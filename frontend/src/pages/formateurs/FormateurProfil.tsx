// ============================================
// Fichier : pages/formateurs/FormateurProfil.tsx
// ============================================
import { useState, useEffect } from 'react';
import { Award, X, BookOpen, Star } from 'lucide-react';
import api from '../../lib/api';
import { useAuthStore } from '../../stores/authStore';
import toast from 'react-hot-toast';
import LoadingState from '../../components/common/LoadingState';
import type { User } from '../../types';
import { EMPLOYE_EQUIVALENT_ROLES, hasRole } from '../../utils/roleGroups';

const DOMAINES_DISPO = ['JavaScript','React','Node.js','Python','Java','Cybersécurité','Linux','Management','Communication','Finance','DevOps','Docker','SQL','Anglais','Agile/Scrum'];

function parseJsonArray(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw as string[];
  if (typeof raw === 'string') {
    try {
      const p = JSON.parse(raw);
      return Array.isArray(p) ? p : [];
    } catch {
      return [];
    }
  }
  return [];
}

export default function FormateurProfil() {
  const { user, setUser } = useAuthStore();
  const [loadingMe, setLoadingMe] = useState(true);
  const [competences, setCompetences] = useState<string[]>([]);
  const [disponibilite, setDisponibilite] = useState(8);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoadingMe(true);
    api
      .get('/auth/me')
      .then((r) => {
        const me = r.data?.data as User & {
          domainesCompetences?: string;
          badges?: string;
          disponibiliteHeures?: number;
        };
        if (cancelled || !me) return;
        setUser(me);
        setCompetences(parseJsonArray(me.domainesCompetences));
        if (typeof me.disponibiliteHeures === 'number' && me.disponibiliteHeures > 0) {
          setDisponibilite(me.disponibiliteHeures);
        }
      })
      .catch(() => {
        toast.error('Impossible de charger votre profil.');
      })
      .finally(() => {
        if (!cancelled) setLoadingMe(false);
      });
    return () => { cancelled = true; };
  }, [setUser]);

  if (loadingMe || !user) {
    return <LoadingState message="Chargement du profil formateur…" />;
  }

  const role = user.role;
  const isExterne = role === 'Formateur_Externe';
  const profilInterneComplet = !!user.estFormateur && !isExterne;

  const addComp = (c: string) => {
    if (!competences.includes(c)) setCompetences([...competences, c]);
  };
  const removeComp = (c: string) => setCompetences(competences.filter(x => x !== c));

  const peutSinscrire =
    !isExterne &&
    !profilInterneComplet &&
    (hasRole(role, EMPLOYE_EQUIVALENT_ROLES) || role === 'Manager' || role === 'Direction_RH');

  const inscrire = async () => {
    if (competences.length === 0) { toast.error('Sélectionnez au moins une compétence'); return; }
    setLoading(true);
    try {
      await api.post('/formateurs/inscrire', { domainesCompetences: competences, disponibiliteHeures: disponibilite });
      toast.success('Inscription formateur confirmée !');
      const r = await api.get('/auth/me');
      if (r.data?.data) setUser(r.data.data);
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  const badges = parseJsonArray(user.badges);
  const domainesAffiche = profilInterneComplet ? parseJsonArray(user.domainesCompetences) : competences;

  return (
    <div className="space-y-6 animate-fadeIn max-w-2xl">
      <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
        <h1 className="page-title">
          {isExterne ? 'Mon profil formateur (externe)' : profilInterneComplet ? 'Mon profil formateur' : 'Devenir formateur interne'}
        </h1>
        <p className="page-subtitle">
          {isExterne
            ? 'Votre compte formateur externe est géré avec la Direction RH.'
            : 'Valorisez vos compétences et obtenez une compensation'}
        </p>
      </div>

      {isExterne && (
        <div className="card space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
              <Award size={24} className="text-amber-700" />
            </div>
            <div>
              <p className="font-bold text-gray-900">{user.prenom} {user.nom}</p>
              <p className="text-sm text-gray-600">{user.poste ?? 'Formateur externe'} · {user.email}</p>
              {user.departement && (
                <p className="text-xs text-gray-500 mt-1">Département : {user.departement.nom}</p>
              )}
            </div>
          </div>
          <p className="text-sm text-gray-700 border-t border-gray-100 pt-3">
            Les propositions de mission et les validations d’inscription passent par la RH. Consultez le catalogue et votre calendrier pour le suivi des sessions.
          </p>
        </div>
      )}

      {profilInterneComplet && (
        <div className="space-y-4">
          <div className="card bg-emerald-50 border-emerald-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                <Award size={24} className="text-emerald-600" />
              </div>
              <div>
                <p className="font-bold text-emerald-900">Vous êtes formateur interne</p>
                <p className="text-sm text-emerald-700">Opportunités et missions : tableau de bord formateur.</p>
              </div>
            </div>
          </div>

          <div className="card space-y-3">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <BookOpen size={18} className="text-cni-blue" /> Compétences déclarées
            </h2>
            <div className="flex flex-wrap gap-2">
              {domainesAffiche.length > 0 ? (
                domainesAffiche.map((c) => (
                  <span key={c} className="badge-info text-xs">{c}</span>
                ))
              ) : (
                <span className="text-sm text-gray-500">Aucune compétence enregistrée.</span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm pt-2 border-t border-gray-100">
              <div>
                <p className="text-gray-500 text-xs">Disponibilité</p>
                <p className="font-semibold text-gray-900">{user.disponibiliteHeures ?? disponibilite} h/mois</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">Heures réalisées</p>
                <p className="font-semibold text-gray-900">{user.totalHeuresFormation ?? 0} h</p>
              </div>
              <div className="flex items-center gap-1 col-span-2">
                <Star size={14} className="text-amber-500" />
                <span className="text-gray-500 text-xs">Note</span>
                <span className="font-semibold text-gray-900">{user.noteFormateur != null ? user.noteFormateur.toFixed(1) : '—'} /5</span>
              </div>
            </div>
            {badges.length > 0 && (
              <div>
                <p className="text-xs text-gray-500 mb-1">Badges</p>
                <div className="flex flex-wrap gap-1">
                  {badges.map((b) => (
                    <span key={b} className="badge-success text-[10px]">{b}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {peutSinscrire && (
        <div className="card space-y-5">
          {role === 'Formateur_Interne' && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-900">
              Finalisez votre inscription (compétences + disponibilité) pour activer pleinement votre profil formateur.
            </div>
          )}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-800">
            <strong>Avantages formateur interne :</strong>
            <ul className="list-disc list-inside mt-2 space-y-1 text-blue-700">
              <li>Prime financière : ~50 TND/heure</li>
              <li>Heures créditées dans votre plan de développement</li>
              <li>Badges et reconnaissance interne</li>
              <li>Opportunités de missions externes clients CNI</li>
            </ul>
          </div>

          <div>
            <label className="label">Domaines de compétences *</label>
            <div className="flex flex-wrap gap-2 mb-3">
              {DOMAINES_DISPO.map(d => (
                <button key={d} type="button"
                  onClick={() => competences.includes(d) ? removeComp(d) : addComp(d)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    competences.includes(d) ? 'bg-cni-blue text-white' : 'bg-gray-100 text-gray-600 hover:bg-blue-50'
                  }`}
                >
                  {competences.includes(d) && <X size={10} className="inline mr-1" />}
                  {d}
                </button>
              ))}
            </div>
            {competences.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {competences.map(c => (
                  <span key={c} className="badge-info flex items-center gap-1">
                    {c}
                    <button type="button" onClick={() => removeComp(c)}><X size={10} /></button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="label">Disponibilité mensuelle (heures)</label>
            <div className="flex items-center gap-4">
              <input type="range" min="2" max="40" step="2" value={disponibilite}
                onChange={e => setDisponibilite(parseInt(e.target.value))}
                className="flex-1 accent-cni-blue" />
              <span className="text-lg font-black text-cni-blue w-16 text-center">{disponibilite}h/mois</span>
            </div>
          </div>

          <button type="button" onClick={inscrire} disabled={loading} className="btn-primary w-full justify-center">
            {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Award size={16} /> {role === 'Formateur_Interne' ? 'Finaliser mon inscription formateur' : "M'inscrire comme formateur interne"}</>}
          </button>
        </div>
      )}
    </div>
  );
}
