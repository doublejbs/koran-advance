import { Match, Standing, Team } from './Models';
import { MatchOutcome } from './MatchOutcome';
import { MatchStatus } from './MatchStatus';
import { OutcomeEffect } from './OutcomeEffect';
import { RivalGroupState } from './RivalGroupState';
import { SupportedQualState } from './SupportedQualState';
import { applyScenario } from './Scenario';
import { computeGroupStandings } from './Standings';
import { compareThirdPlaceRecords } from './ThirdPlace';

/** 진출권 슬롯 수(상위 8팀). 테스트 용이성을 위해 파라미터로 분리. */
export const DEFAULT_QUALIFYING_SLOTS = 8;

/** 한 결과에 대한 유불리 판정. */
export interface OutcomeVerdict {
  outcome: MatchOutcome;
  effect: OutcomeEffect;
}

/**
 * 한 잔여 경기에 대한 응원 힌트.
 * - favorable = (유일하게) 우리에게 유리한 결과. 유리한 결과가 유일하지 않으면 null.
 * - outcomes = 세 결과(홈승/원정승/무) 각각의 유불리 판정 — "결과별 정리"에 사용.
 */
export interface MatchHint {
  matchId: string;
  homeId: string;
  awayId: string;
  favorable: MatchOutcome | null;
  outcomes: OutcomeVerdict[];
}

/** 한 라이벌 조(다른 조)의 3위 자리가 우리 대비 어떤 상태인지. */
export interface RivalGroupCondition {
  group: string;
  state: RivalGroupState;
  currentThirdTeamId: string | null;
  pendingMatchIds: string[];
  hints: MatchHint[];
}

/** 3위 경합 판정 요약(승점 산수 부분). */
export interface VerdictSummary {
  status: SupportedQualState; // Clinched | Eliminated | Contending 중 하나
  allowedLosses: number; // 추가로 우리 위로 올라와도 되는 swing 조 수 = (slots-1) - lockedAbove
}

/** 진출 조건 보드 전체 분석 결과. */
export interface QualificationConditions {
  status: SupportedQualState;
  supportedThirdPlaceRank: number | null; // 현재(잠정) 3위표 순위
  lockedAboveCount: number; // 우리보다 위 확정 3위팀 수
  swingCount: number;
  allowedLosses: number;
  swingGroups: RivalGroupCondition[];
  alreadyAboveGroups: string[];
  safeBelowGroups: string[];
}

/**
 * 3위 경합 판정(승점 산수).
 * - allowedLosses = (qualifyingSlots - 1) - lockedAboveCount
 * - allowedLosses < 0 → Eliminated / allowedLosses >= swingCount → Clinched / 그 외 → Contending
 */
export const summarizeVerdict = (
  lockedAboveCount: number,
  swingCount: number,
  qualifyingSlots: number,
): VerdictSummary => {
  const allowedLosses = qualifyingSlots - 1 - lockedAboveCount;

  if (allowedLosses < 0) {
    return { status: SupportedQualState.Eliminated, allowedLosses };
  }

  if (allowedLosses >= swingCount) {
    return { status: SupportedQualState.Clinched, allowedLosses };
  }

  return { status: SupportedQualState.Contending, allowedLosses };
};

/** 모든 결과 조합 enumerate 시 한 자리에 들어갈 가능한 결과들. */
const ALL_OUTCOMES: MatchOutcome[] = [
  MatchOutcome.HomeWin,
  MatchOutcome.AwayWin,
  MatchOutcome.Draw,
];

/**
 * 주어진 경기 집합에서 그 조 3위(rankInGroup === 3) 팀이 supportedRecord 보다 위인지 본다.
 * compareThirdPlaceRecords < 0 이면 그 3위가 위(우리에게 불리).
 */
const rivalThirdIsAbove = (
  supportedRecord: Standing,
  scenarioMatches: Match[],
  groupTeams: Team[],
  teamsById: Map<string, Team>,
): boolean => {
  const standings = computeGroupStandings(scenarioMatches, groupTeams);
  const third = standings.find((standing) => standing.rankInGroup === 3);

  if (!third) {
    return false;
  }

  return compareThirdPlaceRecords(third, supportedRecord, teamsById) < 0;
};

/**
 * 한 라이벌 조의 잔여 경기 결과 조합을 모두 따져, 그 조 3위가 우리(supportedRecord) 대비
 * 항상 위 / 항상 아래 / 갈림(Swing) 중 무엇인지 분류하고, 경기별 응원 힌트를 만든다.
 *
 * - 비교(우리보다 위/아래)는 3위 순위표와 동일한 기준(승점→골득실→다득점→FIFA랭킹→조)으로 한다.
 * - hints[].favorable: 그 경기를 해당 결과로 두면 (다른 잔여 경기 결과와 무관하게) 이 조 3위가
 *   우리 아래로 내려가는 게 보장되는 결과. 그런 결과가 없으면 null.
 */
