import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { Ko } from './Ko';
import { En } from './En';

const STORAGE_KEY = 'lang';
const DEFAULT_LANG = 'ko';

const readStoredLang = (): string => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);

    if (stored === 'ko' || stored === 'en') {
      return stored;
    }
  } catch {
    // localStorage 접근 불가(프라이빗 모드 등) 시 기본값 사용
  }

  return DEFAULT_LANG;
};

i18n.use(initReactI18next).init({
  resources: {
    ko: Ko,
    en: En,
  },
  lng: readStoredLang(),
  fallbackLng: DEFAULT_LANG,
  interpolation: {
    escapeValue: false,
  },
  react: {
    // 리소스를 번들에 동기 포함하므로 Suspense 불필요. 초기 init(비동기) 중
    // useTranslation 이 중단되며 훅 순서가 흔들리는 경고를 막는다.
    useSuspense: false,
  },
});

export default i18n;
