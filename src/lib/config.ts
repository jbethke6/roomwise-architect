const STORAGE_KEY = 'bgf-rechner-config';

export interface AppConfig {
  webhookUrl: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
  archiveFetchUrl?: string;
}

const DEFAULT_CONFIG: AppConfig = {
  webhookUrl: '',
  supabaseUrl: '',
  supabaseAnonKey: '',
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
