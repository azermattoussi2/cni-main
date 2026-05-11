import { useNavigate } from 'react-router-dom';
import { useLangStore } from '../stores/langStore';
import { useEffect, useRef, useState } from 'react';
import {
  GraduationCap, BookOpen, Users, BarChart3, ArrowRight,
  CheckCircle, Star, Clock, Shield, Zap, TrendingUp,
  Mail, Phone, MapPin, ChevronRight, Play, Pause
} from 'lucide-react';
import BrandLogo from '../components/common/BrandLogo';

// ---- Données statiques ----
const MODULES = [
  {
    icon: GraduationCap,
    titleFr: 'Gestion des Stages',
    titleAr: 'إدارة التدريب',
    descFr: 'Candidatures en ligne, processus de validation multi-niveaux, suivi en temps réel, convention PDF et attestations automatiques.',
    descAr: 'طلبات الالتحاق عبر الإنترنت، سير عمل متعدد المستويات، متابعة في الوقت الفعلي، اتفاقية PDF وشهادات تلقائية.',
    color: 'from-blue-500 to-blue-700',
    accent: '#3b82f6',
    features: ['Analyse automatique des CV', 'Signature électronique', 'Rappels automatiques'],
  },
  {
    icon: BookOpen,
    titleFr: 'Gestion des Formations',
    titleAr: 'إدارة التكوين',
    descFr: 'Catalogue interactif, inscriptions avec validation manager + RH, suivi budgétaire et certificats automatiques.',
    descAr: 'كتالوج تفاعلي، تسجيلات مع موافقة المدير والموارد البشرية، متابعة الميزانية وشهادات تلقائية.',
    color: 'from-emerald-500 to-emerald-700',
    accent: '#10b981',
    features: ['Alertes budget 60/80/90%', 'Questionnaire satisfaction', 'Calendrier intégré'],
  },
  {
    icon: Users,
    titleFr: 'Gestion des Formateurs',
    titleAr: 'إدارة المدربين',
    descFr: 'Répertoire formateurs internes et externes, algorithme de matching automatique, système de compensation et badges.',
    descAr: 'دليل المدربين الداخليين والخارجيين، خوارزمية التوافق التلقائي، نظام التعويض والشارات.',
    color: 'from-orange-500 to-orange-700',
    accent: '#f97316',
    features: ['Affectation automatique', 'Badges de progression', 'Espace formateur'],
  },
  {
    icon: BarChart3,
    titleFr: 'Rapports et Analyses',
    titleAr: 'التقارير والتحليلات',
    descFr: 'Tableaux de bord interactifs par rôle, indicateurs en temps réel, rapports automatiques hebdomadaires et mensuels.',
    descAr: 'لوحات تحكم تفاعلية مخصصة حسب الدور، مؤشرات الأداء في الوقت الفعلي، تقارير أسبوعية وشهرية تلقائية.',
    color: 'from-purple-500 to-purple-700',
    accent: '#a855f7',
    features: ['Graphiques interactifs', 'Export PDF/Excel', 'Alertes intelligentes'],
  },
];

const STATS = [
  { value: '70%', labelFr: 'Tâches automatisées', labelAr: 'مهام مؤتمتة', icon: Zap },
  { value: '5j→24h', labelFr: 'Délai traitement', labelAr: 'وقت المعالجة', icon: Clock },
  { value: '4.8/5', labelFr: 'Satisfaction', labelAr: 'رضا المستخدمين', icon: Star },
  { value: '100%', labelFr: 'Notifications auto', labelAr: 'إشعارات تلقائية', icon: CheckCircle },
];

