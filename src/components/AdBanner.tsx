import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

// TODO: 애드센스 계정의 실제 값으로 교체하세요.
// - AD_CLIENT 는 index.html 의 client 파라미터와 동일해야 합니다.
const AD_CLIENT = 'ca-pub-XXXXXXXXXXXXXXXX';
const AD_SLOT = 'XXXXXXXXXX';

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

/** 페이지 최하단 구글 애드센스 디스플레이 광고. */
const AdBanner = () => {
  const { t } = useTranslation();
  const pushedRef = useRef(false);

  useEffect(() => {
    if (pushedRef.current) {
      return;
    }

    pushedRef.current = true;

    try {
      (window.adsbygoogle = window.adsbygoogle ?? []).push({});
    } catch {
      // 애드센스 스크립트 미로딩/미승인(예: localhost) 시 조용히 무시한다.
    }
  }, []);

  return (
    <aside className="ad-banner" aria-label={t('ad')}>
      <span className="ad-banner__label">{t('ad')}</span>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={AD_CLIENT}
        data-ad-slot={AD_SLOT}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </aside>
  );
};

export default AdBanner;
