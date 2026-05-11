// ============================================
// Fichier : stores/langStore.ts
// Description : Store Zustand pour la langue (FR / AR)
// ============================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Lang = 'fr' | 'ar';

interface LangState {
  lang: Lang;
  setLang: (lang: Lang) => void;
  toggle: () => void;
  t: (key: string) => string;
}

// Dictionnaire de traductions
const translations: Record<string, Record<Lang, string>> = {
  // Navigation
  'nav.home': { fr: 'Accueil', ar: 'الرئيسية' },
  'nav.about': { fr: 'À propos', ar: 'عن المشروع' },
  'nav.modules': { fr: 'Modules', ar: 'الوحدات' },
  'nav.login': { fr: 'Se connecter', ar: 'تسجيل الدخول' },
  'nav.access': { fr: 'Accéder à l\'application', ar: 'الدخول إلى التطبيق' },

  // Hero
  'hero.title': { fr: 'Gestion des Stages & Formations', ar: 'إدارة التدريب والتكوين' },
  'hero.subtitle': { fr: 'Système moderne et automatisé pour CNI', ar: 'نظام حديث ومؤتمت للمركز الوطني للإعلامية' },
  'hero.cta': { fr: 'Commencer maintenant', ar: 'ابدأ الآن' },
  'hero.demo': { fr: 'Voir la démo', ar: 'مشاهدة العرض' },

  // Modules
  'module.stages': { fr: 'Gestion des Stages', ar: 'إدارة التدريب' },
  'module.stages.desc': { fr: 'Candidatures, suivi, évaluations et attestations', ar: 'الطلبات والمتابعة والتقييمات والشهادات' },
  'module.formations': { fr: 'Gestion des Formations', ar: 'إدارة التكوين' },
  'module.formations.desc': { fr: 'Catalogue, inscriptions, budget et certifications', ar: 'الكتالوج والتسجيل والميزانية والشهادات' },
  'module.formateurs': { fr: 'Gestion des Formateurs', ar: 'إدارة المدربين' },
  'module.formateurs.desc': { fr: 'Internes & externes, matching et gamification', ar: 'الداخليون والخارجيون والتوافق والألعاب' },
  'module.reporting': { fr: 'Reporting & Analytics', ar: 'التقارير والتحليلات' },
  'module.reporting.desc': { fr: 'Dashboards interactifs par rôle en temps réel', ar: 'لوحات تحكم تفاعلية حسب الدور في الوقت الفعلي' },

  // Dashboard
  'dash.welcome': { fr: 'Bienvenue', ar: 'مرحباً' },
  'dash.stages': { fr: 'Stages en cours', ar: 'التدريبات الجارية' },
  'dash.formations': { fr: 'Formations du mois', ar: 'تدريبات الشهر' },
  'dash.budget': { fr: 'Budget restant', ar: 'الميزانية المتبقية' },
  'dash.satisfaction': { fr: 'Satisfaction moyenne', ar: 'متوسط الرضا' },

  // Buttons
  'btn.save': { fr: 'Enregistrer', ar: 'حفظ' },
  'btn.cancel': { fr: 'Annuler', ar: 'إلغاء' },
  'btn.validate': { fr: 'Valider', ar: 'تأكيد' },
  'btn.refuse': { fr: 'Refuser', ar: 'رفض' },
  'btn.download': { fr: 'Télécharger', ar: 'تحميل' },
  'btn.sign': { fr: 'Signer', ar: 'توقيع' },

  // Status
  'status.En_attente': { fr: 'En attente', ar: 'في الانتظار' },
  'status.En_examen': { fr: 'En cours d\'examen', ar: 'قيد الدراسة' },
  'status.Accepte': { fr: 'Accepté', ar: 'مقبول' },
  'status.Refuse': { fr: 'Refusé', ar: 'مرفوض' },
  'status.En_cours': { fr: 'En cours', ar: 'جارٍ' },
  'status.Termine': { fr: 'Terminé', ar: 'منتهٍ' },
};

export const useLangStore = create<LangState>()(
  persist(
    (set, get) => ({
      lang: 'fr',
      setLang: (lang) => {
        document.documentElement.lang = lang;
        document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
        set({ lang });
      },
      toggle: () => {
        const next = get().lang === 'fr' ? 'ar' : 'fr';
        document.documentElement.lang = next;
        document.documentElement.dir = next === 'ar' ? 'rtl' : 'ltr';
        set({ lang: next });
      },
      t: (key) => {
        const { lang } = get();
        return translations[key]?.[lang] ?? key;
      },
    }),
    { name: 'cni-lang' }
  )
);
