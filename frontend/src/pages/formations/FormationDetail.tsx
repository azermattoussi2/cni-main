// ============================================
// Fichier : pages/formations/FormationDetail.tsx
// ============================================
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, Users, MapPin, BookOpen } from 'lucide-react';
import api from '../../lib/api';
import { useAuthStore } from '../../stores/authStore';
import toast from 'react-hot-toast';
import FormationEnrollActions from '../../components/formations/FormationEnrollActions';
import { canSelfEnrollFormation } from '../../utils/formationEnrollment';

export default function FormationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [formation, setFormation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api.get(`/formations/${id}`)
      .then(r => setFormation(r.data.data))
      .catch(() => toast.error('Formation introuvable'))
      .finally(() => setLoading(false));
  }, [id]);

  const publier = async () => {
    try {
      await api.post(`/formations/${id}/publier`, {});
      toast.success('Formation publiée !');
      setFormation((f: any) => ({ ...f, statut: 'Publiee' }));
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Erreur');
    }
  };

  if (loading) return <div className="flex justify-center items-center h-64"><div className="w-8 h-8 border-2 border-cni-blue border-t-transparent rounded-full animate-spin" /></div>;
  if (!formation) return <div className="text-center py-16 text-gray-400">Formation introuvable</div>;

  const f = formation;
  const isRH = user?.role === 'Direction_RH';
  const canEnroll = canSelfEnrollFormation(user?.role);
  const myInscription = canEnroll && user?.id
    ? f.inscriptions?.find((i: any) => Number(i.employeId) === Number(user.id))
    : undefined;
  const monInscription = f.monInscription ?? (myInscription ? { id: myInscription.id, statut: myInscription.statut } : null);
  const placesRestantes = f.maxParticipants ? f.maxParticipants - f.nbInscrits : null;

  return (
    <div className="space-y-6 animate-fadeIn max-w-4xl">
      <div className="flex items-center gap-4 bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
        <button onClick={() => navigate('/app/formations')} className="btn-secondary text-sm"><ArrowLeft size={14} /> Retour</button>
        <div className="flex-1">
          <h1 className="page-title">{f.titre}</h1>
          <p className="page-subtitle">{f.domaine} • {f.type} • {f.niveau}</p>
        </div>
        <span className={`badge ${f.statut === 'Publiee' ? 'badge-success' : f.statut === 'Brouillon' ? 'badge-warning' : 'badge-gray'}`}>
          {f.statut}
        </span>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {f.description && (
            <div className="card">
              <h3 className="font-bold text-gray-900 text-sm mb-3">📝 Description</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{f.description}</p>
            </div>
          )}
          {f.objectifs && (
            <div className="card">
              <h3 className="font-bold text-gray-900 text-sm mb-3">🎯 Objectifs</h3>
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{f.objectifs}</p>
            </div>
          )}
          {f.programme && (
            <div className="card">
              <h3 className="font-bold text-gray-900 text-sm mb-3">📋 Programme</h3>
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{f.programme}</p>
            </div>
          )}
          {/* Liste inscrits (RH seulement) */}
          {isRH && f.inscriptions?.length > 0 && (
            <div className="card">
              <h3 className="font-bold text-gray-900 text-sm mb-3">👥 Inscrits ({f.inscriptions.length})</h3>
              <div className="space-y-2">
                {f.inscriptions.map((insc: any) => (
                  <div key={insc.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <span className="text-sm text-gray-900">{insc.employe?.prenom} {insc.employe?.nom}</span>
                    <span className={`badge text-xs ${insc.statut === 'Validee' ? 'badge-success' : insc.statut === 'Refusee' ? 'badge-danger' : 'badge-warning'}`}>
                      {insc.statut}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar infos + actions */}
        <div className="space-y-4">
          <div className="card space-y-3">
            <h3 className="font-bold text-gray-900 text-sm">ℹ️ Informations</h3>
            {[
              { icon: Calendar, label: 'Dates', value: f.dateDebut ? `${new Date(f.dateDebut).toLocaleDateString('fr-FR')} → ${f.dateFin ? new Date(f.dateFin).toLocaleDateString('fr-FR') : '?'}` : 'Non définies' },
              { icon: Clock, label: 'Durée', value: f.dureeJours ? `${f.dureeJours} jour(s) (${f.dureeHeures || f.dureeJours * 7}h)` : 'Non définie' },
              { icon: MapPin, label: 'Lieu', value: f.lieu || (f.lienVisio ? 'En ligne' : 'Non défini') },
              { icon: Users, label: 'Places', value: f.maxParticipants ? `${f.nbInscrits}/${f.maxParticipants} inscrits` : 'Illimité' },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-start gap-3">
                <Icon size={15} className="text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-400">{label}</p>
                  <p className="text-sm font-medium text-gray-900">{value}</p>
                </div>
              </div>
            ))}
            {f.cout !== undefined && (
              <div className="pt-2 border-t border-gray-100">
                <p className="text-xs text-gray-400">Coût</p>
                <p className="text-lg font-black text-cni-orange">{f.cout === 0 ? 'Gratuit' : `${Number(f.cout).toLocaleString()} TND`}</p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="card space-y-3">
            {canEnroll && monInscription && ['En_attente_manager', 'En_attente_RH', 'Liste_attente'].includes(monInscription.statut) && (
              <p className="text-xs text-gray-500">Réf. demande n° {monInscription.id}</p>
            )}
            {f.statut === 'Publiee' && canEnroll && (
              <FormationEnrollActions
                formationId={Number(id)}
                formationPubliee
                maxParticipants={f.maxParticipants}
                nbInscrits={f.nbInscrits ?? 0}
                monInscription={monInscription}
                allowEnrollment
                showWaitlistHint={placesRestantes !== null && placesRestantes <= 0}
                onMonInscriptionChange={(next) => {
                  setFormation((prev: any) => (prev ? { ...prev, monInscription: next } : prev));
                }}
              />
            )}
            {isRH && f.statut === 'Brouillon' && (
              <button onClick={publier} className="btn-success w-full justify-center text-sm">
                Publier la formation
              </button>
            )}
            {isRH && (
              <button onClick={() => navigate(`/app/formations/${id}/modifier`)} className="btn-secondary w-full justify-center text-sm">
                Modifier
              </button>
            )}
            {f.lienVisio && (
              <a href={f.lienVisio} target="_blank" className="btn-secondary w-full justify-center text-sm">
                🎥 Rejoindre en ligne
              </a>
            )}
          </div>

          {f.formateurInterne && (
            <div className="card">
              <p className="text-xs text-gray-400 mb-1">Formateur</p>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-cni-orange/20 flex items-center justify-center text-cni-orange text-xs font-bold">
                  {f.formateurInterne.prenom?.[0]}{f.formateurInterne.nom?.[0]}
                </div>
                <div>
                  <p className="text-sm font-medium">{f.formateurInterne.prenom} {f.formateurInterne.nom}</p>
                  <p className="text-xs text-gray-400">Formateur Interne</p>
                </div>
              </div>
            </div>
          )}
          {f.formateurNom && !f.formateurInterne && (
            <div className="card">
              <p className="text-xs text-gray-400 mb-1">Formateur</p>
              <p className="text-sm font-medium">{f.formateurNom}</p>
              <p className="text-xs text-gray-400">Formateur Externe</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
