import { Match, Team } from './Models';
import { MatchOutcome } from './MatchOutcome';
import { MatchStatus } from './MatchStatus';
import { QualificationStatus } from './QualificationStatus';
import { applyScenario } from './Scenario';
import { computeAllGroupStandings } from './Standings';
import { rankThirdPlaceTeams, selectThirdPlacedStandings } from './ThirdPlace';

/** 전수 탐색을 허용할 최대 조합 수(3^9). 초과 시 보수적으로 InContention 으로 처리한다. */
const MAX_COMBINATIONS = 19683;

/** 응원국이 특정 시나리오(경기 결과 집합)에서 진출하는지 판정한다. */
const qualifiesInScenario = (
  supportedTeamId: string,
  matches: Match[],
  teams: Team[],
): boolean => {
  const standingsByGroup = computeAllGroupStandings(matches, teams);
  const supportedTeam = teams.find((team) => team.id === supportedTeamId);

  if (!supportedTeam) {
    return false;
  }

  const groupStandings = standingsByGroup.get(supportedTeam.group);

  if (!groupStandings) {
    return false;
  }

  const standing = groupStandings.find((item) => item.teamId === supportedTeamId);

  if (!standing) {
    return false;
  }

  // 조 1·2위 → 자동 진출
  if (standing.rankInGroup <= 2) {
    return true;
  }

  // 조 3위 → 3위 순위표 상위 8 이내인지 확인
  if (standing.rankInGroup === 3) {
    const thirdStandings = selectThirdPlacedStandings(standingsByGroup);
    const thirdRows = rankThirdPlaceTeams(thirdStandings, teams);
    const supportedRow = thirdRows.find((row) => row.teamId === supportedTeamId);

    return Boolean(supportedRow?.qualifies);
  }

  return false;
};

/** Scheduled 상태(아직 결과 미정) 경기들. */
const scheduledMatches = (matches: Match[]): Match[] => {
  return matches.filter((match) => match.status === MatchStatus.Scheduled);
};

/** Scheduled 가 아닌(이미 집계 가능한) 경기들. */
const nonScheduledMatches = (matches: Match[]): Match[] => {
  return matches.filter((match) => match.status !== MatchStatus.Scheduled);
};

/** 한 경기에 가능한 세 가지 결과(홈승/원정승/무)를 적용한 Match 를 만든다. */
const matchWithOutcome = (match: Match, outcome: MatchOutcome): Match => {
  if (outcome === MatchOutcome.HomeWin) {
    return { ...match, status: MatchStatus.Finished, homeGoals: 1, awayGoals: 0 };
  }

  if (outcome === MatchOutcome.AwayWin) {
    return { ...match, status: MatchStatus.Finished, homeGoals: 0, awayGoals: 1 };
  }

  return { ...match, status: MatchStatus.Finished, homeGoals: 0, awayGoals: 0 };
};

const ALL_OUTCOMES: MatchOutcome[] = [
  MatchOutcome.HomeWin,
  MatchOutcome.AwayWin,
  MatchOutcome.Draw,
];

/**
 * 주어진 시나리오에서 응원국의 "유리함 점수"(작을수록 유리). greedy 선택에 사용.
 * - 3위 그룹에 있으면 그 3위표 순위(낮을수록 유리)를 점수로 쓴다.
 * - 조 1·2위(자동진출)이면 0(가장 유리). 3위 그룹 밖(4위 등)이면 매우 큰 값.
 */
const supportedThirdRank = (
  supportedTeamId: string,
  matches: Match[],
  teams: Team[],
): number => {
  const standingsByGroup = computeAllGroupStandings(matches, teams);
  const supportedTeam = teams.find((team) => team.id === supportedTeamId);

  if (!supportedTeam) {
    return Number.MAX_SAFE_INTEGER;
  }

  const ownStanding = standingsByGroup
    .get(supportedTeam.group)
    ?.find((item) => item.teamId === supportedTeamId);

  if (ownStanding && ownStanding.rankInGroup <= 2) {
    return 0;
  }

  const thirdRows = rankThirdPlaceTeams(selectThirdPlacedStandings(standingsByGroup), teams);
  const row = thirdRows.find((item) => item.teamId === supportedTeamId);

  return row ? row.thirdPlaceRank : Number.MAX_SAFE_INTEGER - 1;
};

/**
 * 응원국의 진출 판정에 실제로 영향을 줄 수 있는 잔여 경기들을 추린다.
 *
 * - (a) 응원국이 속한 조의 잔여 경기(조 순위/3위 자리 결정).
 * - (b) 응원국이 조 3위(또는 3위로 떨어질 수 있는 경계 rank 2~4)에 있으면, 3위 컷 비교에
 *   영향을 줄 수 있는 다른 조들의 잔여 경기 — 안전하게 "현재 각 조의 경계 팀(rank 2~4)이
 *   포함된 잔여 경기"를 포함한다.
 *
 * 범위 밖 경기는 호출부에서 미정(현 상태)으로 두고 qualifiesInScenario 에 그대로 넘긴다.
 */
