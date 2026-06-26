import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Match, Standing, Team, ThirdPlaceRow } from '../domain/Models';
import { SupportedQualState } from '../domain/SupportedQualState';
import {
  QualificationConditions,
  analyzeQualificationConditions,
} from '../domain/QualificationConditions';
import GroupThreatCardView from './GroupThreatCardView';

interface GroupThreatBoardViewProps {
  supportedTeamId: string | null;
  supportedStanding: Standing | null;
  supportedThirdRow: ThirdPlaceRow | null;
  thirdPlaceTotal: number;
  matches: Match[];
  teams: Team[];
  teamById: Map<string, Team>;
}

const EMPTY_CONDITIONS: QualificationConditions = {
  status: SupportedQualState.NotThird,
  supportedThirdPlaceRank: null,
  lockedAboveCount: 0,
  swingCount: 0,
  allowedLosses: 0,
  swingGroups: [],
  alreadyAboveGroups: [],
  safeBelowGroups: [],
  rivalGroups: [],
};

const GroupThreatBoardView = (props: GroupThreatBoardViewProps) => {
  const {
    supportedTeamId,
    supportedStanding,
    supportedThirdRow,
    thirdPlaceTotal,
    matches,
    teams,
    teamById,
  } = props;
  const { t, i18n } = useTranslation();

  const conditions = useMemo<QualificationConditions>(() => {
    if (!supportedTeamId || matches.length === 0) {
      return EMPTY_CONDITIONS;
    }

    try {
      return analyzeQualificationConditions(supportedTeamId, matches, teams);
    } catch {
      return EMPTY_CONDITIONS;
    }
  }, [supportedTeamId, matches, teams]);

  const isEn = i18n.language === 'en';

  const supportedTeam = supportedTeamId ? (teamById.get(supportedTeamId) ?? null) : null;
  const supportedName = supportedTeam ? (isEn ? supportedTeam.nameEn : supportedTeam.nameKo) : '—';
  const supportedFlag = supportedTeam?.flag ?? '🏳️';

  const groupRank = supportedStanding?.rankInGroup;
  const isAutoQualified = groupRank !== undefined && groupRank <= 2;
  const isThird = groupRank === 3 && supportedThirdRow !== null;
  const isNotThird = groupRank !== undefined && groupRank > 3;

  const maxAllowedAbove = thirdPlaceTotal > 0 ? Math.min(8, thirdPlaceTotal) - 1 : 7;

  if (isAutoQualified) {
    return (
      <section className="threat">
        <div className="threat-banner is-clinched">
          <span className="status-pill is-clinched">{t('statusClinched')}</span>
          <p className="threat-banner__desc">{t('threatAutoQualifiedDesc')}</p>
        </div>
      </section>
    );
  }

  if (isNotThird || !isThird) {
    return (
      <section className="threat">
        <div className="threat-banner is-contention">
          <span className="status-pill is-contention">{t('threatNotThird')}</span>
          <p className="threat-banner__desc">{t('threatNotThirdDesc')}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="threat">
      <div className="threat-summary">
        <p className="threat-summary__me">
          <span className="threat-summary__flag">{supportedFlag}</span>
          <span className="threat-summary__name">{supportedName}</span>
          <span className="threat-summary__rank">
            {t('threatMyRank', {
              rank: supportedThirdRow.thirdPlaceRank,
              total: thirdPlaceTotal,
            })}
          </span>
        </p>
        <p className="threat-summary__line">
          {t('threatSummaryLine', {
            max: maxAllowedAbove,
            locked: conditions.lockedAboveCount,
            swing: conditions.swingCount,
          })}
        </p>
      </div>

      <ul className="threat-card-list">
        {conditions.rivalGroups.map((condition) => (
          <GroupThreatCardView key={condition.group} condition={condition} teamById={teamById} />
        ))}
      </ul>
    </section>
  );
};

export default GroupThreatBoardView;
