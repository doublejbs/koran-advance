import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Match, Standing, Team, ThirdPlaceRow } from '../domain/Models';
import { MatchStatus } from '../domain/MatchStatus';
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

  const matchesByGroup = useMemo<Map<string, Match[]>>(() => {
    const map = new Map<string, Match[]>();

    matches.forEach((match) => {
      const list = map.get(match.group) ?? [];

      list.push(match);
      map.set(match.group, list);
    });

    return map;
  }, [matches]);

  const sortedRivalGroups = useMemo(() => {
    // 곧 열리는 순: 그 조의 가장 빠른 예정/진행 경기 kickoff(오름차순). 잔여 경기 없으면 맨 뒤로.
    const nextKickoff = (group: string): number => {
      const groupMatches = matchesByGroup.get(group) ?? [];

      return groupMatches.reduce((min, match) => {
        if (match.status !== MatchStatus.Scheduled && match.status !== MatchStatus.Live) {
          return min;
        }

        const time = new Date(match.kickoff).getTime();

        if (Number.isNaN(time)) {
          return min;
        }

        return time < min ? time : min;
      }, Number.POSITIVE_INFINITY);
    };

    return [...conditions.rivalGroups].sort((a, b) => {
      const diff = nextKickoff(a.group) - nextKickoff(b.group);

      // 둘 다 잔여 경기 없음(Infinity)이면 diff 가 NaN → 조 이름순으로 폴백.
      if (diff !== 0 && !Number.isNaN(diff)) {
        return diff;
      }

      return a.group.localeCompare(b.group);
    });
  }, [conditions.rivalGroups, matchesByGroup]);

  const teamsByGroup = useMemo<Map<string, Team[]>>(() => {
    const map = new Map<string, Team[]>();

    teams.forEach((team) => {
      const list = map.get(team.group) ?? [];

      list.push(team);
      map.set(team.group, list);
    });

    return map;
  }, [teams]);

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
        {sortedRivalGroups.map((condition) => (
          <GroupThreatCardView
            key={condition.group}
            condition={condition}
            teamById={teamById}
            groupMatches={matchesByGroup.get(condition.group) ?? []}
            groupTeams={teamsByGroup.get(condition.group) ?? []}
            supportedStanding={supportedStanding}
            matches={matches}
            teams={teams}
            supportedTeamId={supportedTeamId}
          />
        ))}
      </ul>
    </section>
  );
};

export default GroupThreatBoardView;
