import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Match, Standing, Team, ThirdPlaceRow } from '../domain/Models';
import { MatchStatus } from '../domain/MatchStatus';
import { SupportedQualState } from '../domain/SupportedQualState';
import {
  QualificationConditions,
  analyzeQualificationConditions,
} from '../domain/QualificationConditions';
import GroupTileView from './GroupTileView';
import ScenarioSheetView from './ScenarioSheetView';

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

  const [openGroupKey, setOpenGroupKey] = useState<string | null>(null);

  const handleOpenGroup = (group: string) => {
    setOpenGroupKey(group);
  };

  const handleCloseSheet = () => {
    setOpenGroupKey(null);
  };

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
    // 날짜 빠른순: 잔여 경기가 있으면 가장 빠른 예정/진행 경기,
    // 없으면(실패·안전 확정 등) 그 조의 마지막 경기 날짜 기준. 실패 조도 날짜로 섞이게 한다.
    const sortKey = (group: string): number => {
      const groupMatches = matchesByGroup.get(group) ?? [];

      let pendingMin = Number.POSITIVE_INFINITY;
      let anyMax = Number.NEGATIVE_INFINITY;

      groupMatches.forEach((match) => {
        const time = new Date(match.kickoff).getTime();

        if (Number.isNaN(time)) {
          return;
        }

        if (match.status === MatchStatus.Scheduled || match.status === MatchStatus.Live) {
          pendingMin = Math.min(pendingMin, time);
        }

        anyMax = Math.max(anyMax, time);
      });

      if (pendingMin !== Number.POSITIVE_INFINITY) {
        return pendingMin;
      }

      if (anyMax !== Number.NEGATIVE_INFINITY) {
        return anyMax;
      }

      return Number.POSITIVE_INFINITY;
    };

    return [...conditions.rivalGroups].sort((a, b) => {
      const diff = sortKey(a.group) - sortKey(b.group);

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

  const openCondition = openGroupKey
    ? (conditions.rivalGroups.find((item) => item.group === openGroupKey) ?? null)
    : null;

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

      <ul className="group-grid">
        {sortedRivalGroups.map((condition) => (
          <GroupTileView
            key={condition.group}
            condition={condition}
            groupMatches={matchesByGroup.get(condition.group) ?? []}
            groupTeams={teamsByGroup.get(condition.group) ?? []}
            supportedStanding={supportedStanding}
            teamById={teamById}
            onOpen={handleOpenGroup}
          />
        ))}
      </ul>

      {openCondition ? (
        <ScenarioSheetView
          condition={openCondition}
          groupMatches={matchesByGroup.get(openCondition.group) ?? []}
          groupTeams={teamsByGroup.get(openCondition.group) ?? []}
          supportedStanding={supportedStanding}
          teamById={teamById}
          matches={matches}
          teams={teams}
          supportedTeamId={supportedTeamId}
          onClose={handleCloseSheet}
        />
      ) : null}
    </section>
  );
};

export default GroupThreatBoardView;
