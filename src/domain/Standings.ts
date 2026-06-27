import { Match, Standing, Team } from './Models';
import { MatchStatus } from './MatchStatus';

/** 집계 대상(Finished 또는 Live) 경기만 추린다. */
const countableMatches = (matches: Match[]): Match[] => {
  return matches.filter(
    (match) => match.status === MatchStatus.Finished || match.status === MatchStatus.Live,
  );
};

interface Tally {
  teamId: string;
  group: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
}

const createTally = (teamId: string, group: string): Tally => ({
  teamId,
  group,
  played: 0,
  won: 0,
  drawn: 0,
  lost: 0,
  goalsFor: 0,
  goalsAgainst: 0,
  points: 0,
});

/** 한 경기 결과를 home/away 두 팀의 집계에 반영한다. */
const applyMatch = (tally: Map<string, Tally>, match: Match): void => {
  const home = tally.get(match.homeId);
  const away = tally.get(match.awayId);

  if (!home || !away) {
    return;
  }

  home.played += 1;
  away.played += 1;
  home.goalsFor += match.homeGoals;
  home.goalsAgainst += match.awayGoals;
  away.goalsFor += match.awayGoals;
  away.goalsAgainst += match.homeGoals;

  if (match.homeGoals > match.awayGoals) {
    home.won += 1;
    home.points += 3;
    away.lost += 1;
  } else if (match.homeGoals < match.awayGoals) {
    away.won += 1;
    away.points += 3;
    home.lost += 1;
  } else {
    home.drawn += 1;
    away.drawn += 1;
    home.points += 1;
    away.points += 1;
  }
};

interface HeadToHead {
  points: number;
  goalDiff: number;
  goalsFor: number;
}

/**
 * 동률 팀들끼리의 맞대결 미니 순위를 계산한다.
 * 동률 팀들 사이의 경기만 모아 맞대결 승점/골득실/다득점을 집계한다.
 */
const computeHeadToHead = (
  tiedTeamIds: string[],
  matches: Match[],
): Map<string, HeadToHead> => {
  const tiedSet = new Set(tiedTeamIds);
  const result = new Map<string, HeadToHead>();

  tiedTeamIds.forEach((teamId) => {
    result.set(teamId, { points: 0, goalDiff: 0, goalsFor: 0 });
  });

  matches.forEach((match) => {
    if (!tiedSet.has(match.homeId) || !tiedSet.has(match.awayId)) {
      return;
    }

    const home = result.get(match.homeId)!;
    const away = result.get(match.awayId)!;

    home.goalsFor += match.homeGoals;
    home.goalDiff += match.homeGoals - match.awayGoals;
    away.goalsFor += match.awayGoals;
    away.goalDiff += match.awayGoals - match.homeGoals;

    if (match.homeGoals > match.awayGoals) {
      home.points += 3;
    } else if (match.homeGoals < match.awayGoals) {
      away.points += 3;
    } else {
      home.points += 1;
      away.points += 1;
    }
  });

  return result;
};

/**
 * 한 조의 경기 결과로부터 순위표를 계산한다.
 *
 * - 집계 대상 경기: 상태가 Finished 또는 Live 인 경기(라이브는 현재 스코어로 잠정 반영).
 *   Scheduled 경기는 집계하지 않는다.
 * - 승점: 승 3 / 무 1 / 패 0.
 * - 정렬(2026 규칙):
 *   1) 승점
 *   2) (승점 동률 그룹 내) 승자승 — 동률팀 간 맞대결 승점 → 골득실 → 다득점
 *   3) 전체 골득실차
 *   4) 전체 다득점
 *   5) FIFA 랭킹(낮을수록 상위) → teamId (결정성 보장용 최종 타이브레이커)
 * - 반환: rankInGroup(1부터) 가 채워진 Standing[] (정렬된 상태).
 *
 * ⚠️ 승자승은 동률 그룹 전체의 맞대결 미니테이블을 1회 적용하는 근사다.
 *    3팀 이상 동률에서 "미니테이블 적용 후 여전히 남은 부분 동률 팀들끼리
 *    다시 승자승부터 재적용"하는 재귀 재계산은 미구현(MVP 근사). 2팀 동률은 정확.
 */
