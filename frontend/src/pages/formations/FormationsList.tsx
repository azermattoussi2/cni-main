// ============================================
// Fichier : pages/formations/FormationsList.tsx
// Description : Catalogue des formations avec filtres
// Auteur : Développeur CNI — Date : 14/04/2026
// ============================================

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, BookOpen, Clock, Users, Calendar, ChevronRight } from 'lucide-react';
import api from '../../lib/api';
import { useAuthStore } from '../../stores/authStore';
import type { Formation } from '../../types';
import LoadingState from '../../components/common/LoadingState';
import EmptyState from '../../components/common/EmptyState';
import FormationEnrollActions from '../../components/formations/FormationEnrollActions';
import { PageStatGrid } from '../../components/common/PageStatGrid';
import { canSelfEnrollFormation } from '../../utils/formationEnrollment';

const DOMAINES = ['Informatique', 'Management', 'Communication', 'Finance', 'RH', 'Securite', 'Langue', 'Technique', 'Autre'];
const DOMAINE_COLORS: Record<string, string> = {
  Informatique: 'bg-blue-100 text-blue-700', Management: 'bg-purple-100 text-purple-700',
  Communication: 'bg-pink-100 text-pink-700', Finance: 'bg-emerald-100 text-emerald-700',
  Securite: 'bg-red-100 text-red-700', Langue: 'bg-amber-100 text-amber-700',
  RH: 'bg-indigo-100 text-indigo-700', Technique: 'bg-cyan-100 text-cyan-700',
};

