const STORAGE_KEY = 'bgf-rechner-config';

export interface AppConfig {
  webhookUrl: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
  pdfWebhookUrl: string;
  archiveFetchUrl?: string;
}

const DEFAULT_CONFIG: AppConfig = {
  webhookUrl: '',
  supabaseUrl: 'https://ucoqnzutxvojykgkvdrp.supabase.co',
  supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVjb3FuenV0eHZvanlrZ2t2ZHJwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI0MTEyMDgsImV4cCI6MjA4Nzk4NzIwOH0.VRTHTURFkaxu82KZaiXKNQmy4rc8Ep4Y6jDsLIrZ4nw',
  pdfWebhookUrl: '',
  archiveFetchUrl: '',
};

export function getConfig(): AppConfig {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? { ...DEFAULT_CONFIG, ...JSON.parse(stored) } : DEFAULT_CONFIG;
  } catch {
    return DEFAULT_CONFIG;
  }
}

export function saveConfig(config: Partial<AppConfig>): void {
  const current = getConfig();
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...current, ...config }));
}
