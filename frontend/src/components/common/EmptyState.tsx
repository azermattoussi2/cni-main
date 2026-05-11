import { ReactNode } from 'react';

type EmptyStateProps = {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
};

export default function EmptyState({ title, subtitle, icon }: EmptyStateProps) {
  return (
    <div className="text-center py-16 text-gray-400">
      {icon ? <div className="mx-auto mb-3 w-fit opacity-40">{icon}</div> : null}
      <p className="font-medium">{title}</p>
      {subtitle ? <p className="text-sm mt-1">{subtitle}</p> : null}
    </div>
  );
}
