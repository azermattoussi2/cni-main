import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Mail, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { useAuthStore } from '../stores/authStore';
import { useLangStore } from '../stores/langStore';
import BrandLogo from '../components/common/BrandLogo';

type PendingRegisterPayload = {
  nom: string;
  prenom: string;
  email: string;
  password: string;
  role?: 'Employe' | 'Formateur_Externe';
  departementId?: number | string;
  telephone?: string;
  poste?: string;
};

const STORAGE_KEY = 'pending-register';

export default function RegisterOtpPage() {
  const navigate = useNavigate();
  const { register, isLoading } = useAuthStore();
  const { lang, toggle } = useLangStore();
  const isAr = lang === 'ar';

  const [otpCode, setOtpCode] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpToken, setOtpToken] = useState<string | null>(null);

  const pendingPayload = useMemo(() => {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as PendingRegisterPayload;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    if (!pendingPayload?.email) {
      toast.error(isAr ? 'ابدأ بالتسجيل أولاً.' : 'Commencez par le formulaire d’inscription.');
      navigate('/register', { replace: true });
      return;
    }
    void (async () => {
      setOtpLoading(true);
      try {
        await api.post('/auth/otp/register/request', { email: pendingPayload.email });
        setOtpSent(true);
        toast.success(isAr ? 'تم إرسال رمز OTP.' : 'Code OTP envoyé par e-mail.');
      } catch (e: any) {
        toast.error(e.response?.data?.message || (isAr ? 'فشل إرسال الرمز.' : 'Échec envoi OTP.'));
      } finally {
        setOtpLoading(false);
      }
    })();
  }, [isAr, navigate, pendingPayload]);

  const resend = async () => {
    if (!pendingPayload?.email) return;
    setOtpLoading(true);
    try {
      await api.post('/auth/otp/register/request', { email: pendingPayload.email });
      setOtpSent(true);
      toast.success(isAr ? 'تمت إعادة الإرسال.' : 'Code renvoyé.');
    } catch (e: any) {
      toast.error(e.response?.data?.message || (isAr ? 'فشل الإرسال.' : 'Envoi impossible.'));
    } finally {
      setOtpLoading(false);
    }
  };

  const verify = async () => {
    if (!pendingPayload?.email) return;
    if (otpCode.trim().length < 4) {
      toast.error(isAr ? 'رمز غير صالح.' : 'Code invalide.');
      return;
    }
    setOtpLoading(true);
    try {
      const r = await api.post('/auth/otp/register/verify', {
        email: pendingPayload.email,
        code: otpCode.trim(),
      });
      const token = r.data?.data?.otpVerificationToken as string | undefined;
      if (!token) throw new Error('missing token');
      setOtpToken(token);
      toast.success(isAr ? 'تم التحقق بنجاح.' : 'OTP validé.');
    } catch (e: any) {
      toast.error(e.response?.data?.message || (isAr ? 'رمز خاطئ.' : 'Code OTP incorrect.'));
    } finally {
      setOtpLoading(false);
    }
  };

  const finalizeRegister = async () => {
    if (!pendingPayload || !otpToken) return;
    try {
      const role = pendingPayload.role === 'Formateur_Externe' ? 'Formateur_Externe' : 'Employe';
      const departementId = Number(pendingPayload.departementId);
      if (!Number.isFinite(departementId) || departementId <= 0) {
        throw new Error(isAr ? 'القسم غير صالح.' : 'Département invalide.');
      }
      await register({
        ...pendingPayload,
        role,
        departementId,
        otpVerificationToken: otpToken,
      });
      sessionStorage.removeItem(STORAGE_KEY);
      toast.success(
        isAr
          ? 'تم إنشاء الحساب وهو في انتظار الموافقة.'
          : 'Compte créé. Il est en attente de validation RH/manager.'
      );
      navigate('/login', { replace: true });
    } catch (e: any) {
      toast.error(e.message || (isAr ? 'فشل إنشاء الحساب.' : 'Échec de création du compte.'));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="border-b border-white/10 px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate('/register')}
            className="flex items-center gap-2 text-white/80 hover:text-white text-sm"
          >
            <ArrowLeft size={16} />
            {isAr ? 'الرجوع للتسجيل' : "Retour à l'inscription"}
          </button>
          <div className="flex items-center gap-2">
            <BrandLogo className="w-7 h-7" roundedClassName="rounded-lg bg-white p-0.5" />
            <span className="text-white font-bold text-sm">CNI - Stages & Formations</span>
          </div>
          <button
            type="button"
            onClick={toggle}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-white/20 hover:bg-white/10 transition-colors text-white"
          >
            {lang === 'fr' ? '🇹🇳 عربي' : '🇫🇷 Français'}
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-white mb-2">{isAr ? 'التحقق OTP' : 'Vérification OTP'}</h1>
          <p className="text-blue-200 text-sm">
            {isAr ? 'الخطوة 2: تحقق البريد ثم انتظار الموافقة' : 'Étape 2: validez votre e-mail puis attendez la validation RH/manager'}
          </p>
        </div>

        <div className="w-full bg-white/95 backdrop-blur rounded-3xl p-8 shadow-2xl border border-gray-100">
          <div className="border border-amber-200 bg-amber-50/90 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-amber-900 font-semibold text-sm">
              <ShieldCheck size={18} /> {isAr ? 'رمز التحقق' : 'Code de vérification'}
            </div>
            <p className="text-xs text-amber-800">
              {isAr ? 'تم إرسال الرمز إلى:' : 'Le code a été envoyé à:'} <strong>{pendingPayload?.email || '—'}</strong>
            </p>
            <div className="flex flex-wrap gap-2 items-end">
              <div className="flex-1 min-w-[120px]">
                <label className="label text-xs">Code OTP</label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={8}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  className="input text-sm"
                  placeholder="6 chiffres"
                />
              </div>
              <button type="button" onClick={verify} disabled={otpLoading || !otpCode} className="btn-primary text-xs py-2">
                {isAr ? 'تحقق' : 'Valider le code'}
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={resend} disabled={otpLoading || !pendingPayload?.email} className="btn-secondary text-xs py-2">
                <Mail size={14} /> {otpSent ? (isAr ? 'إعادة الإرسال' : 'Renvoyer le code') : (isAr ? 'إرسال الرمز' : 'Envoyer le code')}
              </button>
            </div>
            {otpToken && (
              <p className="text-xs text-emerald-700 font-medium flex items-center gap-1">
                <CheckCircle size={14} /> {isAr ? 'تم التحقق من البريد.' : 'E-mail vérifié.'}
              </p>
            )}
          </div>

          <div className="mt-6 flex gap-3">
            <button className="btn-primary" type="button" disabled={isLoading || !otpToken} onClick={finalizeRegister}>
              {isLoading ? (isAr ? 'جاري الإنشاء...' : 'Création...') : (isAr ? 'إتمام التسجيل' : "Finaliser l'inscription")}
            </button>
            <Link to="/register" className="btn-secondary">
              {isAr ? 'رجوع' : 'Retour'}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

