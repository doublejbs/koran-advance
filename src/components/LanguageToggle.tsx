import { useTranslation } from 'react-i18next';

const STORAGE_KEY = 'lang';

enum Lang {
  Ko = 'ko',
  En = 'en',
}

const LanguageToggle = () => {
  const { i18n } = useTranslation();

  const current = i18n.language === Lang.En ? Lang.En : Lang.Ko;

  const handleSelect = (lang: Lang) => {
    if (lang === current) {
      return;
    }

    void i18n.changeLanguage(lang);

    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // 저장 실패는 무시한다.
    }
  };

  return (
    <div className="lang-toggle" role="group" aria-label="language">
      <button
        type="button"
        className={`lang-toggle__btn ${current === Lang.Ko ? 'is-active' : ''}`}
        aria-pressed={current === Lang.Ko}
        onClick={() => handleSelect(Lang.Ko)}
      >
        KO
      </button>
      <button
        type="button"
        className={`lang-toggle__btn ${current === Lang.En ? 'is-active' : ''}`}
        aria-pressed={current === Lang.En}
        onClick={() => handleSelect(Lang.En)}
      >
        EN
      </button>
    </div>
  );
};

export default LanguageToggle;
