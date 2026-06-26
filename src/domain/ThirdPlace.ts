import { Standing, Team, ThirdPlaceRow } from './Models';

/**
 * 조별 순위표 맵에서 각 조 3위(rankInGroup === 3) Standing 을 추출한다.
 * 3위가 아직 정해지지 않은 조(경기 부족 등)는 그대로 3위 자리 팀을 사용한다.
 */
export const selectThirdPlacedStandings = (
  standingsByGroup: Map<string, Standing[]>,
): Standing[] => {
  const result: Standing[] = [];

  standingsByGroup.forEach((standings) => {
    const third = standings.find((standing) => standing.rankInGroup === 3);

    if (third) {
      result.push(third);
    }
  });

  return result;
};

/**
 * 두 3위 기록을 줄세우는 공용 비교 함수.
 *
 * - 조가 달라 맞대결이 없으므로 전체 성적으로만 비교.
 * - 정렬 기준: 승점 → 골득실차 → 다득점 → FIFA 랭킹(낮을수록 상위) → group(결정성 보장).
 * - 음수면 a 가 위(앞), 양수면 b 가 위.
 *
 * rankThirdPlaceTeams 와 진출 조건 분석(classifyRivalGroup)이 동일 기준을 쓰도록 공유한다.
 */
export const compareThirdPlaceRecords = (
  a: Standing,
  b: Standing,
  teamsById: Map<string, Team>,
): number => {
  if (a.points !== b.points) {
    return b.points - a.points;
  }

  if (a.goalDiff !== b.goalDiff) {
    return b.goalDiff - a.goalDiff;
  }

  if (a.goalsFor !== b.goalsFor) {
    return b.goalsFor - a.goalsFor;
  }

  const aFifa = teamsById.get(a.teamId)?.fifaRanking ?? Number.MAX_SAFE_INTEGER;
  const bFifa = teamsById.get(b.teamId)?.fifaRanking ?? Number.MAX_SAFE_INTEGER;

  if (aFifa !== bFifa) {
    return aFifa - bFifa;
  }

  return a.group.localeCompare(b.group);
};

/**
 * 3위 팀들을 줄세워 상위 8팀 진출 여부를 표시한다.
 *
 * - 조가 달라 맞대결이 없으므로 전체 성적으로만 비교.
 * - 정렬: 승점 → 골득실차 → 다득점 → FIFA 랭킹(낮을수록 상위) → group(결정성 보장).
 * - 반환: thirdPlaceRank(1부터), qualifies(rank <= 8) 가 채워진 ThirdPlaceRow[].
 */
export const rankThirdPlaceTeams = (
  thirdStandings: Standing[],
  teams: Team[],
): ThirdPlaceRow[] => {
  const teamsById = new Map<string, Team>();

  teams.forEach((team) => {
    teamsById.set(team.id, team);
  });

  const sorted = [...thirdStandings].sort((a, b) => {
    return compareThirdPlaceRecords(a, b, teamsById);
  });

  return sorted.map((standing, index) => {
    const thirdPlaceRank = index + 1;

    return {
      ...standing,
      thirdPlaceRank,
      qualifies: thirdPlaceRank <= 8,
    };
  });
};
