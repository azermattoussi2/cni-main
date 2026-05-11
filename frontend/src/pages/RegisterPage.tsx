import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import BrandLogo from '../components/common/BrandLogo';
import { useLangStore } from '../stores/langStore';
import api from '../lib/api';

const ROLE_OPTIONS: { value: 'Employe' | 'Formateur_Externe'; label: string }[] = [
  { value: 'Employe', label: 'Employé / Formateur interne (même rôle)' },
  { value: 'Formateur_Externe', label: 'Formateur Externe' },
];

const STORAGE_KEY = 'pending-register';
type DepartementLite = { id: number; nom: string; code?: string };

export default function RegisterPage() {
  const navigate = useNavigate();
  const { lang, toggle } = useLangStore();
  const isAr = lang === 'ar';

  const [form, setForm] = useState({
    nom: '',
    prenom: '',
    email: '',
    password: '',
    role: 'Employe' as 'Employe' | 'Formateur_Externe',
    departementId: '',
    poste: '',
    telephone: '',
  });
  const [departements, setDepartements] = useState<DepartementLite[]>([]);

  useEffect(() => {
    api.get('/departements/public')
      .then((r) => setDepartements(r.data?.data || []))
      .catch(() => setDepartements([]));
  }, []);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!form.email.trim() || !form.password.trim()) {
      toast.error(isAr ? 'أكمل البيانات.' : 'Veuillez compléter les champs requis.');
      return;
    }
    if (!form.departementId) {
      toast.error(isAr ? 'اختر القسم.' : 'Veuillez sélectionner un département.');
      return;
    }
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(form));
    navigate('/register/otp');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="border-b border-white/10 px-4 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <button type="button" onClick={() => navigate('/')} className="flex items-center gap-2 text-white/80 hover:text-white text-sm">
            <ArrowLeft size={16} />
            {isAr ? 'العودة للرئيسية' : "Retour à l'accueil"}
          </button>
          <div className="flex items-center gap-2">
            <BrandLogo className="w-7 h-7" roundedClassName="rounded-lg bg-white p-0.5" />
            <span className="text-white font-bold text-sm">CNI - Stages & Formations</span>
          </div>
          <button type="button" onClick={toggle} className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-white/20 hover:bg-white/10 transition-colors text-white">
            {lang === 'fr' ? '🇹🇳 عربي' : '🇫🇷 Français'}
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-white mb-2">{isAr ? 'إنشاء حساب' : 'Créer un compte'}</h1>
          <p className="text-blue-200 text-sm">{isAr ? 'الخطوة 1: بيانات الحساب' : 'Étape 1: saisie des informations du compte'}</p>
        </div>

        <div className="w-full bg-white/95 backdrop-blur rounded-3xl p-8 shadow-2xl border border-gray-100">
          <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Nom</label>
              <input className="input" value={form.nom} onChange={(e) => setForm((s) => ({ ...s, nom: e.target.value }))} required />
            </div>
            <div>
              <label className="label">Prenom</label>
              <input className="input" value={form.prenom} onChange={(e) => setForm((s) => ({ ...s, prenom: e.target.value }))} required />
            </div>
            <div className="md:col-span-2">
              <label className="label">Email</label>
              <input type="email" className="input" value={form.email} onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))} required />
            </div>
            <div>
              <label className="label">Mot de passe</label>
              <input type="password" className="input" value={form.password} onChange={(e) => setForm((s) => ({ ...s, password: e.target.value }))} required />
            </div>
            <div>
              <label className="label">Role</label>
              <select className="input" value={form.role} onChange={(e) => setForm((s) => ({ ...s, role: e.target.value as 'Employe' | 'Formateur_Externe' }))}>
                {ROLE_OPTIONS.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="label">Département</label>
              <select
                className="input"
                value={form.departementId}
                onChange={(e) => setForm((s) => ({ ...s, departementId: e.target.value }))}
                required
              >
                <option value="">-- Sélectionner --</option>
                {departements.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.nom}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Telephone</label>
              <input className="input" value={form.telephone} onChange={(e) => setForm((s) => ({ ...s, telephone: e.target.value }))} />
            </div>
            <div>
              <label className="label">Poste</label>
              <input className="input" value={form.poste} onChange={(e) => setForm((s) => ({ ...s, poste: e.target.value }))} />
            </div>

            <div className="md:col-span-2 flex gap-3 mt-2">
              <button className="btn-primary" type="submit">{isAr ? 'التالي: OTP' : 'Continuer vers OTP'}</button>
              <Link to="/login" className="btn-secondary">{isAr ? 'العودة للدخول' : 'Retour connexion'}</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

