import { createContext, useContext, useState, useEffect } from 'react';
import translations from '../services/translationService';

const LanguageContext = createContext({
  language: 'en',
  setLanguage: () => {},
  t: (key) => key,
});

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    return localStorage.getItem('sangam_lang') || 'en';
  });

  const setLanguage = (lang) => {
    setLanguageState(lang);
    localStorage.setItem('sangam_lang', lang);
  };

  const t = (key) => {
    const langDict = translations[language] || translations.en;
    if (langDict && langDict[key]) {
      return langDict[key];
    }
    // Fallback to English translation
    const enDict = translations.en;
    if (enDict && enDict[key]) {
      return enDict[key];
    }
    return key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useTranslation = () => useContext(LanguageContext);
export const useLanguage = () => useContext(LanguageContext);
export default LanguageContext;