export const classifyRivalGroup = (
  supportedRecord: Standing,
  groupMatches: Match[],
  groupTeams: Team[],
  teamsById: Map<string, Team>,
): RivalGroupCondition => {
  const group = groupTeams[0]?.group ?? '';
  // Scheduled 뿐 아니라 Live(진행 중) 경기도 아직 결과가 정해지지 않은 "변수"로 보아 enumerate 한다.
  const pending = groupMatches.filter(
    (match) => match.status === MatchStatus.Scheduled || match.status === MatchStatus.Live,
  );
  const pendingMatchIds = pending.map((match) => match.id);

  // 현재(pending 미적용) 그 조 3위 팀 id.
  const currentStandings = computeGroupStandings(groupMatches, groupTeams);
  const currentThird = currentStandings.find((standing) => standing.rankInGroup === 3);
  const currentThirdTeamId = currentThird ? currentThird.teamId : null;

  // 잔여 경기가 없으면 현재 상태로 위/아래만 판정.
  if (pending.length === 0) {
    const above = rivalThirdIsAbove(supportedRecord, groupMatches, groupTeams, teamsById);

    return {
      group,
      state: above ? RivalGroupState.AlreadyAbove : RivalGroupState.AlwaysBelow,
      currentThirdTeamId,
      pendingMatchIds,
      hints: [],
    };
  }

  // 모든 결과 조합(3^pending)을 enumerate 해 각 조합에서 그 조 3위가 우리보다 위인지 기록한다.
  const total = 3 ** pending.length;
  const comboAbove: boolean[] = [];

  for (let combo = 0; combo < total; combo += 1) {
    let remainder = combo;
    const overrides = new Map<string, MatchOutcome>();

    pending.forEach((match) => {
      const outcome = ALL_OUTCOMES[remainder % 3];

      remainder = Math.floor(remainder / 3);

      overrides.set(match.id, outcome);
    });

    const scenarioMatches = applyScenario(groupMatches, overrides);

    comboAbove.push(rivalThirdIsAbove(supportedRecord, scenarioMatches, groupTeams, teamsById));
  }

  const allAbove = comboAbove.every((above) => above);
  const allBelow = comboAbove.every((above) => !above);

  let state: RivalGroupState;

  if (allAbove) {
    state = RivalGroupState.AlreadyAbove;
  } else if (allBelow) {
    state = RivalGroupState.AlwaysBelow;
  } else {
    state = RivalGroupState.Swing;
  }

  // 경기별 힌트: 그 경기 자리를 각 결과로 고정한 모든 조합에서 이 조 3위가
  // 항상 우리 아래(Favorable) / 항상 우리 위(Unfavorable) / 섞임(Conditional)인지 판정한다.
  // favorable 는 effect===Favorable 인 결과가 유일할 때 그 outcome, 아니면 null.
  const hints: MatchHint[] = pending.map((match, matchIndex) => {
    const divisor = 3 ** matchIndex;
    const favorableOutcomes: MatchOutcome[] = [];

    const outcomes: OutcomeVerdict[] = ALL_OUTCOMES.map((outcome, outcomeIndex) => {
      // 이 경기 자리가 outcomeIndex 인 조합들에서 3위가 위로 가는 경우/아래로 가는 경우를 모은다.
      let anyAbove = false;
      let anyBelow = false;

      for (let combo = 0; combo < total; combo += 1) {
        const slot = Math.floor(combo / divisor) % 3;

        if (slot !== outcomeIndex) {
          continue;
        }

        if (comboAbove[combo]) {
          anyAbove = true;
        } else {
          anyBelow = true;
        }
      }

      let effect: OutcomeEffect;

      if (anyAbove && anyBelow) {
        effect = OutcomeEffect.Conditional;
      } else if (anyAbove) {
        effect = OutcomeEffect.Unfavorable;
      } else {
        effect = OutcomeEffect.Favorable;
      }

      if (effect === OutcomeEffect.Favorable) {
        favorableOutcomes.push(outcome);
      }

      return { outcome, effect };
    });

    return {
      matchId: match.id,
      homeId: match.homeId,
      awayId: match.awayId,
      favorable: favorableOutcomes.length === 1 ? favorableOutcomes[0] : null,
      outcomes,
    };
  });

  return {
    group,
    state,
    currentThirdTeamId,
    pendingMatchIds,
    hints,
  };
};