const collectRelevantMatches = (
  supportedTeamId: string,
  pending: Match[],
  teams: Team[],
  finished: Match[],
): Match[] => {
  const supportedTeam = teams.find((team) => team.id === supportedTeamId);

  if (!supportedTeam) {
    return [];
  }

  const supportedGroup = supportedTeam.group;
  const standingsByGroup = computeAllGroupStandings(finished, teams);

  // 응원국의 현재 조 내 순위. 3위 자리거나 경계(2~4위)면 3위 컷 비교가 흔들릴 수 있다.
  const ownStanding = standingsByGroup
    .get(supportedGroup)
    ?.find((item) => item.teamId === supportedTeamId);
  const ownRank = ownStanding?.rankInGroup ?? 4;
  const cutContestant = ownRank >= 2 && ownRank <= 4;

  // 3위 컷 비교에 영향을 줄 수 있는 팀들(각 조의 경계 rank 2~4 팀).
  const boundaryTeamIds = new Set<string>();

  if (cutContestant) {
    standingsByGroup.forEach((standings) => {
      standings.forEach((standing) => {
        if (standing.rankInGroup >= 2 && standing.rankInGroup <= 4) {
          boundaryTeamIds.add(standing.teamId);
        }
      });
    });
  }

  const relevant = pending.filter((match) => {
    const inSupportedGroup = match.group === supportedGroup;

    if (inSupportedGroup) {
      return true;
    }

    if (!cutContestant) {
      return false;
    }

    return boundaryTeamIds.has(match.homeId) || boundaryTeamIds.has(match.awayId);
  });

  return relevant;
};

interface ExploreResult {
  canQualify: boolean;
  canFail: boolean;
}

/**
 * 관련 잔여 경기 조합을 전수 탐색해 진출 가능 여부의 (canQualify, canFail) 를 구한다.
 * 관련 집합 밖의 잔여 경기는 미정(Scheduled) 그대로 baseMatches 에 남겨 넘긴다.
 */
const exploreExhaustive = (
  supportedTeamId: string,
  baseMatches: Match[],
  relevant: Match[],
  teams: Team[],
): ExploreResult => {
  let canQualify = false;
  let canFail = false;

  const total = 3 ** relevant.length;

  for (let combo = 0; combo < total; combo += 1) {
    let remainder = combo;
    const resolved = relevant.map((match) => {
      const outcome = ALL_OUTCOMES[remainder % 3];

      remainder = Math.floor(remainder / 3);

      return matchWithOutcome(match, outcome);
    });

    const scenarioMatches = [...baseMatches, ...resolved];

    if (qualifiesInScenario(supportedTeamId, scenarioMatches, teams)) {
      canQualify = true;
    } else {
      canFail = true;
    }

    if (canQualify && canFail) {
      break;
    }
  }

  return { canQualify, canFail };
};

/**
 * 응원국의 32강 진출 상태를 판정한다.
 *
 * 진출 = 조 1·2위(자동) 또는 조 3위이면서 3위 순위표 상위 8위 이내.
 *
 * 판정 로직:
 * - 잔여(Scheduled) 경기 중 응원국 진출에 실제 영향을 줄 수 있는 "관련 경기"로 범위를 좁힌다.
 * - 관련 경기 조합 수(3 ** n)가 한도(MAX_COMBINATIONS) 이내면 전수 탐색:
 *   - 모든 경우에서 진출 → Clinched / 모든 경우에서 탈락 → Eliminated / 그 외 → InContention.
 * - 한도를 초과해 전수 탐색이 불가능하면(경계 불확실) 거짓 확정 대신 보수적으로 InContention 을 반환한다.
 * - 모든 조별 경기가 끝났다면 결과는 결정적이다(현재 순위표로 바로 판정).
 */
export const evaluateQualification = (
  supportedTeamId: string,
  matches: Match[],
  teams: Team[],
): QualificationStatus => {
  const supportedTeam = teams.find((team) => team.id === supportedTeamId);

  if (!supportedTeam) {
    throw new Error(`supportedTeamId "${supportedTeamId}" 가 teams 에 존재하지 않습니다.`);
  }

  const pending = scheduledMatches(matches);

  // 모든 경기가 끝났으면 현재 순위표로 결정적 판정.
  if (pending.length === 0) {
    const qualified = qualifiesInScenario(supportedTeamId, matches, teams);

    return qualified ? QualificationStatus.Clinched : QualificationStatus.Eliminated;
  }

  const finished = nonScheduledMatches(matches);
  const relevant = collectRelevantMatches(supportedTeamId, pending, teams, finished);

  // 관련 경기 외 잔여 경기는 미정(Scheduled) 그대로 base 에 남겨둔다.
  const relevantIds = new Set(relevant.map((match) => match.id));
  const baseMatches = matches.filter((match) => !relevantIds.has(match.id));

  // 조합 수가 한도를 초과하면 전수 탐색 불가 → 거짓 확정 금지, 보수적으로 InContention.
  if (3 ** relevant.length > MAX_COMBINATIONS) {
    return QualificationStatus.InContention;
  }

  const { canQualify, canFail } = exploreExhaustive(
    supportedTeamId,
    baseMatches,
    relevant,
    teams,
  );

  if (canQualify && !canFail) {
    return QualificationStatus.Clinched;
  }

  if (!canQualify && canFail) {
    return QualificationStatus.Eliminated;
  }

  return QualificationStatus.InContention;
};

