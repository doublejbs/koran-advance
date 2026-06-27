import { Match } from './Models';
import { MatchOutcome } from './MatchOutcome';
import { MatchStatus } from './MatchStatus';

/**
 * 가정 결과(outcome)를 대표 스코어로 변환한다.
 * - HomeWin → 1:0, AwayWin → 0:1, Draw → 0:0.
 * (시뮬레이터 MVP 는 승/무/패 단위. 골득실 정밀 입력은 추후 확장.)
 */
export const outcomeToGoals = (outcome: MatchOutcome): { homeGoals: number; awayGoals: number } => {
  if (outcome === MatchOutcome.HomeWin) {
    return { homeGoals: 1, awayGoals: 0 };
  }

  if (outcome === MatchOutcome.AwayWin) {
    return { homeGoals: 0, awayGoals: 1 };
  }

  return { homeGoals: 0, awayGoals: 0 };
};

/**
 * 일부 경기의 가정 결과(overrides)를 적용한 새 경기 집합을 만든다.
 *
 * - overrides 의 key 는 matchId, value 는 가정 결과(MatchOutcome).
 * - 해당 경기는 status=Finished + 대표 스코어로 덮어쓴다(원본 불변, 새 배열 반환).
 * - overrides 에 없는 경기는 그대로 둔다. 존재하지 않는 matchId 는 무시한다.
 */
export const applyScenario = (matches: Match[], overrides: Map<string, MatchOutcome>): Match[] => {
  return matches.map((match) => {
    const outcome = overrides.get(match.id);

    if (!outcome) {
      return match;
    }

    const { homeGoals, awayGoals } = outcomeToGoals(outcome);

    return {
      ...match,
      status: MatchStatus.Finished,
      homeGoals,
      awayGoals,
    };
  });
};
