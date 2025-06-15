import type { LucideIcon } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  actions?: React.ReactNode;
}

export function PageHeader({ title, description, icon: Icon, actions }: PageHeaderProps) {
  return (
    <div className="mb-6 border-b pb-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 mb-2 sm:mb-0">
          {Icon && <Icon className="h-8 w-8 text-primary" />}
          <h1 className="text-3xl font-bold tracking-tight text-foreground font-headline">{title}</h1>
        </div>
        {actions && <div className="flex-shrink-0">{actions}</div>}
      </div>
      {description && <p className="mt-1 text-muted-foreground">{description}</p>}
    </div>
  );
}