export const computeGroupStandings = (matches: Match[], teams: Team[]): Standing[] => {
  const relevantMatches = countableMatches(matches);
  const tally = new Map<string, Tally>();

  teams.forEach((team) => {
    tally.set(team.id, createTally(team.id, team.group));
  });

  relevantMatches.forEach((match) => {
    applyMatch(tally, match);
  });

  const fifaById = new Map<string, number>();
  teams.forEach((team) => {
    fifaById.set(team.id, team.fifaRanking ?? Number.MAX_SAFE_INTEGER);
  });

  const standings: Standing[] = teams.map((team) => {
    const item = tally.get(team.id)!;

    return {
      teamId: item.teamId,
      group: item.group,
      played: item.played,
      won: item.won,
      drawn: item.drawn,
      lost: item.lost,
      goalsFor: item.goalsFor,
      goalsAgainst: item.goalsAgainst,
      goalDiff: item.goalsFor - item.goalsAgainst,
      points: item.points,
      rankInGroup: 0,
    };
  });

  // 승점이 동률인 팀들의 맞대결 캐시. 비교 함수에서 재사용한다.
  const headToHeadCache = new Map<string, Map<string, HeadToHead>>();

  const getHeadToHead = (points: number): Map<string, HeadToHead> => {
    const key = String(points);
    const cached = headToHeadCache.get(key);

    if (cached) {
      return cached;
    }

    const tiedTeamIds = standings.filter((s) => s.points === points).map((s) => s.teamId);
    const computed = computeHeadToHead(tiedTeamIds, relevantMatches);

    headToHeadCache.set(key, computed);

    return computed;
  };

  standings.sort((a, b) => {
    if (a.points !== b.points) {
      return b.points - a.points;
    }

    // 승점 동률 → 승자승(head-to-head) 우선
    const h2h = getHeadToHead(a.points);
    const aH2h = h2h.get(a.teamId);
    const bH2h = h2h.get(b.teamId);

    if (aH2h && bH2h) {
      if (aH2h.points !== bH2h.points) {
        return bH2h.points - aH2h.points;
      }

      if (aH2h.goalDiff !== bH2h.goalDiff) {
        return bH2h.goalDiff - aH2h.goalDiff;
      }

      if (aH2h.goalsFor !== bH2h.goalsFor) {
        return bH2h.goalsFor - aH2h.goalsFor;
      }
    }

    if (a.goalDiff !== b.goalDiff) {
      return b.goalDiff - a.goalDiff;
    }

    if (a.goalsFor !== b.goalsFor) {
      return b.goalsFor - a.goalsFor;
    }

    const aFifa = fifaById.get(a.teamId) ?? Number.MAX_SAFE_INTEGER;
    const bFifa = fifaById.get(b.teamId) ?? Number.MAX_SAFE_INTEGER;

    if (aFifa !== bFifa) {
      return aFifa - bFifa;
    }

    return a.teamId.localeCompare(b.teamId);
  });

  standings.forEach((standing, index) => {
    standing.rankInGroup = index + 1;
  });

  return standings;
};

/**
 * 전체 경기/팀으로부터 조별 순위표 맵(조 → Standing[])을 만든다.
 */
export const computeAllGroupStandings = (
  matches: Match[],
  teams: Team[],
): Map<string, Standing[]> => {
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

  const result = new Map<string, Standing[]>();

  teamsByGroup.forEach((groupTeams, group) => {
    const groupMatches = matchesByGroup.get(group) ?? [];

    result.set(group, computeGroupStandings(groupMatches, groupTeams));
  });

  return result;
};
