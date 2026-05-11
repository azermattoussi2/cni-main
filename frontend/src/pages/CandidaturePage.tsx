// ============================================
// Fichier : pages/CandidaturePage.tsx
// Description : Formulaire public de candidature de stage
// Accessible sans authentification (section 11 du cahier)
// Parsing CV, upload fichiers, consentement RGPD
// Auteur : Développeur CNI — Date : 14/04/2026
// ============================================

import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Upload, CheckCircle, ArrowLeft, Send, User, GraduationCap, Calendar, FileText, Mail, ShieldCheck } from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import BrandLogo from '../components/common/BrandLogo';

const NIVEAUX = ['Licence_1', 'Licence_2', 'Licence_3', 'Master_1', 'Master_2', 'Ingenieur', 'Doctorat', 'Autre'];
const TYPES_STAGE = ['PFE', 'PFA', 'Stage d\'observation', 'Stage d\'été', 'Autre'];
const DEPARTEMENTS_PUBLICS: Departement[] = [
  { id: 1, nom: 'Développement Logiciel', code: 'DEV' },
  { id: 2, nom: 'Infrastructure & Réseaux', code: 'INF' },
  { id: 3, nom: 'Ressources Humaines', code: 'RH' },
  { id: 4, nom: 'Direction Générale', code: 'DG' },
  { id: 5, nom: 'Cybersécurité', code: 'SEC' },
];

interface Departement { id: number; nom: string; code: string; }
interface FormationPublic { id: number; titre: string; description?: string; }