const TESTIMONIALS = [
  {
    name: 'Fatma Mansouri', role: 'Directrice RH, CNI',
    textFr: 'La gestion des stages est désormais fluide et transparente pour toute l\'équipe. Un vrai gain de productivité.',
    textAr: 'أصبحت إدارة التدريب أكثر سلاسة وشفافية للفريق بأكمله. مكسب حقيقي في الإنتاجية.',
    rating: 5, avatar: 'FM', color: 'from-blue-500 to-blue-700',
  },
  {
    name: 'Karim Ben Salem', role: 'Chef de Département Dev',
    textFr: 'Le tableau de bord manager me permet de valider les demandes en quelques clics, depuis n\'importe où.',
    textAr: 'تتيح لي لوحة تحكم المدير التحقق من الطلبات بنقرات قليلة، من أي مكان.',
    rating: 5, avatar: 'KB', color: 'from-emerald-500 to-emerald-700',
  },
  {
    name: 'Sara Ben Amor', role: 'Stagiaire PFE, ESPRIT',
    textFr: 'La candidature est simple et intuitive. Je reçois un suivi clair à chaque étape de mon dossier.',
    textAr: 'التقديم بسيط وبديهي. أتلقى متابعة واضحة في كل خطوة من خطوات ملفي.',
    rating: 5, avatar: 'SB', color: 'from-orange-500 to-orange-700',
  },
];

const BENEFITS = [
  { icon: TrendingUp, titleFr: 'Gain de temps', titleAr: 'ربح الوقت', descFr: 'Automatisation de 70% des tâches répétitives', descAr: 'أتمتة 70% من المهام المتكررة', color: 'text-blue-500', bg: 'bg-blue-50' },
  { icon: Shield, titleFr: 'Traçabilité totale', titleAr: 'إمكانية التتبع الكاملة', descFr: 'Historique complet de toutes les actions', descAr: 'سجل كامل لجميع الإجراءات', color: 'text-emerald-500', bg: 'bg-emerald-50' },
  { icon: BarChart3, titleFr: 'Visibilité en direct', titleAr: 'رؤية فورية', descFr: 'Tableaux de bord temps réel pour la direction', descAr: 'لوحات تحكم في الوقت الفعلي للإدارة', color: 'text-purple-500', bg: 'bg-purple-50' },
  { icon: CheckCircle, titleFr: 'Conformité RGPD', titleAr: 'الامتثال للمعايير', descFr: 'Respect des obligations légales en vigueur', descAr: 'الامتثال للالتزامات القانونية المعمول بها', color: 'text-orange-500', bg: 'bg-orange-50' },
];

const PROCESS_STEPS = [
  { step: '01', titleFr: 'Soumission', titleAr: 'تقديم الطلب', descFr: 'L\'employé ou candidat remplit le formulaire en ligne', descAr: 'الموظف أو المتدرب يملأ النموذج عبر الإنترنت', color: 'bg-blue-500', light: 'bg-blue-50 text-blue-600' },
  { step: '02', titleFr: 'Vérification auto', titleAr: 'التحقق التلقائي', descFr: 'Le système vérifie budget et places disponibles', descAr: 'النظام يتحقق من الميزانية والأماكن المتاحة', color: 'bg-emerald-500', light: 'bg-emerald-50 text-emerald-600' },
  { step: '03', titleFr: 'Validation multi-niveaux', titleAr: 'المصادقة متعددة المستويات', descFr: 'Manager puis RH valident la demande', descAr: 'المدير ثم الموارد البشرية يعتمدان الطلب', color: 'bg-orange-500', light: 'bg-orange-50 text-orange-600' },
  { step: '04', titleFr: 'Exécution automatique', titleAr: 'التنفيذ التلقائي', descFr: 'Confirmation, calendrier et PDF générés automatiquement', descAr: 'إرسال التأكيد وتحديث التقويم والوثائق PDF', color: 'bg-purple-500', light: 'bg-purple-50 text-purple-600' },
];

