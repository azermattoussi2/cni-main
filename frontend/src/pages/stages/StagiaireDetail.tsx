import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, CheckCircle, XCircle, FileText, Download, PenLine, Star,
  Zap, FolderKanban, Send, GraduationCap, Mail, Upload, Loader2,
} from 'lucide-react';
import api from '../../lib/api';
import { useAuthStore } from '../../stores/authStore';
import { hasRole, TUTEUR_ROLES } from '../../utils/roleGroups';
import { STATUT_STAGE_LABELS, type Stagiaire } from '../../types';
import toast from 'react-hot-toast';
import LoadingState from '../../components/common/LoadingState';
import EmptyState from '../../components/common/EmptyState';

export default function StagiaireDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [stagiaire, setStagiaire] = useState<Stagiaire | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [aiRelanceLoading, setAiRelanceLoading] = useState(false);
  const [commentaire, setCommentaire] = useState('');
  const [projOpen, setProjOpen] = useState(false);
  const [projTitre, setProjTitre] = useState('');
  const [projDesc, setProjDesc] = useState('');
  const [projDept, setProjDept] = useState<number | ''>('');
  const [formationId, setFormationId] = useState('');
  const [formations, setFormations] = useState<{ id: number; titre: string; description?: string; formateurId?: number }[]>([]);
  const [formateurId, setFormateurId] = useState('');
  const [employes, setEmployes] = useState<{ id: number; prenom: string; nom: string; email: string; departementId?: number }[]>([]);
  const [acceptMgrOpen, setAcceptMgrOpen] = useState(false);
  const [accForm, setAccForm] = useState({ tuteurId: '', dateDebut: '', dateFin: '', sujet: '' });
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({ scheduleStartAt: '', scheduleEndAt: '', message: '' });
  const [attestationOpen, setAttestationOpen] = useState(false);
  const [attestationFile, setAttestationFile] = useState<File | null>(null);
  const [closeForce, setCloseForce] = useState(false);
  const buildFileUrl = (rawPath?: string) => {
    if (!rawPath) return '#';
    const normalized = rawPath.replace(/\\/g, '/').replace(/^\/+/, '');
    return `/${normalized}`;
  };

  useEffect(() => {
    api.get(`/stagiaires/${id}`)
      .then(r => setStagiaire(r.data.data))
      .catch((e: unknown) => {
        const msg = e && typeof e === 'object' && 'response' in e
          ? (e as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
        toast.error(msg || 'Erreur chargement dossier');
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!projOpen) return;
    api
      .get('/employes')
      .then((r) => setEmployes(r.data?.data || []))
      .catch(() => setEmployes([]));
    api
      .get('/formations')
      .then((r) =>
        setFormations(
          ((r.data?.data || []) as Array<{ id: number; titre: string; description?: string; formateurId?: number; isActif?: boolean }>).filter(
            (f) => f?.isActif
          )
        )
      )
      .catch(() => setFormations([]));
  }, [projOpen]);

  const refreshStagiaire = () => {
    void api.get(`/stagiaires/${id}`).then((r) => setStagiaire(r.data.data));
  };

  const action = async (endpoint: string, data: Record<string, unknown>) => {
    setActionLoading(true);
    try {
      const res = await api.post(`/stagiaires/${id}/${endpoint}`, data);
      toast.success(res.data.message || 'Action effectuée');
      setStagiaire(res.data.data || res.data.stagiaire);
    } catch (e: unknown) {
      const msg = e && typeof e === 'object' && 'response' in e
        ? (e as { response?: { data?: { message?: string } } }).response?.data?.message
        : undefined;
      toast.error(msg || 'Erreur');
    } finally {
      setActionLoading(false);
    }
  };

  const workflowPost = async (sub: string, body?: Record<string, unknown>) => {
    setActionLoading(true);
    try {
      const res = await api.post(`/stagiaires/${id}/workflow/${sub}`, body ?? {});
      toast.success(res.data.message || 'Action effectuée');
      refreshStagiaire();
    } catch (e: unknown) {
      const msg = e && typeof e === 'object' && 'response' in e
        ? (e as { response?: { data?: { message?: string } } }).response?.data?.message
        : undefined;
      toast.error(msg || 'Erreur');
    } finally {
      setActionLoading(false);
    }
  };

  const reanalyzeCvIa = async () => {
    setAiRelanceLoading(true);
    try {
      await workflowPost('reanalyze-cv');
    } finally {
      setAiRelanceLoading(false);
    }
  };

  if (loading) return <LoadingState message="Chargement du dossier..." />;
  if (!stagiaire) return <EmptyState title="Dossier introuvable" />;

  const s = stagiaire;
  const isRH = user?.role === 'Direction_RH';
  const isManagerStrict = user?.role === 'Manager';
  const isManager = isManagerStrict || isRH;
  const isTuteur =
    hasRole(user?.role, TUTEUR_ROLES) &&
    s.tuteurId != null &&
    Number(s.tuteurId) === Number(user?.id);
  const canWorkflow = isRH || isManagerStrict || isTuteur;
  const canAssignProject = isRH && (s.statut === 'Accepte' || s.statut === 'En_cours') && !s.projetPdfPath;
  const canSendSchedule = canWorkflow && (s.statut === 'Accepte' || s.statut === 'En_cours');
  const selectedEncadreur = employes.find((em) => Number(em.id) === Number(formateurId));
  const aiStrengths = (s.aiStrengths || '').split('\n').map((v) => v.trim()).filter(Boolean);
  const aiWeaknesses = (s.aiWeaknesses || '').split('\n').map((v) => v.trim()).filter(Boolean);
  let cvExtractedSkills: string[] = [];
  let cvAnalysisQuality: 'full' | 'low_confidence' | 'ai_fallback' | 'ai_unavailable' | undefined;
  let cvFailureReasons: string[] = [];
  try {
    if (s.cvExtractedData?.trim()) {
      const parsed = JSON.parse(s.cvExtractedData) as {
        skills?: unknown;
        _analysisMeta?: { quality?: string; failureReasons?: unknown };
      };
      if (Array.isArray(parsed.skills)) {
        cvExtractedSkills = parsed.skills.map(String).map((x) => x.trim()).filter(Boolean);
      }
      if (Array.isArray(parsed._analysisMeta?.failureReasons)) {
        cvFailureReasons = parsed._analysisMeta?.failureReasons.map(String).map((x) => x.trim()).filter(Boolean);
      }
      const q = parsed._analysisMeta?.quality;
      if (q === 'full' || q === 'low_confidence' || q === 'ai_fallback' || q === 'ai_unavailable') {
        cvAnalysisQuality = q;
      }
    }
  } catch {
    /* JSON invalide ou ancien format */
  }
  const aiBadge =
    !s.cvPath
      ? { label: 'Sans CV', className: 'bg-slate-100 text-slate-600' }
      : cvAnalysisQuality === 'ai_unavailable'
        ? { label: 'IA indisponible', className: 'bg-violet-100 text-violet-800 ring-1 ring-violet-200/80' }
        : s.aiStatus === 'done'
          ? { label: 'Analyse terminée', className: 'bg-emerald-100 text-emerald-700' }
          : s.aiStatus === 'failed'
            ? { label: 'Échec analyse', className: 'bg-red-100 text-red-700' }
            : s.aiStatus === 'pending'
              ? { label: 'Analyse en cours', className: 'bg-amber-100 text-amber-700' }
              : { label: 'Non analysé', className: 'bg-sky-100 text-sky-800' };
  const confidenceBadge =
    s.aiStatus === 'done' && (cvAnalysisQuality === 'low_confidence' || cvAnalysisQuality === 'ai_fallback')
      ? { label: 'Confiance limitée', className: 'bg-amber-100 text-amber-900 ring-1 ring-amber-200/80' }
      : null;
  const aiRecoLabel = s.aiRecommendation === 'accept'
    ? 'Acceptation recommandée'
    : s.aiRecommendation === 'reject'
      ? 'Refus recommandé'
      : s.aiRecommendation === 'need_interview'
        ? 'Entretien recommandé'
        : '—';
  const aiRecoClass = s.aiRecommendation === 'accept'
    ? 'bg-emerald-100 text-emerald-700'
    : s.aiRecommendation === 'reject'
      ? 'bg-red-100 text-red-700'
      : 'bg-amber-100 text-amber-700';
  const aiPanelClass =
    cvAnalysisQuality === 'ai_unavailable'
      ? 'border-violet-200 bg-violet-50/40'
      : cvAnalysisQuality === 'low_confidence' || cvAnalysisQuality === 'ai_fallback'
        ? 'border-amber-200 bg-amber-50/40'
        : 'border-slate-200 bg-white';
  const aiScoreLabel =
    cvAnalysisQuality === 'low_confidence' || cvAnalysisQuality === 'ai_fallback'
      ? 'Évaluation estimative'
      : 'Évaluation IA';
  const submitSchedule = async () => {
    if (!scheduleForm.scheduleStartAt) {
      toast.error('Sélectionnez la date/heure du planning.');
      return;
    }
    if (scheduleForm.scheduleEndAt && scheduleForm.scheduleEndAt <= scheduleForm.scheduleStartAt) {
      toast.error('Le créneau est invalide (fin <= début).');
      return;
    }
    await workflowPost('send-schedule', {
      scheduleStartAt: new Date(scheduleForm.scheduleStartAt).toISOString(),
      scheduleEndAt: scheduleForm.scheduleEndAt ? new Date(scheduleForm.scheduleEndAt).toISOString() : undefined,
      message: scheduleForm.message.trim() || undefined,
    });
    setScheduleOpen(false);
  };
  const uploadAttestation = async () => {
    if (!attestationFile) {
      toast.error('Choisissez un fichier PDF.');
      return;
    }
    const fd = new FormData();
    fd.append('attestation', attestationFile);
    setActionLoading(true);
    try {
      const res = await api.post(`/stagiaires/${id}/workflow/upload-attestation`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success(res.data.message || 'Attestation importée.');
      refreshStagiaire();
      setAttestationOpen(false);
      setAttestationFile(null);
    } catch (e: unknown) {
      const msg = e && typeof e === 'object' && 'response' in e
        ? (e as { response?: { data?: { message?: string } } }).response?.data?.message
        : undefined;
      toast.error(msg || 'Import impossible.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn max-w-5xl">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <button onClick={() => navigate('/app/stagiaires')} className="btn-secondary text-sm">
          <ArrowLeft size={14} /> Retour
        </button>
        <div>
          <h1 className="page-title">{s.prenom} {s.nom}</h1>
          <p className="page-subtitle">{s.email} • {s.typeStage || 'Stage'}</p>
        </div>
        <span className={`ml-auto shrink-0 badge ${s.statut === 'En_cours' ? 'bg-blue-100 text-blue-700' : s.statut === 'Accepte' ? 'bg-emerald-100 text-emerald-700' : s.statut === 'Refuse' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'} text-sm px-3 py-1`}>
          {STATUT_STAGE_LABELS[s.statut] || s.statut}
        </span>
      </div>

      {canWorkflow && (
        <div className="card border-indigo-100 bg-gradient-to-br from-indigo-50/80 to-white shadow-sm ring-1 ring-indigo-950/[0.04]">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <Zap className="text-indigo-600" size={20} />
            <h2 className="text-base font-bold text-slate-900">Automatisation workflow</h2>
          </div>
          <p className="mb-4 text-xs text-slate-600">
            Pilotez les actions métier du dossier stagiaire depuis un seul bloc.
          </p>
          <div className="rounded-xl border border-indigo-100/70 bg-white/70 p-3">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-indigo-700">Actions workflow</p>
            <div className="flex flex-wrap gap-2">
            {isRH && s.statut === 'En_attente' && (
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => workflowPost('accept', { commentaire: commentaire || undefined })}
                className="btn-primary text-sm"
              >
                <CheckCircle size={14} /> Accepter (RH) — transmettre au manager
              </button>
            )}
            {isManagerStrict && s.statut === 'En_examen' && (
              <button type="button" disabled={actionLoading} onClick={() => setAcceptMgrOpen(true)} className="btn-success text-sm">
                <GraduationCap size={14} /> Accepter le stage (manager)
              </button>
            )}
            {canAssignProject && (
              <>
                <button type="button" disabled={actionLoading} onClick={() => setProjOpen(true)} className="btn-secondary text-sm">
                  <FolderKanban size={14} /> Assigner projet + PDF
                </button>
              </>
            )}
            {canAssignProject && (
              <span className="inline-flex items-center rounded-lg border border-slate-200 px-2.5 py-2 text-xs text-slate-500">
                Assignation projet réservée à la RH. Encadreur lié automatiquement.
              </span>
            )}
            {canSendSchedule && (
              <button type="button" disabled={actionLoading} onClick={() => setScheduleOpen(true)} className="btn-secondary text-sm">
                <Send size={14} /> Envoyer planning (e-mail)
              </button>
            )}
            {canWorkflow && s.statut === 'En_cours' && s.noteFinale != null && (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => workflowPost('close-stage', { force: closeForce })}
                  className="btn-primary text-sm bg-slate-800 hover:bg-slate-900"
                >
                  Clôturer le stage (attestation PDF)
                </button>
                {(isRH || isManagerStrict) && (
                  <label className="flex items-center gap-1.5 text-xs text-slate-600">
                    <input type="checkbox" checked={closeForce} onChange={(e) => setCloseForce(e.target.checked)} />
                    Clôture anticipée (forcer)
                  </label>
                )}
              </div>
            )}
            {canWorkflow && s.statut === 'Termine' && !s.attestationPath && (
              <>
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => workflowPost('generate-attestation', {})}
                  className="btn-secondary text-sm"
                >
                  <FileText size={14} /> Générer attestation
                </button>
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => setAttestationOpen(true)}
                  className="btn-secondary text-sm"
                >
                  <Upload size={14} /> Ajouter attestation
                </button>
              </>
            )}
            {canWorkflow && s.statut === 'Termine' && s.attestationPath && (
              <button type="button" disabled={actionLoading} onClick={() => workflowPost('send-attestation', {})} className="btn-success text-sm">
                <Mail size={14} /> Envoyer attestation (e-mail + PDF)
              </button>
            )}
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Infos principales */}
        <div className="lg:col-span-2 space-y-4">
          {/* Identité */}
          <div className="card rounded-2xl border border-slate-200">
            <h3 className="font-bold text-gray-900 text-sm mb-4">👤 Identité</h3>
            <div className="grid sm:grid-cols-2 gap-3 text-sm">
              {[
                { label: 'Nom complet', value: `${s.prenom} ${s.nom}` },
                { label: 'Email', value: s.email },
                { label: 'Téléphone', value: s.telephone || '—' },
                { label: 'École', value: s.ecoleUniversite || '—' },
                { label: 'Niveau', value: s.niveauEtudes?.replace('_', ' ') || '—' },
                { label: 'Spécialité', value: s.specialite || '—' },
              ].map(f => (
                <div key={f.label}>
                  <span className="text-gray-400 text-xs">{f.label}</span>
                  <p className="font-medium text-gray-900">{f.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Stage */}
          <div className="card rounded-2xl border border-slate-200">
            <h3 className="font-bold text-gray-900 text-sm mb-4">📋 Informations du stage</h3>
            <div className="grid sm:grid-cols-2 gap-3 text-sm">
              {[
                { label: 'Département', value: s.departement?.nom || '—' },
                { label: 'Tuteur', value: s.tuteur ? `${s.tuteur.prenom} ${s.tuteur.nom}` : 'Non assigné' },
                { label: 'Sujet', value: s.sujetStage || '—' },
                { label: 'Durée', value: s.dureeStage ? `${s.dureeStage} semaines` : '—' },
                { label: 'Début', value: s.dateDebutStage ? new Date(s.dateDebutStage).toLocaleDateString('fr-FR') : '—' },
                { label: 'Fin', value: s.dateFinStage ? new Date(s.dateFinStage).toLocaleDateString('fr-FR') : '—' },
              ].map(f => (
                <div key={f.label}>
                  <span className="text-gray-400 text-xs">{f.label}</span>
                  <p className="font-medium text-gray-900">{f.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Évaluations */}
          {(s.noteIntermediaire || s.noteFinale) && (
            <div className="card rounded-2xl border border-slate-200">
              <h3 className="font-bold text-gray-900 text-sm mb-4">⭐ Évaluations</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                {s.noteIntermediaire && (
                  <div className="bg-blue-50 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Star size={14} className="text-blue-600" />
                      <span className="text-sm font-semibold text-blue-900">Mi-parcours</span>
                    </div>
                    <div className="text-2xl font-black text-blue-700">{s.noteIntermediaire}/5</div>
                    {s.evaluationIntermediaire && <p className="text-xs text-blue-600 mt-1">{s.evaluationIntermediaire}</p>}
                  </div>
                )}
                {s.noteFinale && (
                  <div className="bg-emerald-50 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Star size={14} className="text-emerald-600" />
                      <span className="text-sm font-semibold text-emerald-900">Finale</span>
                    </div>
                    <div className="text-2xl font-black text-emerald-700">{s.noteFinale}/5</div>
                    {s.evaluationFinale && <p className="text-xs text-emerald-600 mt-1">{s.evaluationFinale}</p>}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className={`card rounded-2xl border ${aiPanelClass}`}>
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-bold text-gray-900 text-sm">🤖 Évaluation IA</h3>
                <div className="flex flex-wrap items-center justify-end gap-2">
                  {canWorkflow && s.cvPath && (
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => void reanalyzeCvIa()}
                      className="btn-secondary inline-flex items-center gap-1.5 text-xs"
                    >
                      {aiRelanceLoading ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" aria-hidden />
                          Relance…
                        </>
                      ) : (
                        s.aiStatus === 'done' || s.aiStatus === 'failed' ? 'Relancer analyse IA' : 'Lancer analyse IA'
                      )}
                    </button>
                  )}
                  {aiRelanceLoading && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2.5 py-1 text-[11px] font-semibold text-violet-800 ring-1 ring-violet-200/80">
                      <Loader2 className="h-3 w-3 shrink-0 animate-spin" aria-hidden />
                      Relance en cours…
                    </span>
                  )}
                  <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${aiBadge.className}`}>
                    {aiBadge.label}
                  </span>
                  {confidenceBadge && (
                    <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${confidenceBadge.className}`}>
                      {confidenceBadge.label}
                    </span>
                  )}
                </div>
              </div>

              {!s.cvPath && (
                <p className="mb-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
                  Aucun CV n’est enregistré sur ce dossier : l’analyse IA ne peut pas s’afficher. Les candidatures récentes
                  exigent un CV (PDF, DOCX ou image). Pour un ancien dossier, importez un CV depuis la fiche ou recréez la candidature avec pièce jointe.
                </p>
              )}

              {s.cvPath &&
                !s.aiStatus &&
                s.aiScore == null &&
                !s.cvExtractedHtml &&
                !s.aiError && (
                  <p className="mb-3 rounded-lg border border-amber-100 bg-amber-50/80 p-3 text-sm text-amber-900">
                    Aucune analyse IA n’est encore enregistrée. Utilisez « Lancer analyse IA » pour extraire les compétences
                    et générer le score (nécessite un fichier CV valide sur le serveur).
                  </p>
                )}

              {(s.aiScore != null || s.aiMoyenne != null) && (
                <div className="mb-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-indigo-200/70 bg-indigo-50 p-4 shadow-sm">
                    <p className="text-[11px] uppercase tracking-wide text-indigo-600 font-semibold">{aiScoreLabel}</p>
                    <p className="text-3xl font-black text-indigo-700 leading-tight">{s.aiScore != null ? `${s.aiScore}/100` : '—'}</p>
                  </div>
                  <div className="rounded-xl border border-sky-200/70 bg-sky-50 p-4 shadow-sm">
                    <p className="text-[11px] uppercase tracking-wide text-sky-600 font-semibold">Moyenne</p>
                    <p className="text-3xl font-black text-sky-700 leading-tight">{s.aiMoyenne != null ? `${s.aiMoyenne}/20` : '—'}</p>
                  </div>
                </div>
              )}

              {s.aiStatus === 'done' && cvAnalysisQuality === 'ai_unavailable' && s.aiScore == null && s.aiMoyenne == null && (
                <div className="mb-4 rounded-xl border border-violet-200 bg-violet-50/90 p-4">
                  <p className="text-xs font-semibold text-violet-900">Scores non calculés</p>
                  <p className="mt-1 text-sm text-violet-800">
                    Aucun texte exploitable n’a été extrait (OCR canvas + OCR via Poppler si installé) et l’API Gemini n’a
                    pas pu lire le PDF (quota ou facturation). Les notes ne sont pas affichées pour éviter une fausse
                    évaluation. Sur Windows, installez Poppler et ajoutez-le au PATH pour améliorer fortement les PDF
                    scannés.
                  </p>
                  {cvFailureReasons.length > 0 && (
                    <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-violet-900">
                      {cvFailureReasons.slice(0, 4).map((reason) => (
                        <li key={reason}>{reason}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {s.aiRecommendation && (
                <div className="mb-3">
                  <span className={`inline-flex rounded-full px-3 py-1.5 text-xs font-semibold shadow-sm ${aiRecoClass}`}>
                    {aiRecoLabel}
                  </span>
                </div>
              )}

              {s.aiFeedback && (
                <div className="mb-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Commentaire</p>
                  <p className="text-sm text-slate-700 leading-relaxed">{s.aiFeedback}</p>
                </div>
              )}

              {s.cvPath && (
                <div className="mb-4 space-y-3">
                  <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-3">
                    <p className="mb-1 text-xs font-semibold text-indigo-900">
                      Dans quels domaines excelle le candidat ?
                    </p>
                    <p className="mb-2 text-[11px] text-indigo-700/90">
                      Compétences détectées dans le CV et synthèse des points forts (IA).
                    </p>
                    {s.aiStatus === 'pending' && cvExtractedSkills.length === 0 && aiStrengths.length === 0 ? (
                      <p className="text-xs text-indigo-800">Analyse en cours… Les domaines et compétences s’afficheront ici une fois le traitement terminé.</p>
                    ) : null}
                    {cvExtractedSkills.length > 0 ? (
                      <div className="mb-2 flex flex-wrap gap-1.5">
                        {cvExtractedSkills.map((skill) => (
                          <span
                            key={skill}
                            className="rounded-full bg-white px-2 py-0.5 text-[11px] font-medium capitalize text-indigo-800 ring-1 ring-indigo-100"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    ) : s.aiStatus === 'done' || s.aiStatus === 'failed' ? (
                      cvAnalysisQuality === 'ai_unavailable' ? (
                        <p className="mb-2 text-xs text-indigo-700">
                          Pas de compétences extraites : le fichier n’a pas pu être lu automatiquement (voir le message
                          d’état ci-dessus).
                        </p>
                      ) : (
                        <p className="mb-2 text-xs text-indigo-700">
                          Aucune compétence « standard » (liste prédéfinie) n’a été reconnue dans le texte extrait — consultez
                          le CV structuré ci-dessous pour le détail.
                        </p>
                      )
                    ) : null}
                    {aiStrengths.length > 0 ? (
                      <ul className="list-disc space-y-1 pl-4 text-xs text-indigo-900">
                        {aiStrengths.map((row) => (
                          <li key={row}>{row}</li>
                        ))}
                      </ul>
                    ) : s.aiStatus === 'done' && cvAnalysisQuality !== 'ai_unavailable' ? (
                      <p className="text-xs text-indigo-700">Aucun point fort textuel renvoyé par l’IA pour ce dossier.</p>
                    ) : null}
                  </div>
                  {aiWeaknesses.length > 0 && (
                    <div className="rounded-xl border border-amber-100 bg-amber-50 p-3">
                      <p className="mb-1 text-xs font-semibold text-amber-800">Points faibles & axes d’amélioration</p>
                      <ul className="list-disc space-y-1 pl-4 text-xs text-amber-900">
                        {aiWeaknesses.map((row) => (
                          <li key={row}>{row}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {s.cvExtractedHtml && (
                <div className="rounded-xl border border-slate-200 bg-white p-3">
                  <p className="mb-2 text-xs font-semibold text-slate-600">CV extrait (format structuré)</p>
                  <div
                    className="prose prose-sm max-w-none text-slate-700"
                    dangerouslySetInnerHTML={{ __html: s.cvExtractedHtml }}
                  />
                </div>
              )}

              {s.aiStatus === 'failed' && Boolean(s.aiError?.trim()) && (
                <p className="mt-3 text-xs text-red-600">Erreur analyse : {s.aiError}</p>
              )}
            </div>
        </div>

        {/* Actions sidebar */}
        <div className="space-y-4">
          {/* Documents */}
          <div className="card rounded-2xl border border-slate-200">
            <h3 className="font-bold text-gray-900 text-sm mb-3">📎 Documents</h3>
            <div className="space-y-2">
              {s.cvPath && (
                <a href={buildFileUrl(s.cvPath)} target="_blank" rel="noreferrer" className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 text-sm text-gray-700">
                  <FileText size={14} className="text-blue-500" /> CV
                  <Download size={12} className="ml-auto text-gray-400" />
                </a>
              )}
              {s.conventionPath && (
                <a href={buildFileUrl(s.conventionPath)} target="_blank" rel="noreferrer" className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 text-sm text-gray-700">
                  <FileText size={14} className="text-emerald-500" /> Convention
                  <Download size={12} className="ml-auto text-gray-400" />
                  {s.conventionSignee && <span className="badge-success text-[10px]">Signée</span>}
                </a>
              )}
              {s.attestationPath && (
                <a href={buildFileUrl(s.attestationPath)} target="_blank" rel="noreferrer" className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 text-sm text-gray-700">
                  <FileText size={14} className="text-purple-500" /> Attestation
                  <Download size={12} className="ml-auto text-gray-400" />
                </a>
              )}
              {s.projetPdfPath && (
                <a href={buildFileUrl(s.projetPdfPath)} target="_blank" rel="noreferrer" className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 text-sm text-gray-700">
                  <FileText size={14} className="text-indigo-500" /> Fiche projet
                  <Download size={12} className="ml-auto text-gray-400" />
                </a>
              )}
              {!s.cvPath && !s.conventionPath && !s.attestationPath && !s.projetPdfPath && (
                <p className="text-xs text-gray-400 text-center py-2">Aucun document</p>
              )}
            </div>
          </div>

          {/* Actions workflow */}
          <div className="card space-y-3 rounded-2xl border border-slate-200">
            <h3 className="font-bold text-gray-900 text-sm mb-3">⚡ Actions</h3>

            {/* Validation RH */}
            {isRH && s.statut === 'En_attente' && (
              <>
                <div>
                  <label className="label text-xs">Commentaire (optionnel)</label>
                  <textarea
                    value={commentaire}
                    onChange={e => setCommentaire(e.target.value)}
                    rows={2}
                    className="input text-xs resize-none"
                    placeholder="Motif de décision..."
                  />
                </div>
                <button
                  onClick={() => action('valider-rh', { action: 'accepter', commentaire })}
                  disabled={actionLoading}
                  className="btn-success w-full justify-center text-sm"
                >
                  <CheckCircle size={14} /> Valider (RH)
                </button>
                <button
                  onClick={() => action('valider-rh', { action: 'refuser', commentaire })}
                  disabled={actionLoading}
                  className="btn-danger w-full justify-center text-sm"
                >
                  <XCircle size={14} /> Refuser
                </button>
              </>
            )}

            {/* Validation Manager */}
            {isManager && s.statut === 'En_examen' && (
              <>
                <div>
                  <label className="label text-xs">Commentaire</label>
                  <textarea
                    value={commentaire}
                    onChange={e => setCommentaire(e.target.value)}
                    rows={2}
                    className="input text-xs resize-none"
                  />
                </div>
                <button
                  onClick={() => action('valider-manager', { action: 'accepter', commentaire })}
                  disabled={actionLoading}
                  className="btn-success w-full justify-center text-sm"
                >
                  <CheckCircle size={14} /> Accepter le stage
                </button>
                <button
                  onClick={() => action('valider-manager', { action: 'refuser', commentaire })}
                  disabled={actionLoading}
                  className="btn-danger w-full justify-center text-sm"
                >
                  <XCircle size={14} /> Refuser
                </button>
              </>
            )}

            {/* Signer convention */}
            {s.statut === 'Accepte' && s.conventionPath && !s.conventionSignee && (
              <button
                onClick={() => action('signer-convention', {})}
                disabled={actionLoading}
                className="btn-primary w-full justify-center text-sm"
              >
                <PenLine size={14} /> Signer la convention
              </button>
            )}

            {(s.statut === 'Termine' || s.statut === 'Refuse' || s.statut === 'En_cours') && (
              <p className="text-xs text-gray-400 text-center">
                {s.statut === 'Termine' ? '✅ Stage terminé' :
                 s.statut === 'En_cours' ? '🔄 Stage en cours' :
                 '❌ Candidature refusée'}
              </p>
            )}
            {s.planningEnvoyeAt && (
              <p className="text-[10px] text-gray-400 text-center">
                Dernier envoi planning : {new Date(s.planningEnvoyeAt).toLocaleString('fr-FR')}
              </p>
            )}
          </div>
        </div>
      </div>

      {projOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
            <h3 className="font-bold text-gray-900">Assigner projet + encadreur</h3>
            <p className="mt-1 text-xs text-gray-500">En un clic : projet + encadreur + fiche PDF + e-mail au stagiaire.</p>
            <label className="label mt-3 text-xs">Depuis une formation du site (optionnel)</label>
            <select
              className="input text-sm"
              value={formationId}
              onChange={(e) => {
                const nextId = e.target.value;
                setFormationId(nextId);
                if (!nextId) return;
                const selected = formations.find((f) => f.id === Number(nextId));
                if (!selected) return;
                setProjTitre(selected.titre || '');
                if (!projDesc.trim()) setProjDesc(selected.description || '');
                if (selected.formateurId && !formateurId) setFormateurId(String(selected.formateurId));
              }}
            >
              <option value="">— Saisie manuelle du projet —</option>
              {formations.map((f) => (
                <option key={f.id} value={f.id}>
                  #{f.id} — {f.titre}
                </option>
              ))}
            </select>
            <label className="label mt-3 text-xs">Titre du projet</label>
            <input className="input text-sm" value={projTitre} onChange={(e) => setProjTitre(e.target.value)} />
            <label className="label mt-2 text-xs">Description (optionnel)</label>
            <textarea className="input text-sm min-h-[80px]" value={projDesc} onChange={(e) => setProjDesc(e.target.value)} />
            {isRH && (
              <>
                <label className="label mt-2 text-xs">Département (ID, optionnel — RH uniquement)</label>
                <input
                  type="number"
                  className="input text-sm"
                  placeholder="ex. 2"
                  value={projDept === '' ? '' : projDept}
                  onChange={(e) => setProjDept(e.target.value === '' ? '' : Number(e.target.value))}
                />
              </>
            )}
            <label className="label mt-2 text-xs">Encadreur (optionnel)</label>
            <input
              className="input text-sm"
              value={formateurId}
              onChange={(e) => setFormateurId(e.target.value)}
              placeholder="ID encadreur (sinon auto)"
            />
            {employes.length > 0 && (
              <select
                className="input text-sm mt-2"
                value=""
                onChange={(e) => setFormateurId(e.target.value)}
              >
                <option value="">— Choisir un encadreur —</option>
                {employes.map((em) => (
                  <option key={em.id} value={em.id}>
                    {em.prenom} {em.nom} (#{em.id})
                  </option>
                ))}
              </select>
            )}
            {selectedEncadreur && (
              <p className="mt-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                Encadreur sélectionné : {selectedEncadreur.prenom} {selectedEncadreur.nom} ({selectedEncadreur.email})
              </p>
            )}
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" className="btn-secondary text-sm" onClick={() => setProjOpen(false)}>
                Annuler
              </button>
              <button
                type="button"
                className="btn-primary text-sm"
                disabled={actionLoading || projTitre.trim().length < 3}
                onClick={() => {
                  const payload: Record<string, unknown> = { titre: projTitre.trim(), description: projDesc.trim() || undefined };
                  if (formationId) payload.formationId = parseInt(formationId, 10);
                  if (isRH && projDept !== '' && projDept != null) payload.departementId = Number(projDept);
                  if (formateurId) payload.formateurId = parseInt(formateurId, 10);
                  void workflowPost('assign-project', payload).then(() => setProjOpen(false));
                }}
              >
                Valider
              </button>
            </div>
          </div>
        </div>
      )}

      {acceptMgrOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
            <h3 className="font-bold text-gray-900">Accepter le stage (manager)</h3>
            <p className="mt-1 text-xs text-gray-500">Convention PDF générée et envoyée automatiquement.</p>
            <label className="label mt-3 text-xs">ID tuteur / référent (optionnel)</label>
            <input
              className="input text-sm"
              value={accForm.tuteurId}
              onChange={(e) => setAccForm((f) => ({ ...f, tuteurId: e.target.value }))}
            />
            <label className="label mt-2 text-xs">Date début</label>
            <input
              type="date"
              className="input text-sm"
              value={accForm.dateDebut}
              onChange={(e) => setAccForm((f) => ({ ...f, dateDebut: e.target.value }))}
            />
            <label className="label mt-2 text-xs">Date fin</label>
            <input
              type="date"
              className="input text-sm"
              value={accForm.dateFin}
              onChange={(e) => setAccForm((f) => ({ ...f, dateFin: e.target.value }))}
            />
            <label className="label mt-2 text-xs">Sujet (optionnel)</label>
            <input
              className="input text-sm"
              value={accForm.sujet}
              onChange={(e) => setAccForm((f) => ({ ...f, sujet: e.target.value }))}
            />
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" className="btn-secondary text-sm" onClick={() => setAcceptMgrOpen(false)}>
                Annuler
              </button>
              <button
                type="button"
                className="btn-success text-sm"
                disabled={actionLoading}
                onClick={() => {
                  const payload: Record<string, unknown> = {
                    commentaire: commentaire || undefined,
                    dateDebut: accForm.dateDebut || undefined,
                    dateFin: accForm.dateFin || undefined,
                    sujet: accForm.sujet || undefined,
                  };
                  if (accForm.tuteurId) payload.tuteurId = parseInt(accForm.tuteurId, 10);
                  void workflowPost('accept', payload).then(() => setAcceptMgrOpen(false));
                }}
              >
                Confirmer l’acceptation
              </button>
            </div>
          </div>
        </div>
      )}
      {scheduleOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
            <h3 className="font-bold text-gray-900">Envoyer planning</h3>
            <p className="mt-1 text-xs text-gray-500">Le mail sera envoyé à {s.email}.</p>
            <label className="label mt-3 text-xs">Date/heure début</label>
            <input
              type="datetime-local"
              className="input text-sm"
              value={scheduleForm.scheduleStartAt}
              onChange={(e) => setScheduleForm((f) => ({ ...f, scheduleStartAt: e.target.value }))}
            />
            <label className="label mt-2 text-xs">Date/heure fin (optionnel)</label>
            <input
              type="datetime-local"
              className="input text-sm"
              value={scheduleForm.scheduleEndAt}
              onChange={(e) => setScheduleForm((f) => ({ ...f, scheduleEndAt: e.target.value }))}
            />
            <label className="label mt-2 text-xs">Message complémentaire (optionnel)</label>
            <textarea
              className="input text-sm min-h-[80px]"
              value={scheduleForm.message}
              onChange={(e) => setScheduleForm((f) => ({ ...f, message: e.target.value }))}
            />
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" className="btn-secondary text-sm" onClick={() => setScheduleOpen(false)}>
                Annuler
              </button>
              <button type="button" className="btn-primary text-sm" disabled={actionLoading} onClick={() => void submitSchedule()}>
                Envoyer
              </button>
            </div>
          </div>
        </div>
      )}
      {attestationOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
            <h3 className="font-bold text-gray-900">Ajouter attestation</h3>
            <p className="mt-1 text-xs text-gray-500">Importez le PDF officiel pour {s.prenom} {s.nom}.</p>
            <input
              type="file"
              accept=".pdf"
              className="input mt-3 text-sm"
              onChange={(e) => setAttestationFile(e.target.files?.[0] || null)}
            />
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" className="btn-secondary text-sm" onClick={() => setAttestationOpen(false)}>
                Annuler
              </button>
              <button type="button" className="btn-primary text-sm" disabled={actionLoading} onClick={() => void uploadAttestation()}>
                Importer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