export default function FormationsList() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [formations, setFormations] = useState<Formation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [domaine, setDomaine] = useState('');
  const [statut, setStatut] = useState('Publiee');
  const isRH = user?.role === 'Direction_RH';
  const canEnroll = canSelfEnrollFormation(user?.role);

  const loadFormations = useCallback(() => {
    const p = new URLSearchParams();
    if (search) p.append('search', search);
    if (domaine) p.append('domaine', domaine);
    if (statut) p.append('statut', statut);
    setLoading(true);
    api
      .get(`/formations?${p}`)
      .then((r) => setFormations(r.data.data || []))
      .catch(() => setFormations(getMockFormations()))
      .finally(() => setLoading(false));
  }, [search, domaine, statut]);

  useEffect(() => {
    loadFormations();
  }, [loadFormations]);

  const stats = useMemo(() => {
    const total = formations.length;
    const publiees = formations.filter((f) => f.statut === 'Publiee').length;
    const brouillons = formations.filter((f) => f.statut === 'Brouillon').length;
    const gratuites = formations.filter((f) => !f.cout || Number(f.cout) === 0).length;
    return [
      { label: 'Résultats', value: total, color: 'bg-gray-50 border-gray-200', text: 'text-gray-700' },
      { label: 'Publiées', value: publiees, color: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700' },
      { label: 'Brouillons', value: brouillons, color: 'bg-amber-50 border-amber-200', text: 'text-amber-700' },
      { label: 'Gratuites', value: gratuites, color: 'bg-blue-50 border-blue-200', text: 'text-blue-700' },
    ];
  }, [formations]);

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="page-header">
        <div>
          <h1 className="page-title">Catalogue des Formations</h1>
          <p className="page-subtitle">
            {formations.length} formation(s) affichée(s) selon filtres — même vue que Candidatures & Stages
          </p>
        </div>
        {isRH && (
          <button onClick={() => navigate('/app/formations/creer')} className="btn-primary text-sm">
            <Plus size={14} /> Nouvelle formation
          </button>
        )}
      </div>

      <PageStatGrid items={stats} />

      {/* Filtres */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..." className="input pl-9" />
        </div>
        <select value={domaine} onChange={e => setDomaine(e.target.value)} className="input w-auto">
          <option value="">Tous les domaines</option>
          {DOMAINES.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <select value={statut} onChange={e => setStatut(e.target.value)} className="input w-auto">
          <option value="Publiee">Publiées</option>
          <option value="">Toutes</option>
          {isRH && <option value="Brouillon">Brouillons</option>}
        </select>
      </div>

      {/* Grid formations */}
      {loading ? (
        <LoadingState message="Chargement des formations..." />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {formations.map(f => (
            <div key={f.id} className="card-hover group flex flex-col border border-gray-100 shadow-sm">
              {/* Header card */}
              <div className="flex items-start justify-between mb-3">
                <div className={`badge text-xs ${DOMAINE_COLORS[f.domaine] || 'badge-gray'}`}>{f.domaine}</div>
                <div className="flex flex-col items-end gap-1">
                  {f.cout === 0 && <span className="badge-success text-[10px]">Gratuit</span>}
                  {f.statut !== 'Publiee' && <span className="badge-warning text-[10px]">{f.statut}</span>}
                </div>
              </div>

              <h3 className="font-bold text-gray-900 group-hover:text-cni-blue transition-colors line-clamp-2 mb-2 flex-1">
                {f.titre}
              </h3>

              {f.description && (
                <p className="text-xs text-gray-400 line-clamp-2 mb-3">{f.description}</p>
              )}

              {/* Metadata */}
              <div className="flex flex-wrap gap-3 text-xs text-gray-500 mb-4">
                {(f.dureeJours || f.dureeHeures) && (
                  <span className="flex items-center gap-1">
                    <Clock size={11} />
                    {f.dureeJours ? `${f.dureeJours} jour(s)` : `${f.dureeHeures}h`}
                  </span>
                )}
                {f.dateDebut && (
                  <span className="flex items-center gap-1">
                    <Calendar size={11} />
                    {new Date(f.dateDebut).toLocaleDateString('fr-FR')}
                  </span>
                )}
                {f.maxParticipants && (
                  <span className="flex items-center gap-1">
                    <Users size={11} />
                    {f.nbInscrits}/{f.maxParticipants}
                  </span>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                {f.cout ? (
                  <span className="text-sm font-bold text-cni-orange">{Number(f.cout).toLocaleString()} TND</span>
                ) : (
                  <span className="text-sm font-bold text-emerald-600">Gratuit</span>
                )}
                <div className="flex gap-2">
                  <button onClick={() => navigate(`/app/formations/${f.id}`)} className="btn-secondary text-xs px-3 py-1.5">
                    Détail <ChevronRight size={12} />
                  </button>
                  {isRH && (
                    <button onClick={() => navigate(`/app/formations/${f.id}/modifier`)} className="btn-secondary text-xs px-3 py-1.5">
                      Modifier
                    </button>
                  )}
                  {f.statut === 'Publiee' && canEnroll && (
                    <FormationEnrollActions
                      formationId={f.id}
                      formationPubliee
                      maxParticipants={f.maxParticipants}
                      nbInscrits={f.nbInscrits ?? 0}
                      monInscription={f.monInscription}
                      allowEnrollment
                      compact
                      onMonInscriptionChange={(next) =>
                        setFormations((prev) =>
                          prev.map((row) => (row.id === f.id ? { ...row, monInscription: next } : row))
                        )
                      }
                    />
                  )}
                </div>
              </div>
            </div>
          ))}

          {formations.length === 0 && (
            <div className="col-span-full">
              <EmptyState
                title="Aucune formation trouvée"
                subtitle="Modifiez vos filtres ou créez une nouvelle formation"
                icon={<BookOpen size={40} />}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function getMockFormations(): Formation[] {
  return [
    { id: 1, titre: 'React 18 & TypeScript - Dev Frontend Avancé', domaine: 'Informatique', type: 'Interne', niveau: 'Avancé', dureeJours: 3, dureeHeures: 21, dateDebut: '2026-04-22', cout: 0, nbInscrits: 4, maxParticipants: 12, statut: 'Publiee', createdAt: '2026-01-01' },
    { id: 2, titre: 'Cybersécurité - Pentest & Ethical Hacking', domaine: 'Securite', type: 'Interne', niveau: 'Expert', dureeJours: 5, dureeHeures: 35, dateDebut: '2026-04-29', cout: 0, nbInscrits: 2, maxParticipants: 8, statut: 'Publiee', createdAt: '2026-01-01' },
    { id: 3, titre: 'Management & Leadership', domaine: 'Management', type: 'Externe', niveau: 'Intermédiaire', dureeJours: 2, dureeHeures: 14, dateDebut: '2026-05-06', cout: 2500, coutParParticipant: 350, nbInscrits: 7, maxParticipants: 20, statut: 'Publiee', createdAt: '2026-01-01' },
    { id: 4, titre: 'DevOps - Docker, Kubernetes & CI/CD', domaine: 'Informatique', type: 'E_learning', niveau: 'Avancé', dureeJours: 4, dureeHeures: 28, dateDebut: '2026-05-15', cout: 1200, nbInscrits: 12, maxParticipants: 30, statut: 'Publiee', createdAt: '2026-01-01' },
    { id: 5, titre: 'Communication Professionnelle en Anglais', domaine: 'Langue', type: 'Externe', niveau: 'Intermédiaire', dureeJours: 10, dureeHeures: 30, cout: 3000, coutParParticipant: 300, nbInscrits: 0, statut: 'Brouillon', createdAt: '2026-02-01' },
  ];
}
