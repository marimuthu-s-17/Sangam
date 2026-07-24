import { createContext, useContext, useState, useEffect } from 'react';
import settingService from '../services/settingService';

const SettingsContext = createContext({
  settings: {
    community_name: 'Sangam',
    currency: 'INR',
    theme: 'light',
  },
  refreshSettings: async () => {},
  loading: true,
});

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState({
    community_name: 'Sangam',
    currency: 'INR',
    theme: 'light',
  });
  const [loading, setLoading] = useState(true);

  const refreshSettings = async () => {
    try {
      const res = await settingService.getSettings();
      if (res.data) {
        setSettings(res.data);
      }
    } catch (err) {
      console.error('Failed to load global settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshSettings();
  }, []);

  // Update HTML title on community name change
  useEffect(() => {
    if (settings?.community_name) {
      document.title = `${settings.community_name} - Auction Manager`;
    }
  }, [settings?.community_name]);

  return (
    <SettingsContext.Provider value={{ settings, refreshSettings, loading }}>
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => useContext(SettingsContext);