/**
 * 응원국 진출 조건 보드 분석.
 *
 * 전제: 응원국이 조 3위로 (대체로) 확정인 상황에서, 다른 조 3위들이 우리 위로 가는지를 본다.
 * - 응원국이 조 1·2위 → AutoQualified, 3위가 아님(4위 등) → NotThird.
 * - 3위면: 다른 11개 조를 classifyRivalGroup 으로 분류 → lockedAbove/swing 집계 →
 *   summarizeVerdict 로 status·allowedLosses 산출.
 */
export const analyzeQualificationConditions = (
  supportedTeamId: string,
  matches: Match[],
  teams: Team[],
  qualifyingSlots: number = DEFAULT_QUALIFYING_SLOTS,
): QualificationConditions => {
  const empty: QualificationConditions = {
    status: SupportedQualState.NotThird,
    supportedThirdPlaceRank: null,
    lockedAboveCount: 0,
    swingCount: 0,
    allowedLosses: 0,
    swingGroups: [],
    alreadyAboveGroups: [],
    safeBelowGroups: [],
  };

  const supportedTeam = teams.find((team) => team.id === supportedTeamId);

  if (!supportedTeam) {
    return empty;
  }

  const teamsById = new Map<string, Team>();

  teams.forEach((team) => {
    teamsById.set(team.id, team);
  });

  // 조별 팀·경기 분류.
  const teamsByGroup = new Map<string, Team[]>();
  const matchesByGroup = new Map<string, Match[]>();

  teams.forEach((team) => {
    const list = teamsByGroup.get(team.group) ?? [];

    list.push(team);
    teamsByGroup.set(team.group, list);
  });

  matches.forEach((match) => {
    const list = matchesByGroup.get(match.group) ?? [];

    list.push(match);
    matchesByGroup.set(match.group, list);
  });

  const supportedGroup = supportedTeam.group;
  const supportedGroupTeams = teamsByGroup.get(supportedGroup) ?? [];
  const supportedGroupMatches = matchesByGroup.get(supportedGroup) ?? [];

  const supportedStandings = computeGroupStandings(supportedGroupMatches, supportedGroupTeams);
  const supportedStanding = supportedStandings.find(
    (standing) => standing.teamId === supportedTeamId,
  );

  // 조 1·2위 → 자동 진출.
  if (supportedStanding && supportedStanding.rankInGroup <= 2) {
    return { ...empty, status: SupportedQualState.AutoQualified };
  }

  // 3위가 아니면(4위 등) NotThird.
  if (!supportedStanding || supportedStanding.rankInGroup !== 3) {
    return empty;
  }

  // 현재(잠정) 3위표에서 응원국 순위 산출.
  const allThirds: Standing[] = [];

  teamsByGroup.forEach((groupTeams, group) => {
    const groupMatches = matchesByGroup.get(group) ?? [];
    const standings = computeGroupStandings(groupMatches, groupTeams);
    const third = standings.find((standing) => standing.rankInGroup === 3);

    if (third) {
      allThirds.push(third);
    }
  });

  const sortedThirds = [...allThirds].sort((a, b) =>
    compareThirdPlaceRecords(a, b, teamsById),
  );
  const supportedThirdIndex = sortedThirds.findIndex(
    (standing) => standing.teamId === supportedTeamId,
  );
  const supportedThirdPlaceRank = supportedThirdIndex >= 0 ? supportedThirdIndex + 1 : null;

  // 응원국 조를 제외한 나머지 조마다 라이벌 3위 분류.
  let lockedAboveCount = 0;
  const swingGroups: RivalGroupCondition[] = [];
  const alreadyAboveGroups: string[] = [];
  const safeBelowGroups: string[] = [];

  const groupNames = [...teamsByGroup.keys()].sort((a, b) => a.localeCompare(b));

  groupNames.forEach((group) => {
    if (group === supportedGroup) {
      return;
    }

    const groupTeams = teamsByGroup.get(group) ?? [];
    const groupMatches = matchesByGroup.get(group) ?? [];
    const condition = classifyRivalGroup(
      supportedStanding,
      groupMatches,
      groupTeams,
      teamsById,
    );

    if (condition.state === RivalGroupState.AlreadyAbove) {
      lockedAboveCount += 1;
      alreadyAboveGroups.push(group);
    } else if (condition.state === RivalGroupState.Swing) {
      swingGroups.push(condition);
    } else {
      safeBelowGroups.push(group);
    }
  });

  const swingCount = swingGroups.length;
  const verdict = summarizeVerdict(lockedAboveCount, swingCount, qualifyingSlots);

  return {
    status: verdict.status,
    supportedThirdPlaceRank,
    lockedAboveCount,
    swingCount,
    allowedLosses: verdict.allowedLosses,
    swingGroups,
    alreadyAboveGroups,
    safeBelowGroups,
  };
};
