import { useTranslation } from 'react-i18next';
import { Standing, Team, ThirdPlaceRow } from '../domain/Models';
import { QualificationStatus } from '../domain/QualificationStatus';

interface StatusBannerViewProps {
  team: Team;
  status: QualificationStatus;
  standing: Standing | null;
  thirdPlaceRow: ThirdPlaceRow | null;
  thirdPlaceTotal: number;
  onChangeTeam: () => void;
}

interface StatusMeta {
  label: string;
  modifier: string;
}

const resolveStatusMeta = (
  status: QualificationStatus,
  t: (key: string) => string,
): StatusMeta => {
  if (status === QualificationStatus.Clinched) {
    return { label: t('statusClinched'), modifier: 'is-clinched' };
  }

  if (status === QualificationStatus.Eliminated) {
    return { label: t('statusEliminated'), modifier: 'is-eliminated' };
  }

  return { label: t('statusInContention'), modifier: 'is-contention' };
};

const StatusBannerView = (props: StatusBannerViewProps) => {
  const { team, status, standing, thirdPlaceRow, thirdPlaceTotal, onChangeTeam } = props;
  const { t, i18n } = useTranslation();

  const isEn = i18n.language === 'en';
  const name = isEn ? team.nameEn : team.nameKo;
  const meta = resolveStatusMeta(status, t);

  const isThird = standing?.rankInGroup === 3 && thirdPlaceRow !== null;

  return (
    <div className={`status-banner ${meta.modifier}`}>
      <div className="status-banner__identity">
        <span className="status-banner__flag">{team.flag}</span>
        <div className="status-banner__text">
          <span className="status-banner__name">{name}</span>
          <span className="status-banner__meta">
            {standing
              ? t('groupRank', { group: team.group, rank: standing.rankInGroup })
              : `${team.group}`}
            {isThird ? (
              <span className="status-banner__third">
                {' · '}
                {t('thirdPlaceRankLabel', {
                  rank: thirdPlaceRow.thirdPlaceRank,
                  total: thirdPlaceTotal,
                })}
              </span>
            ) : null}
          </span>
        </div>
      </div>

      <div className="status-banner__right">
        <span className={`status-pill ${meta.modifier}`}>{meta.label}</span>
        <button type="button" className="status-banner__change" onClick={onChangeTeam}>
          {t('changeTeam')}
        </button>
      </div>
    </div>
  );
};

export default StatusBannerView;
