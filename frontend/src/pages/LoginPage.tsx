import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff, LogIn } from 'lucide-react';
import toast from 'react-hot-toast';
import BrandLogo from '../components/common/BrandLogo';
import { useAuthStore } from '../stores/authStore';
import { useLangStore } from '../stores/langStore';

const DEMO_ACCOUNTS = [
  { label: 'Direction RH', email: 'rh@cni.tn', password: 'password123', color: 'bg-purple-100 text-purple-700' },
  { label: 'Manager', email: 'manager.dev@cni.tn', password: 'password123', color: 'bg-blue-100 text-blue-700' },
  { label: 'Employe', email: 'ahmed@cni.tn', password: 'password123', color: 'bg-green-100 text-green-700' },
];

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, isLoading } = useAuthStore();
  const { lang, toggle } = useLangStore();
  const isAr = lang === 'ar';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error(isAr ? 'يرجى تعبئة جميع الحقول.' : 'Veuillez remplir tous les champs.');
      return;
    }
    try {
      await login(email, password);
      toast.success(isAr ? 'تم تسجيل الدخول بنجاح!' : 'Connexion réussie !');
      const role = useAuthStore.getState().user?.role;
      if (role === 'Direction_RH' || role === 'Manager' || role === 'Employe' || role === 'Formateur_Interne' || role === 'Formateur_Externe') {
        navigate('/app/dashboard');
      } else {
        navigate('/login');
      }
    } catch (err: any) {
      toast.error(err.message || (isAr ? 'خطأ في تسجيل الدخول' : 'Erreur de connexion'));
    }
  };

  const fillDemo = (acc: (typeof DEMO_ACCOUNTS)[0]) => {
    setEmail(acc.email);
    setPassword(acc.password);
    toast(isAr ? 'تم تعبئة الحساب' : 'Compte prérempli', { icon: '🔑' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="border-b border-white/10 px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
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

      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-white mb-2">{isAr ? 'تسجيل الدخول' : 'Connexion'}</h1>
          <p className="text-blue-200 text-sm">{isAr ? 'موظفو النظام فقط' : 'Accès réservé aux utilisateurs internes'}</p>
        </div>

        <div className="bg-white/95 backdrop-blur rounded-3xl shadow-2xl p-8 border border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">{isAr ? 'البريد الإلكتروني' : 'Adresse email'}</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="votre@email.tn" className="input" autoComplete="email" required />
            </div>
            <div>
              <label className="label">{isAr ? 'كلمة المرور' : 'Mot de passe'}</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input pr-10"
                  autoComplete="current-password"
                  required
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={isLoading} className="btn-primary w-full justify-center py-3 text-base">
              {isLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><LogIn size={18} />{isAr ? 'تسجيل الدخول' : 'Se connecter'}</>}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-100">
            <p className="text-xs text-gray-400 text-center mb-3 font-medium">{isAr ? 'حسابات سريعة' : 'Comptes rapides'}</p>
            <div className="grid grid-cols-3 gap-2">
              {DEMO_ACCOUNTS.map((acc) => (
                <button key={acc.email} onClick={() => fillDemo(acc)} className={`${acc.color} text-xs font-semibold px-2 py-1.5 rounded-lg hover:opacity-80 transition-opacity`}>
                  {acc.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 text-center text-sm text-gray-500">
            {isAr ? 'ليس لديك حساب؟ ' : 'Pas encore de compte ? '}
            <Link to="/register" className="text-cni-blue hover:underline font-medium">
              {isAr ? 'إنشاء حساب' : 'Créer un compte'}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