export default function CandidaturePage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [departements, setDepartements] = useState<Departement[]>([]);
  const [formationsPubliques, setFormationsPubliques] = useState<FormationPublic[]>([]);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [lmFile, setLmFile] = useState<File | null>(null);
  const [otpCode, setOtpCode] = useState('');
  const [otpToken, setOtpToken] = useState<string | null>(null);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  const [form, setForm] = useState({
    natureDemande: 'stage',
    nom: '', prenom: '', email: '', telephone: '',
    ecoleUniversite: '', niveauEtudes: '', specialite: '',
    departementId: '', dateDebutStage: '', dateFinStage: '',
    formationId: '',
    typeStage: 'PFE', sujetStage: '', motivation: '',
    rgpdConsenti: false,
  });

  useEffect(() => {
    setDepartements(DEPARTEMENTS_PUBLICS);
    api
      .get('/formations/public/catalog')
      .then((r) => setFormationsPubliques(r.data?.data || []))
      .catch(() => setFormationsPubliques([]));
  }, []);

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const envoyerOtp = async () => {
    if (!form.email?.trim()) {
      toast.error('Renseignez votre e-mail à l’étape 1.');
      return;
    }
    setOtpLoading(true);
    try {
      await api.post('/auth/otp/candidature/request', { email: form.email.trim() });
      setOtpSent(true);
      toast.success('Code envoyé. Vérifiez votre boîte mail.');
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Envoi du code impossible.');
    } finally {
      setOtpLoading(false);
    }
  };

  const verifierOtp = async () => {
    if (!otpCode.trim() || otpCode.trim().length < 4) {
      toast.error('Saisissez le code reçu par e-mail.');
      return;
    }
    setOtpLoading(true);
    try {
      const r = await api.post('/auth/otp/candidature/verify', {
        email: form.email.trim(),
        code: otpCode.trim(),
      });
      const token = r.data?.data?.otpVerificationToken;
      if (!token) throw new Error('no token');
      setOtpToken(token);
      toast.success('E-mail vérifié. Vous pouvez envoyer votre candidature.');
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Code invalide.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.rgpdConsenti) { toast.error('Veuillez accepter la politique RGPD.'); return; }
    if (form.natureDemande === 'stage' && !form.departementId) {
      toast.error('Veuillez sélectionner un département pour la demande de stage.');
      return;
    }
    if (form.natureDemande === 'stage' && (!form.dateDebutStage || !form.dateFinStage)) {
      toast.error('Veuillez renseigner les dates de stage.');
      return;
    }
    if (form.natureDemande === 'formation' && !form.formationId && !form.sujetStage.trim()) {
      toast.error('Veuillez choisir une formation du site ou saisir une demande de formation.');
      return;
    }
    if (!otpToken) {
      toast.error('Validez d’abord le code reçu par e-mail (section vérification ci-dessus).');
      return;
    }

    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, String(v)));
      fd.append('otpVerificationToken', otpToken);
      if (cvFile) fd.append('cv', cvFile);
      if (lmFile) fd.append('lettreMotivation', lmFile);

      await api.post('/stagiaires/candidature', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setSubmitted(true);
      toast.success('Candidature soumise avec succès !');
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Erreur lors de la soumission');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-blue-950 flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl p-10 max-w-md w-full text-center shadow-2xl">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={40} className="text-emerald-500" />
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-3">Candidature envoyée !</h2>
          <p className="text-gray-500 mb-2">
            Merci <strong>{form.prenom} {form.nom}</strong>, votre candidature a bien été reçue.
          </p>
          <p className="text-gray-400 text-sm mb-8">
            Un email de confirmation a été envoyé à <strong>{form.email}</strong>. Notre équipe RH vous contactera sous 5 jours ouvrables.
          </p>
          <div className="space-y-3">
            <button onClick={() => navigate('/')} className="btn-primary w-full justify-center">
              Retour à l'accueil
            </button>
            <button onClick={() => { setSubmitted(false); setStep(1); setForm(f => ({ ...f, email: '', nom: '', prenom: '' })); }}
              className="btn-secondary w-full justify-center text-sm">
              Nouvelle candidature
            </button>
          </div>
        </div>
      </div>
    );
  }

  const steps = [
    { label: 'Identité', icon: User },
    { label: 'Formation', icon: GraduationCap },
    { label: 'Stage', icon: Calendar },
    { label: 'Documents', icon: FileText },
  ];

  const inputProps = (key: string) => ({
    value: (form as any)[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => set(key, e.target.value),
    className: 'input',
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
      {/* Navbar */}
      <div className="border-b border-white/10 px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-white/70 hover:text-white text-sm">
            <ArrowLeft size={16} /> Retour à l'accueil
          </Link>
          <div className="flex items-center gap-2">
            <BrandLogo className="w-7 h-7" roundedClassName="rounded-lg bg-white p-0.5" />
            <span className="text-white font-bold text-sm">CNI - Stages & Formations</span>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-10">
        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-white mb-2">Candidature Stage / Formation</h1>
          <p className="text-blue-300 text-sm">Remplissez le formulaire ci-dessous. Tous les champs marqués * sont obligatoires.</p>
        </div>

        {/* Stepper */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {steps.map((s, i) => (
            <div key={s.label} className="flex items-center gap-2">
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                step === i + 1 ? 'bg-cni-orange text-white' :
                step > i + 1 ? 'bg-emerald-500 text-white' : 'bg-white/10 text-white/50'
              }`}>
                {step > i + 1 ? <CheckCircle size={11} /> : <s.icon size={11} />}
                <span className="hidden sm:inline">{s.label}</span>
              </div>
              {i < steps.length - 1 && (
                <div className={`w-8 h-px ${step > i + 1 ? 'bg-emerald-500' : 'bg-white/20'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Form card */}
        <div className="bg-white/95 backdrop-blur rounded-3xl shadow-2xl p-8 border border-gray-100">
          {/* Étape 1 : Identité */}
          {step === 1 && (
            <div className="space-y-4 animate-fadeIn">
              <h2 className="text-lg font-bold text-gray-900 mb-5">👤 Informations personnelles</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Nom *</label>
                  <input {...inputProps('nom')} placeholder="Ben Amor" required />
                </div>
                <div>
                  <label className="label">Prénom *</label>
                  <input {...inputProps('prenom')} placeholder="Sara" required />
                </div>
              </div>
              <div>
                <label className="label">Email *</label>
                <input {...inputProps('email')} type="email" placeholder="sara@esprit.tn" required />
              </div>
              <div>
                <label className="label">Téléphone</label>
                <input {...inputProps('telephone')} type="tel" placeholder="+216 55 123 456" />
              </div>
            </div>
          )}

          {/* Étape 2 : Formation */}
          {step === 2 && (
            <div className="space-y-4 animate-fadeIn">
              <h2 className="text-lg font-bold text-gray-900 mb-5">🎓 Formation académique</h2>
              <div>
                <label className="label">École / Université</label>
                <input {...inputProps('ecoleUniversite')} placeholder="ESPRIT - École Supérieure d'Ingénierie" />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Niveau d'études</label>
                  <select {...inputProps('niveauEtudes')} className="input">
                    <option value="">-- Sélectionner --</option>
                    {NIVEAUX.map(n => <option key={n} value={n}>{n.replace('_', ' ')}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Spécialité</label>
                  <input {...inputProps('specialite')} placeholder="Génie Logiciel" />
                </div>
              </div>
            </div>
          )}

          {/* Étape 3 : Demande */}
          {step === 3 && (
            <div className="space-y-4 animate-fadeIn">
              <h2 className="text-lg font-bold text-gray-900 mb-5">📋 Type de demande</h2>
              <div>
                <label className="label">Je souhaite</label>
                <select {...inputProps('natureDemande')} className="input">
                  <option value="stage">Demande de stage</option>
                  <option value="formation">Demande de formation</option>
                </select>
              </div>
              {form.natureDemande === 'formation' && (
                <div>
                  <label className="label">Formation du site (optionnel)</label>
                  <select {...inputProps('formationId')} className="input">
                    <option value="">-- Choisir une formation publiée --</option>
                    {formationsPubliques.map((f) => (
                      <option key={f.id} value={f.id}>
                        #{f.id} — {f.titre}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {form.natureDemande === 'stage' && (
                <>
              <div>
                <label className="label">Département souhaité *</label>
                <select
                  value={form.departementId}
                  onChange={e => set('departementId', e.target.value)}
                  className="input"
                  required
                >
                  <option value="">-- Choisir un département --</option>
                  {departements.map(d => (
                    <option key={d.id} value={d.id}>{d.nom}</option>
                  ))}
                </select>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Date de début souhaitée *</label>
                  <input {...inputProps('dateDebutStage')} type="date" />
                </div>
                <div>
                  <label className="label">Date de fin souhaitée *</label>
                  <input {...inputProps('dateFinStage')} type="date" />
                </div>
              </div>
              <div>
                <label className="label">Type de stage</label>
                <select {...inputProps('typeStage')} className="input">
                  {TYPES_STAGE.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
                </>
              )}
              <div>
                <label className="label">
                  {form.natureDemande === 'stage'
                    ? 'Demande de sujet / projet (optionnel)'
                    : 'Demande de formation / sujet (optionnel)'}
                </label>
                <textarea
                  value={form.sujetStage}
                  onChange={e => set('sujetStage', e.target.value)}
                  rows={3}
                  className="input resize-none"
                  placeholder={
                    form.natureDemande === 'stage'
                      ? 'Vous pouvez proposer votre sujet de stage ici (texte libre).'
                      : 'Vous pouvez détailler la formation/sujet demandé (texte libre).'
                  }
                />
                <p className="text-[11px] text-gray-500 mt-1">
                  Cette demande sera transmise au dossier et reprise dans les documents du workflow.
                </p>
              </div>
              <div>
                <label className="label">Lettre de motivation</label>
                <textarea
                  value={form.motivation}
                  onChange={e => set('motivation', e.target.value)}
                  rows={4}
                  className="input resize-none"
                  placeholder="Expliquez votre motivation et vos objectifs pour ce stage..."
                />
              </div>
            </div>
          )}

          {/* Étape 4 : Documents */}
          {step === 4 && (
            <div className="space-y-5 animate-fadeIn">
              <h2 className="text-lg font-bold text-gray-900 mb-5">📎 Documents</h2>

              {/* CV */}
              <div>
                <label className="label">CV (PDF / DOCX recommandés ; JPG / PNG possibles via OCR)</label>
                <label className="flex items-center gap-3 p-4 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-cni-blue hover:bg-blue-50 transition-colors">
                  <Upload size={20} className="text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      {cvFile ? cvFile.name : 'Cliquer pour uploader votre CV'}
                    </p>
                    <p className="text-xs text-gray-400">PDF, DOC, DOCX, JPG, PNG, WebP — max 10 MB</p>
                  </div>
                  <input type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp" className="hidden"
                    onChange={e => setCvFile(e.target.files?.[0] || null)} />
                </label>
              </div>

              {/* Lettre de motivation */}
              <div>
                <label className="label">Lettre de motivation (optionnel)</label>
                <label className="flex items-center gap-3 p-4 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-cni-blue hover:bg-blue-50 transition-colors">
                  <Upload size={20} className="text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      {lmFile ? lmFile.name : 'Uploader votre lettre de motivation'}
                    </p>
                    <p className="text-xs text-gray-400">PDF, DOC — max 10 MB</p>
                  </div>
                  <input type="file" accept=".pdf,.doc,.docx" className="hidden"
                    onChange={e => setLmFile(e.target.files?.[0] || null)} />
                </label>
              </div>

              {/* RGPD */}
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.rgpdConsenti}
                    onChange={e => set('rgpdConsenti', e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded text-cni-blue"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Consentement RGPD *</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      J'accepte que mes données personnelles soient traitées par CNI dans le cadre de ma candidature.
                      Vos données sont traitées conformément au RGPD et conservées selon la politique interne.
                    </p>
                  </div>
                </label>
              </div>

              {/* Récapitulatif */}
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs font-semibold text-gray-600 mb-2">📋 Récapitulatif :</p>
                <div className="grid grid-cols-2 gap-1 text-xs text-gray-500">
                  <span>Nom :</span><span className="font-medium text-gray-700">{form.prenom} {form.nom}</span>
                  <span>Email :</span><span className="font-medium text-gray-700">{form.email}</span>
                  <span>Type :</span><span className="font-medium text-gray-700">{form.natureDemande === 'stage' ? 'Stage' : 'Formation'}</span>
                  <span>Détail :</span><span className="font-medium text-gray-700">{form.natureDemande === 'stage' ? form.typeStage : (form.formationId ? `Formation #${form.formationId}` : 'Demande libre')}</span>
                  <span>Période :</span><span className="font-medium text-gray-700">{form.dateDebutStage && form.dateFinStage ? `${form.dateDebutStage} → ${form.dateFinStage}` : 'Non applicable'}</span>
                  <span>Demande sujet :</span><span className="font-medium text-gray-700">{form.sujetStage || 'Non renseignée'}</span>
                </div>
              </div>

              {/* OTP e-mail */}
              <div className="border border-amber-200 bg-amber-50/80 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-amber-900 font-semibold text-sm">
                  <ShieldCheck size={18} /> Vérification de votre e-mail
                </div>
                <p className="text-xs text-amber-800">
                  Un code à usage unique est obligatoire pour soumettre la candidature. Il est valide quelques minutes.
                </p>
                <div className="flex flex-wrap gap-2 items-center">
                  <button
                    type="button"
                    onClick={envoyerOtp}
                    disabled={otpLoading || !form.email}
                    className="btn-secondary text-xs py-2"
                  >
                    <Mail size={14} /> {otpSent ? 'Renvoyer un code' : 'Recevoir un code'}
                  </button>
                  {otpSent && <span className="text-xs text-amber-700">Code envoyé à {form.email}</span>}
                </div>
                <div className="flex flex-wrap gap-2 items-end">
                  <div className="flex-1 min-w-[140px]">
                    <label className="label text-xs">Code reçu</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={8}
                      value={otpCode}
                      onChange={e => setOtpCode(e.target.value.replace(/\D/g, ''))}
                      className="input text-sm"
                      placeholder="6 chiffres"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={verifierOtp}
                    disabled={otpLoading || !otpCode}
                    className="btn-primary text-xs py-2"
                  >
                    Valider le code
                  </button>
                </div>
                {otpToken && (
                  <p className="text-xs text-emerald-700 font-medium flex items-center gap-1">
                    <CheckCircle size={14} /> E-mail vérifié — vous pouvez envoyer le dossier.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
            <button
              onClick={() => setStep(s => s - 1)}
              disabled={step === 1}
              className="btn-secondary disabled:opacity-30"
            >
              ← Précédent
            </button>
            {step < 4 ? (
              <button onClick={() => setStep(s => s + 1)} className="btn-primary">
                Suivant →
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={loading || !otpToken} className="btn-primary disabled:opacity-50">
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <><Send size={16} /> Soumettre ma candidature</>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
