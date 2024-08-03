export interface UserSettings {
  captureInterval: number;
  speechRate: number;
  speechVolume: number;
}

const DEFAULT_SETTINGS: UserSettings = {
  captureInterval: 5000,
  speechRate: 1,
  speechVolume: 1,
};

export function saveUserSettings(settings: UserSettings) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('userSettings', JSON.stringify(settings));
  }
}

export function loadUserSettings(): UserSettings {
  if (typeof window !== 'undefined') {
    const savedSettings = localStorage.getItem('userSettings');
    return savedSettings ? JSON.parse(savedSettings) : DEFAULT_SETTINGS;
  }
  return DEFAULT_SETTINGS;
}