// ============================================
// COMPOSANT PRINCIPAL
// ============================================
export default function LandingPage() {
  const navigate = useNavigate();
  const { lang, toggle } = useLangStore();
  const isAr = lang === 'ar';
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoPlaying, setVideoPlaying] = useState(true);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const toggleVideo = () => {
    if (!videoRef.current) return;
    if (videoPlaying) {
      videoRef.current.pause();
      setVideoPlaying(false);
    } else {
      videoRef.current.play();
      setVideoPlaying(true);
    }
  };

  return (
    <div
      className={`min-h-screen bg-[#f8f9fc] ${isAr ? 'font-arabic' : ''}`}
      dir={isAr ? 'rtl' : 'ltr'}
      style={{ fontFamily: isAr ? 'inherit' : "'Plus Jakarta Sans', 'Outfit', sans-serif" }}
    >
      {/* Google Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&family=Outfit:wght@300;400;500;600;700;800;900&display=swap');

        * { font-family: 'Plus Jakarta Sans', 'Outfit', sans-serif; }

        .hero-video-bg {
          position: absolute; inset: 0; width: 100%; height: 100%;
          object-fit: cover; z-index: 0;
        }
        .hero-overlay {
          position: absolute; inset: 0; z-index: 1;
          background: linear-gradient(
            135deg,
            rgba(3,7,28,0.88) 0%,
            rgba(10,20,60,0.82) 40%,
            rgba(15,30,80,0.70) 70%,
            rgba(3,7,28,0.75) 100%
          );
        }
        .hero-overlay-bottom {
          position: absolute; bottom: 0; left: 0; right: 0;
          height: 180px; z-index: 2;
          background: linear-gradient(to bottom, transparent, #f8f9fc);
        }

        /* Noise texture overlay */
        .hero-noise::after {
          content: '';
          position: absolute; inset: 0; z-index: 2;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
          pointer-events: none;
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; } to { opacity: 1; }
        }
        @keyframes pulse-ring {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(1.5); opacity: 0; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }

        .anim-fadeup { animation: fadeUp 0.7s ease forwards; opacity: 0; }
        .anim-fadeup-d1 { animation-delay: 0.1s; }
        .anim-fadeup-d2 { animation-delay: 0.25s; }
        .anim-fadeup-d3 { animation-delay: 0.4s; }
        .anim-fadeup-d4 { animation-delay: 0.55s; }
        .anim-fadein { animation: fadeIn 1s ease forwards; opacity: 0; }

        .badge-shine {
          background: linear-gradient(90deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.18) 40%, rgba(255,255,255,0.08) 80%);
          background-size: 200% auto;
          animation: shimmer 3s linear infinite;
        }

        .stat-card {
          background: white;
          border: 1px solid rgba(0,0,0,0.06);
          border-radius: 20px;
          padding: 28px 20px;
          text-align: center;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }
        .stat-card::before {
          content: '';
          position: absolute; top: 0; left: 0; right: 0; height: 3px;
          background: linear-gradient(90deg, #3b82f6, #8b5cf6, #f97316);
          opacity: 0;
          transition: opacity 0.3s;
        }
        .stat-card:hover { transform: translateY(-4px); box-shadow: 0 16px 40px rgba(0,0,0,0.1); }
        .stat-card:hover::before { opacity: 1; }

        .module-card {
          background: white;
          border: 1px solid rgba(0,0,0,0.06);
          border-radius: 24px;
          padding: 28px;
          transition: all 0.35s ease;
          cursor: default;
          position: relative;
          overflow: hidden;
        }
        .module-card::after {
          content: '';
          position: absolute; inset: 0;
          background: linear-gradient(135deg, transparent 60%, rgba(255,255,255,0.03) 100%);
          pointer-events: none;
        }
        .module-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 24px 60px rgba(0,0,0,0.12);
          border-color: transparent;
        }

        .testi-card {
          background: rgba(255,255,255,0.06);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 24px;
          padding: 28px;
          transition: all 0.3s ease;
        }
        .testi-card:hover {
          background: rgba(255,255,255,0.1);
          transform: translateY(-4px);
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        }

        .btn-primary-hero {
          display: inline-flex; align-items: center; gap: 10px;
          background: linear-gradient(135deg, #f97316, #ea580c);
          color: white; font-weight: 800; font-size: 15px;
          padding: 14px 28px; border-radius: 14px;
          border: none; cursor: pointer;
          box-shadow: 0 8px 24px rgba(249,115,22,0.4);
          transition: all 0.25s ease;
          letter-spacing: -0.2px;
        }
        .btn-primary-hero:hover {
          transform: translateY(-2px);
          box-shadow: 0 14px 32px rgba(249,115,22,0.5);
          background: linear-gradient(135deg, #fb923c, #f97316);
        }

        .btn-ghost-hero {
          display: inline-flex; align-items: center; gap: 10px;
          background: rgba(255,255,255,0.1);
          color: white; font-weight: 600; font-size: 15px;
          padding: 14px 28px; border-radius: 14px;
          border: 1.5px solid rgba(255,255,255,0.2); cursor: pointer;
          backdrop-filter: blur(8px);
          transition: all 0.25s ease;
        }
        .btn-ghost-hero:hover {
          background: rgba(255,255,255,0.18);
          border-color: rgba(255,255,255,0.35);
          transform: translateY(-2px);
        }

        .nav-scrolled {
          box-shadow: 0 2px 20px rgba(0,0,0,0.08);
          background: rgba(255,255,255,0.98) !important;
        }

        .section-tag {
          display: inline-flex; align-items: center; gap: 6px;
          font-size: 11px; font-weight: 700; letter-spacing: 1.5px;
          text-transform: uppercase;
          padding: 6px 14px; border-radius: 100px;
          margin-bottom: 16px;
        }

        .process-line {
          position: absolute;
          top: 20px; left: 20px; bottom: 0;
          width: 2px;
          background: linear-gradient(to bottom, #e2e8f0, transparent);
        }

        .benefit-card {
          display: flex; gap: 16px; align-items: flex-start;
          padding: 20px; border-radius: 18px;
          background: white;
          border: 1px solid rgba(0,0,0,0.05);
          transition: all 0.3s ease;
        }
        .benefit-card:hover {
          transform: translateX(6px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.08);
        }

        .video-play-btn {
          position: absolute; bottom: 40px; right: 40px; z-index: 10;
          width: 48px; height: 48px; border-radius: 50%;
          background: rgba(255,255,255,0.15);
          border: 1.5px solid rgba(255,255,255,0.3);
          backdrop-filter: blur(8px);
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: all 0.25s ease; color: white;
        }
        .video-play-btn:hover {
          background: rgba(255,255,255,0.25);
          transform: scale(1.1);
        }

        .floating-badge {
          position: absolute; z-index: 5;
          background: white;
          border-radius: 16px;
          padding: 12px 16px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.15);
          animation: float 4s ease-in-out infinite;
        }

        .cta-section {
          background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 50%, #1d4ed8 100%);
          position: relative; overflow: hidden;
        }
        .cta-section::before {
          content: '';
          position: absolute; top: -50%; right: -20%;
          width: 600px; height: 600px;
          background: radial-gradient(circle, rgba(249,115,22,0.2) 0%, transparent 70%);
        }
        .cta-section::after {
          content: '';
          position: absolute; bottom: -40%; left: -10%;
          width: 400px; height: 400px;
          background: radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%);
        }

        .mini-stat { display: flex; flex-direction: column; }
        .mini-stat-val {
          font-size: 28px; font-weight: 900; color: white;
          line-height: 1; letter-spacing: -1px;
        }
        .mini-stat-label { font-size: 11px; color: rgba(147,197,253,0.9); margin-top: 4px; font-weight: 500; }

        .divider { width: 40px; height: 3px; background: linear-gradient(90deg, #3b82f6, #8b5cf6); border-radius: 2px; margin: 16px 0; }
      `}</style>

      {/* ====== NAVBAR ====== */}
      <nav
        className={`sticky top-0 z-50 transition-all duration-300 ${scrolled ? 'nav-scrolled' : 'bg-white/0'}`}
        style={{ borderBottom: scrolled ? '1px solid rgba(0,0,0,0.06)' : 'none' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BrandLogo className="w-9 h-9" />
            <div>
              <span className="text-base font-bold text-gray-900">CNI</span>
              <span className="text-xs text-gray-400 ms-1.5 hidden sm:inline font-medium">Stages & Formations</span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-7 text-sm font-600 text-gray-500">
            {[
              { href: '#modules', fr: 'Modules', ar: 'الوحدات' },
              { href: '#avantages', fr: 'Avantages', ar: 'المزايا' },
              { href: '#temoignages', fr: 'Témoignages', ar: 'آراء المستخدمين' },
              { href: '#contact', fr: 'Contact', ar: 'الاتصال' },
            ].map(link => (
              <a
                key={link.href}
                href={link.href}
                className="hover:text-blue-600 transition-colors font-semibold"
                style={{ fontSize: 13 }}
              >
                {isAr ? link.ar : link.fr}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={toggle}
              className="px-3 py-1.5 text-xs font-bold rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-gray-600"
            >
              {lang === 'fr' ? '🇹🇳 عربي' : '🇫🇷 Français'}
            </button>
            <button
              onClick={() => navigate('/login')}
              className="text-sm font-semibold text-blue-600 hover:text-blue-700 hidden sm:block px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
            >
              {isAr ? 'تسجيل الدخول' : 'Se connecter'}
            </button>
            <button
              onClick={() => navigate('/candidature')}
              className="hidden sm:flex items-center gap-1.5 text-sm font-bold px-4 py-2 rounded-xl text-white transition-all duration-200"
              style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)', boxShadow: '0 4px 14px rgba(249,115,22,0.35)' }}
            >
              <GraduationCap size={14} />
              {isAr ? 'تقديم طلب' : 'Candidature'}
            </button>
          </div>
        </div>
      </nav>

      {/* ====== HERO WITH VIDEO ====== */}
      <section className="relative min-h-screen flex items-center hero-noise" style={{ minHeight: '100svh' }}>
        {/* Video background */}
        <video
          ref={videoRef}
          className="hero-video-bg"
          src="/cover.mp4"
          autoPlay
          loop
          muted
          playsInline
        />

        {/* Overlay */}
        <div className="hero-overlay" />

        <div className="hero-overlay-bottom" />

       
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-0 w-full">
          <div className="max-w-3xl">
            <div
              className="badge-shine anim-fadeup anim-fadeup-d1 inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8"
              style={{ border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(186,230,253,1)', fontSize: 12, fontWeight: 700, letterSpacing: '0.5px' }}
            >
              <Zap size={12} />
              {isAr ? 'منصة إدارة موحدة — المركز الوطني للإعلامية' : 'Plateforme unifiée — Centre National de l\'Informatique'}
            </div>

            <h1
              className="anim-fadeup anim-fadeup-d2 font-black text-white leading-tight mb-6"
              style={{ fontSize: 'clamp(38px, 6vw, 68px)', letterSpacing: '-2px', lineHeight: 1.05 }}
            >
              {isAr ? (
                <>
                  إدارة{' '}
                  <span style={{ color: '#fb923c' }}>التدريب</span>
                  {' '}والتكوين
                  <br />
                  <span style={{ color: 'rgba(147,197,253,0.9)' }}>بذكاء واحترافية</span>
                </>
              ) : (
                <>
                  Gérer les{' '}
                  <span style={{ color: '#fb923c' }}>Stages</span>
                  {' '}&{' '}
                  <span style={{ color: '#fb923c' }}>Formations</span>
                  <br />
                  <span style={{ color: 'rgba(147,197,253,0.9)' }}>avec intelligence</span>
                </>
              )}
            </h1>

            <p
              className="anim-fadeup anim-fadeup-d3 mb-10"
              style={{ fontSize: 17, color: 'rgba(186,230,253,0.85)', lineHeight: 1.7, maxWidth: 560, fontWeight: 400 }}
            >
              {isAr
                ? 'منصة متكاملة وحديثة تُؤتمت دورة حياة الطلبات، تُرشّد الموافقات، وتمنح الإدارة رؤية كاملة في الوقت الفعلي.'
                : 'Une plateforme qui automatise le cycle de vie des demandes, fluidifie les validations, et offre une visibilité complète en temps réel.'}
            </p>

            <div className="anim-fadeup anim-fadeup-d4 flex flex-wrap gap-3 mb-14">
              <button onClick={() => navigate('/login')} className="btn-primary-hero">
                {isAr ? 'الدخول إلى التطبيق' : "Accéder à l'application"}
                <ArrowRight size={16} />
              </button>
              <button onClick={() => navigate('/candidature')} className="btn-ghost-hero">
                <GraduationCap size={16} />
                {isAr ? 'تقديم طلب تدريب' : 'Candidater un stage'}
              </button>
            </div>

            <div className="anim-fadeup flex gap-10 pb-16" style={{ animationDelay: '0.65s', opacity: 0 }}>
              {[
                { val: '17', label: isAr ? 'مسار آلي' : 'Processus auto' },
                { val: '6', label: isAr ? 'أدوار مستخدمين' : 'Rôles utilisateurs' },
                { val: '4', label: isAr ? 'وحدات وظيفية' : 'Modules intégrés' },
              ].map((s, i) => (
                <div key={i} className="mini-stat">
                  <span className="mini-stat-val">{s.val}</span>
                  <span className="mini-stat-label">{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <button className="video-play-btn" onClick={toggleVideo}>
          {videoPlaying ? <Pause size={18} /> : <Play size={18} />}
        </button>

        <div
          className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-1"
          style={{ color: 'rgba(255,255,255,0.4)' }}
        >
          <div
            style={{
              width: 24, height: 38, borderRadius: 12,
              border: '2px solid rgba(255,255,255,0.2)',
              display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
              padding: '5px 0',
            }}
          >
            <div
              style={{
                width: 4, height: 8, background: 'rgba(255,255,255,0.5)',
                borderRadius: 2, animation: 'float 1.8s ease-in-out infinite',
              }}
            />
          </div>
        </div>
      </section>

      <section className="py-14 bg-[#f8f9fc]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            {STATS.map((stat, i) => (
              <div key={stat.value} className="stat-card">
                <div className="flex justify-center mb-3">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg, #eff6ff, #dbeafe)' }}
                  >
                    <stat.icon size={20} style={{ color: '#2563eb' }} />
                  </div>
                </div>
                <div
                  className="font-black mb-1"
                  style={{ fontSize: 28, color: '#1e3a8a', letterSpacing: '-1px' }}
                >
                  {stat.value}
                </div>
                <div style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>
                  {isAr ? stat.labelAr : stat.labelFr}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ====== MODULES ====== */}
      <section id="modules" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <div
              className="section-tag"
              style={{ background: '#eff6ff', color: '#1d4ed8' }}
            >
              <BookOpen size={11} />
              {isAr ? 'الوحدات' : 'Modules'}
            </div>
            <h2
              className="font-black text-gray-900 mb-4"
              style={{ fontSize: 'clamp(26px, 4vw, 40px)', letterSpacing: '-1px' }}
            >
              {isAr ? '٤ وحدات وظيفية متكاملة' : '4 Modules fonctionnels intégrés'}
            </h2>
            <p style={{ color: '#64748b', maxWidth: 480, margin: '0 auto', fontSize: 15, lineHeight: 1.6 }}>
              {isAr
                ? 'وحدات مترابطة تُبسّط العمل اليومي وتُعطي رؤية شاملة للمؤسسة.'
                : 'Des modules connectés pour simplifier le travail quotidien et donner une vision globale.'}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {MODULES.map((mod) => (
              <div
                key={mod.titleFr}
                className="module-card group"
              >
                <div
                  className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${mod.color} flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-110`}
                  style={{ boxShadow: `0 8px 20px ${mod.accent}40` }}
                >
                  <mod.icon size={22} className="text-white" />
                </div>
                <h3
                  className="font-bold text-gray-900 mb-2"
                  style={{ fontSize: 15, letterSpacing: '-0.3px' }}
                >
                  {isAr ? mod.titleAr : mod.titleFr}
                </h3>
                <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.65, marginBottom: 16 }}>
                  {isAr ? mod.descAr : mod.descFr}
                </p>
                <div className="pt-4" style={{ borderTop: '1px solid #f1f5f9' }}>
                  {mod.features.map((f) => (
                    <div
                      key={f}
                      className="flex items-center gap-2 mb-2"
                      style={{ fontSize: 12, color: '#475569' }}
                    >
                      <div
                        className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ background: `${mod.accent}15` }}
                      >
                        <CheckCircle size={10} style={{ color: mod.accent }} />
                      </div>
                      {f}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ====== AVANTAGES ====== */}
      <section id="avantages" className="py-20" style={{ background: '#f8f9fc' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            {/* Left */}
            <div>
              <div
                className="section-tag"
                style={{ background: '#fef3c7', color: '#d97706' }}
              >
                <TrendingUp size={11} />
                {isAr ? 'لماذا هذا النظام؟' : 'Pourquoi ce système ?'}
              </div>
              <h2
                className="font-black text-gray-900 mb-4"
                style={{ fontSize: 'clamp(26px, 3.5vw, 38px)', letterSpacing: '-1px' }}
              >
                {isAr ? 'أتمتة ذكية، رؤية كاملة' : 'Automatisation intelligente,\nvisibilité complète'}
              </h2>
              <div className="divider" />
              <p style={{ color: '#64748b', marginBottom: 28, fontSize: 15, lineHeight: 1.7 }}>
                {isAr
                  ? 'المركز الوطني للإعلامية يتبنى حلاً حديثاً يُلغي العمليات اليدوية ويوفر رؤية شاملة لجميع المستويات الإدارية.'
                  : 'CNI adopte une solution moderne qui élimine les processus manuels et offre une visibilité à tous les niveaux hiérarchiques.'}
              </p>
              <div className="space-y-3">
                {BENEFITS.map((b) => (
                  <div key={b.titleFr} className="benefit-card">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${b.bg}`}
                    >
                      <b.icon size={18} className={b.color} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: '#1e293b', marginBottom: 2 }}>
                        {isAr ? b.titleAr : b.titleFr}
                      </div>
                      <div style={{ fontSize: 12.5, color: '#64748b' }}>
                        {isAr ? b.descAr : b.descFr}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: process */}
            <div>
              <h3
                className="font-bold text-gray-800 mb-8"
                style={{ fontSize: 18, letterSpacing: '-0.5px' }}
              >
                {isAr ? 'كيف يعمل النظام؟' : 'Comment ça fonctionne ?'}
              </h3>
              <div className="space-y-2">
                {PROCESS_STEPS.map((s, i) => (
                  <div
                    key={i}
                    className="flex gap-4 items-start p-5 rounded-2xl bg-white transition-all duration-300 hover:shadow-lg"
                    style={{ border: '1px solid rgba(0,0,0,0.05)' }}
                  >
                    <div
                      className={`${s.color} text-white text-xs font-black w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0`}
                      style={{ letterSpacing: '-0.5px' }}
                    >
                      {s.step}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: '#1e293b', marginBottom: 4 }}>
                        {isAr ? s.titleAr : s.titleFr}
                      </div>
                      <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5 }}>
                        {isAr ? s.descAr : s.descFr}
                      </div>
                    </div>
                    <div className={`${s.light} text-xs font-bold px-2.5 py-1 rounded-lg ms-auto flex-shrink-0`}>
                      {s.step}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====== TÉMOIGNAGES ====== */}
      <section
        id="temoignages"
        className="py-20"
        style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #0f172a 100%)' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <div
              className="section-tag inline-flex"
              style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(186,230,253,0.9)', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              <Star size={11} />
              {isAr ? 'آراء المستخدمين' : 'Témoignages'}
            </div>
            <h2
              className="font-black text-white"
              style={{ fontSize: 'clamp(26px, 4vw, 40px)', letterSpacing: '-1px' }}
            >
              {isAr ? 'ماذا يقول المستخدمون؟' : 'Ils utilisent la plateforme'}
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="testi-card">
                <div className="flex gap-0.5 mb-5">
                  {Array(t.rating).fill(0).map((_, i) => (
                    <Star key={i} size={13} style={{ color: '#fbbf24', fill: '#fbbf24' }} />
                  ))}
                </div>
                <p style={{ color: 'rgba(186,230,253,0.85)', fontSize: 14, lineHeight: 1.75, marginBottom: 24 }}>
                  "{isAr ? t.textAr : t.textFr}"
                </p>
                <div className="flex items-center gap-3 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                  <div
                    className={`w-10 h-10 rounded-full bg-gradient-to-br ${t.color} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}
                  >
                    {t.avatar}
                  </div>
                  <div>
                    <div style={{ color: 'white', fontWeight: 700, fontSize: 13 }}>{t.name}</div>
                    <div style={{ color: 'rgba(147,197,253,0.7)', fontSize: 11, marginTop: 1 }}>{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ====== CTA ====== */}
      <section className="cta-section py-20">
        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <div
            className="section-tag inline-flex"
            style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(186,230,253,0.9)', border: '1px solid rgba(255,255,255,0.15)' }}
          >
            <Zap size={11} />
            {isAr ? 'ابدأ الآن' : 'Commencer'}
          </div>
          <h2
            className="font-black text-white mb-4"
            style={{ fontSize: 'clamp(28px, 4vw, 44px)', letterSpacing: '-1.5px' }}
          >
            {isAr ? 'هل أنت مستعد للبدء؟' : 'Prêt à transformer votre gestion ?'}
          </h2>
          <p style={{ color: 'rgba(186,230,253,0.8)', marginBottom: 36, fontSize: 16 }}>
            {isAr
              ? 'سجّل الدخول أو قدّم طلب تدريب الآن — المنصة جاهزة لاستقبالك.'
              : 'Connectez-vous ou soumettez une candidature de stage dès maintenant.'}
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <button
              onClick={() => navigate('/login')}
              className="flex items-center gap-2 font-bold px-8 py-3.5 rounded-2xl transition-all duration-200"
              style={{
                background: 'white',
                color: '#1e3a8a',
                fontSize: 15,
                boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
              }}
              onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              {isAr ? 'تسجيل الدخول' : 'Se connecter'}
              <ChevronRight size={16} />
            </button>
            <button
              onClick={() => navigate('/candidature')}
              className="flex items-center gap-2 font-semibold px-8 py-3.5 rounded-2xl transition-all duration-200"
              style={{
                background: 'rgba(249,115,22,0.9)',
                color: 'white',
                fontSize: 15,
                border: '1.5px solid rgba(249,115,22,0.5)',
                boxShadow: '0 8px 24px rgba(249,115,22,0.3)',
              }}
              onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <GraduationCap size={16} />
              {isAr ? 'طلب تدريب' : 'Candidature stage'}
            </button>
          </div>
        </div>
      </section>

      {/* ====== FOOTER ====== */}
      <footer id="contact" style={{ background: '#0a0f1e', color: '#64748b' }} className="py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-10 mb-10">
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <BrandLogo className="w-8 h-8" />
                <span className="text-white font-bold text-base">CNI</span>
              </div>
              <p style={{ fontSize: 13, lineHeight: 1.7 }}>
                {isAr
                  ? 'المركز الوطني للإعلامية — نظام إدارة التدريب والتكوين'
                  : 'Centre National de l\'Informatique — Système de gestion des stages et formations'}
              </p>
            </div>

            {[
              {
                titleFr: 'Modules', titleAr: 'الوحدات',
                links: isAr
                  ? ['التدريب', 'التكوين', 'المدربون', 'التقارير']
                  : ['Stages', 'Formations', 'Formateurs', 'Rapports'],
                href: '#modules',
              },
              {
                titleFr: 'Accès', titleAr: 'الولوج',
                links: isAr
                  ? ['دخول الموظفين', 'طلب تدريب']
                  : ['Connexion employé', 'Candidature stage'],
                hrefs: ['/login', '/candidature'],
              },
            ].map((col) => (
              <div key={col.titleFr}>
                <h4 className="text-white font-semibold mb-4" style={{ fontSize: 13 }}>
                  {isAr ? col.titleAr : col.titleFr}
                </h4>
                <ul className="space-y-2.5">
                  {col.links.map((l, i) => (
                    <li key={l}>
                      <a
                        href={col.hrefs ? col.hrefs[i] : col.href}
                        className="hover:text-white transition-colors"
                        style={{ fontSize: 13 }}
                      >
                        {l}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            <div>
              <h4 className="text-white font-semibold mb-4" style={{ fontSize: 13 }}>
                {isAr ? 'اتصال' : 'Contact'}
              </h4>
              <ul className="space-y-3">
                {[
                  { icon: Mail, text: 'rh@cni.tn' },
                  { icon: Phone, text: '+216 71 846 400' },
                  { icon: MapPin, text: 'Avenue Mohamed V, Tunis' },
                ].map((item) => (
                  <li key={item.text} className="flex items-center gap-2.5" style={{ fontSize: 13 }}>
                    <item.icon size={13} style={{ color: '#3b82f6', flexShrink: 0 }} />
                    <span>{item.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div
            className="pt-6 text-center"
            style={{ borderTop: '1px solid rgba(255,255,255,0.06)', fontSize: 12 }}
          >
            {isAr
              ? '© 2026 CNI — المركز الوطني للإعلامية. جميع الحقوق محفوظة.'
              : '© 2026 CNI — Centre National de l\'Informatique. Tous droits réservés.'}
          </div>
        </div>
      </footer>
    </div>
  );
}
