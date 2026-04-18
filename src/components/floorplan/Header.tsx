import { Calculator, Archive } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

export function Header() {
  const { pathname } = useLocation();

  const navItem = (to: string, label: string, Icon: typeof Archive) => {
    const active = pathname === to;
    return (
      <Link
        to={to}
        className={cn(
          'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
          active
            ? 'bg-primary/10 text-primary'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground',
        )}
      >
        <Icon className="h-4 w-4" />
        {label}
      </Link>
    );
  };

  return (
    <header className="border-b border-border bg-card/80 backdrop-blur-sm">
      <div className="container mx-auto flex items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Calculator className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">BGF-Rechner</h1>
            <p className="text-xs text-muted-foreground">Bruttogrundfläche berechnen</p>
          </div>
        </Link>
        <nav className="flex items-center gap-1">
          {navItem('/', 'Analyse', Calculator)}
          {navItem('/archiv', 'Archiv', Archive)}
        </nav>
      </div>
    </header>
  );
}
