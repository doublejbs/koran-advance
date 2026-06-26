import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

// AD_CLIENT 는 index.html 의 client 파라미터와 동일해야 한다.
// TODO: AD_SLOT 은 애드센스에서 광고 단위를 만든 뒤 발급되는 슬롯 ID로 교체하세요.
const AD_CLIENT = 'ca-pub-1953089301592534';
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