/**
 * 응원국의 진출/탈락(3위 순위 컷)에 영향을 줄 수 있는 잔여 경기들의 id 를 추린다.
 *
 * evaluateQualification 과 동일한 scoping 함수(collectRelevantMatches)를 공유한다:
 * - 응원국이 속한 조의 잔여 경기(조 순위/3위 자리 결정).
 * - 응원국이 cut-contender(현재 rank 2~4)면, 3위 컷 비교에 영향을 줄 수 있는
 *   다른 조들의 경계 팀(rank 2~4)이 포함된 잔여 경기.
 *
 * 배너 verdict(evaluateQualification)와 시뮬레이터가 같은 관련 경기 집합을 쓰도록 보장한다.
 */
export const findRelevantMatches = (
  supportedTeamId: string,
  matches: Match[],
  teams: Team[],
): string[] => {
  const pending = scheduledMatches(matches);
  const finished = nonScheduledMatches(matches);

  return collectRelevantMatches(supportedTeamId, pending, teams, finished).map(
    (match) => match.id,
  );
};

/**
 * 응원국이 진출하게 되는 잔여 경기 결과 조합을 하나 찾는다("이런 결과면 진출" 예시).
 *
 * - 반환: 관련 잔여 경기 id → 가정 결과(MatchOutcome) 매핑.
 *   - 이미 진출 확정/조건 불필요(조 1·2위 등)면 빈 Map.
 *   - 어떤 조합으로도 진출 불가(탈락 확정)면 null.
 * - 관련 경기로 범위를 좁혀(collectRelevantMatches) 탐색한다. 조합 수가 한도(MAX_COMBINATIONS)
 *   이내면 전수 탐색으로 진출하는 첫 조합을 반환, 초과 시 경기별 greedy 로 근사한 조합을 시도한다.
 */
export const findQualifyingScenario = (
  supportedTeamId: string,
  matches: Match[],
  teams: Team[],
): Map<string, MatchOutcome> | null => {
  const pending = scheduledMatches(matches);

  // 잔여 경기가 없으면 현재 순위표로 결정적. 진출이면 빈 Map, 아니면 null.
  if (pending.length === 0) {
    return qualifiesInScenario(supportedTeamId, matches, teams) ? new Map() : null;
  }

  const finished = nonScheduledMatches(matches);
  const relevant = collectRelevantMatches(supportedTeamId, pending, teams, finished);

  // 관련(영향) 경기가 없으면 잔여 결과와 무관하게 현재 상태로 진출 여부가 정해진다.
  if (relevant.length === 0) {
    return qualifiesInScenario(supportedTeamId, matches, teams) ? new Map() : null;
  }

  const relevantIds = new Set(relevant.map((match) => match.id));
  const baseMatches = matches.filter((match) => !relevantIds.has(match.id));

  // 조합 수가 한도 이내면 전수 탐색으로 진출하는 첫 조합을 찾는다.
  if (3 ** relevant.length <= MAX_COMBINATIONS) {
    const total = 3 ** relevant.length;

    for (let combo = 0; combo < total; combo += 1) {
      let remainder = combo;
      const overrides = new Map<string, MatchOutcome>();
      const resolved = relevant.map((match) => {
        const outcome = ALL_OUTCOMES[remainder % 3];

        remainder = Math.floor(remainder / 3);

        overrides.set(match.id, outcome);

        return matchWithOutcome(match, outcome);
      });

      const scenarioMatches = [...baseMatches, ...resolved];

      if (qualifiesInScenario(supportedTeamId, scenarioMatches, teams)) {
        return overrides;
      }
    }

    return null;
  }

  // 한도 초과: 경기별 greedy — 각 관련 경기를 응원국 3위 순위가 가장 좋아지는 결과로 누적한다.
  const greedy = new Map<string, MatchOutcome>();

  relevant.forEach((match) => {
    let best = ALL_OUTCOMES[0];
    let bestRank = Number.MAX_SAFE_INTEGER;

    ALL_OUTCOMES.forEach((outcome) => {
      const trial = new Map(greedy);

      trial.set(match.id, outcome);

      const scenarioMatches = applyScenario(matches, trial);
      const rank = supportedThirdRank(supportedTeamId, scenarioMatches, teams);

      if (rank < bestRank) {
        bestRank = rank;
        best = outcome;
      }
    });

    greedy.set(match.id, best);
  });

  const greedyMatches = applyScenario(matches, greedy);

  return qualifiesInScenario(supportedTeamId, greedyMatches, teams) ? greedy : null;
};
