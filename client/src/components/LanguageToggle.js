import React from 'react';
import { useTranslation } from 'react-i18next';
import './LanguageToggle.css';

const LanguageToggle = () => {
  const { i18n } = useTranslation();

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div className="language-toggle">
      <button
        className={i18n.language === 'en' ? 'active' : ''}
        onClick={() => changeLanguage('en')}
      >
        {i18n.t('languageToggle.en')}
      </button>
      <button
        className={i18n.language === 'uk' ? 'active' : ''}
        onClick={() => changeLanguage('uk')}
      >
        {i18n.t('languageToggle.uk')}
      </button>
    </div>
  );
};

export default LanguageToggle;