import { useCallback, useMemo } from 'react';
import { Match, Team, ThirdPlaceRow } from '../domain/Models';
import { MatchOutcome } from '../domain/MatchOutcome';
import { MatchStatus } from '../domain/MatchStatus';
import { applyScenario } from '../domain/Scenario';
import { computeAllGroupStandings } from '../domain/Standings';
import { rankThirdPlaceTeams, selectThirdPlacedStandings } from '../domain/ThirdPlace';
import {
  QualificationConditions,
  RivalGroupCondition,
  analyzeQualificationConditions,
} from '../domain/QualificationConditions';
import { SupportedQualState } from '../domain/SupportedQualState';

interface UseQualificationBoardArgs {
  supportedTeamId: string | null;
  matches: Match[];
  teams: Team[];
}

interface UseQualificationBoardResult {
  conditions: QualificationConditions;
  sortedSwingGroups: RivalGroupCondition[];
  matchById: Map<string, Match>;
  /** 한 경기를 한 결과로 가정했을 때(다른 경기는 현 상태)의 3위 순위표. */
  projectFor: (matchId: string, outcome: MatchOutcome) => ThirdPlaceRow[];
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
};

const FAR_FUTURE = Number.MAX_SAFE_INTEGER;

/** kickoff(ISO 문자열) → epoch(ms). 파싱 실패 시 가장 먼 미래로 둬 정렬 뒤로 보낸다. */
const parseKickoff = (kickoff: string): number => {
  const time = Date.parse(kickoff);

  return Number.isNaN(time) ? FAR_FUTURE : time;
};

/** 한 조의 pending 경기 중 가장 임박한(가까운) kickoff(ms). 없으면 FAR_FUTURE. */
const earliestKickoff = (condition: RivalGroupCondition, matchById: Map<string, Match>): number => {
  let earliest = FAR_FUTURE;

  condition.pendingMatchIds.forEach((matchId) => {
    const match = matchById.get(matchId);

    if (!match) {
      return;
    }

    const time = parseKickoff(match.kickoff);

    if (time < earliest) {
      earliest = time;
    }
  });

  return earliest;
};

/** 한 조에 진행 중(Live) 경기가 있는지. */
const hasLive = (condition: RivalGroupCondition, matchById: Map<string, Match>): boolean => {
  return condition.pendingMatchIds.some(
    (matchId) => matchById.get(matchId)?.status === MatchStatus.Live,
  );
};

/**
 * swing 조를 "최신 경기순"으로 정렬한다.
 * ① 라이브 경기가 있는 조 우선 → ② 그 조 pending 경기들의 가장 가까운 kickoff 순.
 */
const sortSwingGroups = (
  groups: RivalGroupCondition[],
  matchById: Map<string, Match>,
): RivalGroupCondition[] => {
  return [...groups].sort((a, b) => {
    const aLive = hasLive(a, matchById);
    const bLive = hasLive(b, matchById);

    if (aLive !== bLive) {
      return aLive ? -1 : 1;
    }

    const aKickoff = earliestKickoff(a, matchById);
    const bKickoff = earliestKickoff(b, matchById);

    if (aKickoff !== bKickoff) {
      return aKickoff - bKickoff;
    }

    return a.group.localeCompare(b.group);
  });
};

/** 응원국 진출 조건 보드 분석을 메모이즈한다. */
export const useQualificationBoard = (
  args: UseQualificationBoardArgs,
): UseQualificationBoardResult => {
  const { supportedTeamId, matches, teams } = args;

  const matchById = useMemo<Map<string, Match>>(() => {
    const map = new Map<string, Match>();

    matches.forEach((match) => {
      map.set(match.id, match);
    });

    return map;
  }, [matches]);

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

  const sortedSwingGroups = useMemo<RivalGroupCondition[]>(() => {
    return sortSwingGroups(conditions.swingGroups, matchById);
  }, [conditions.swingGroups, matchById]);

  const projectFor = useCallback(
    (matchId: string, outcome: MatchOutcome): ThirdPlaceRow[] => {
      const scenarioMatches = applyScenario(matches, new Map([[matchId, outcome]]));
      const standingsByGroup = computeAllGroupStandings(scenarioMatches, teams);

      return rankThirdPlaceTeams(selectThirdPlacedStandings(standingsByGroup), teams);
    },
    [matches, teams],
  );

  return { conditions, sortedSwingGroups, matchById, projectFor };
};
