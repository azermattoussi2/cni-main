// ============================================
// Bandeau KPI — liste (Candidatures, Formations…) ou tableaux de bord (variant dashboard)
// ============================================

export type PageStatItem = {
  label: string;
  value: string | number;
  /** Variant liste : fond + couleur chiffre */
  color?: string;
  text?: string;
  /** Variant dashboard : ligne d’aide sous le chiffre */
  hint?: string;
  /** Barre d’accent (classes Tailwind), ex. bg-blue-600 */
  accent?: string;
};

type PageStatGridProps = {
  items: PageStatItem[];
  /** `dashboard` : cartes blanches, typographie serrée, barre d’accent */
  variant?: 'default' | 'dashboard';
};

const DASHBOARD_ACCENTS = ['bg-blue-600', 'bg-amber-500', 'bg-emerald-600', 'bg-slate-600'] as const;

export function PageStatGrid({ items, variant = 'default' }: PageStatGridProps) {
  if (variant === 'dashboard') {
    return (
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {items.map((c, i) => {
          const bar = c.accent ?? DASHBOARD_ACCENTS[i % DASHBOARD_ACCENTS.length];
          return (
            <div
              key={`${c.label}-${i}`}
              className="group relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white/95 px-5 pb-5 pt-5 shadow-[0_8px_24px_rgba(15,23,42,0.06)] ring-1 ring-slate-950/[0.03] transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_16px_34px_rgba(15,23,42,0.12)]"
            >
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.10),transparent_45%)] opacity-80" />
              <div className={`absolute left-0 top-3.5 bottom-3.5 w-[3px] rounded-full ${bar}`} aria-hidden />
              <div className={`absolute right-3 top-3 h-2.5 w-2.5 rounded-full ${bar} opacity-65 shadow-sm`} aria-hidden />
              <div className="pl-3.5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">{c.label}</p>
                <p className="mt-2.5 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-600 bg-clip-text text-[1.625rem] font-black leading-none tracking-tight text-transparent tabular-nums sm:text-3xl">
                  {c.value}
                </p>
                {c.hint ? <p className="mt-2 text-xs leading-relaxed text-slate-500">{c.hint}</p> : null}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  const cols = items.length <= 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-4';
  return (
    <div className={`grid grid-cols-2 ${cols} gap-3`}>
      {items.map((c) => (
        <div
          key={c.label}
          className={`${c.color ?? 'bg-gray-50 border-gray-200'} border rounded-xl p-4 text-center`}
        >
          <div className={`text-2xl font-black ${c.text ?? 'text-gray-700'}`}>{c.value}</div>
          <div className="text-xs text-gray-500 mt-0.5">{c.label}</div>
        </div>
      ))}
    </div>
  );
}
