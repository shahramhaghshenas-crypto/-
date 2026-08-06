export interface AppSettingsData {
  theme: 'light' | 'dark';
  language: string;
  autoSave: boolean;
  animation: boolean;
  grid: boolean;
  sound: boolean;
  companyName: string;
  logo: string;
}

const DEFAULT_SETTINGS: AppSettingsData = {
  theme: 'light',
  language: 'fa',
  autoSave: true,
  animation: true,
  grid: true,
  sound: false,
  companyName: 'کارخانه رادیاتورسازی صنعتی',
  logo: ''
};

export class Settings {
  data: AppSettingsData;

  constructor() {
    this.data = { ...DEFAULT_SETTINGS };
    this.load();
  }

  load(): AppSettingsData {
    try {
      const stored = localStorage.getItem('radiator_ai_settings');
      if (stored) {
        this.data = { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
      }
    } catch (e) {
      console.warn('Could not load settings from localStorage:', e);
    }
    return this.data;
  }

  save(): void {
    try {
      localStorage.setItem('radiator_ai_settings', JSON.stringify(this.data));
    } catch (e) {
      console.warn('Could not save settings to localStorage:', e);
    }
  }

  setTheme(theme: 'light' | 'dark'): void {
    this.data.theme = theme;
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.body.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.setAttribute('data-theme', 'light');
    }
    this.save();
  }

  update(partial: Partial<AppSettingsData>): void {
    this.data = { ...this.data, ...partial };
    if (partial.theme) {
      this.setTheme(partial.theme);
    } else {
      this.save();
    }
  }
}

export const settingsInstance = new Settings();
