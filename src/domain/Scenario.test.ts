import { describe, it, expect } from 'vitest';
import { applyScenario, outcomeToGoals } from './Scenario';
import { MatchOutcome } from './MatchOutcome';
import { MatchStatus } from './MatchStatus';
import { computeGroupStandings } from './Standings';
import { makeTeam, makeMatch } from './TestHelpers';

describe('outcomeToGoals', () => {
  it('승/무/패를 대표 스코어로 변환한다', () => {
    expect(outcomeToGoals(MatchOutcome.HomeWin)).toEqual({ homeGoals: 1, awayGoals: 0 });
    expect(outcomeToGoals(MatchOutcome.AwayWin)).toEqual({ homeGoals: 0, awayGoals: 1 });
    expect(outcomeToGoals(MatchOutcome.Draw)).toEqual({ homeGoals: 0, awayGoals: 0 });
  });
});

describe('applyScenario', () => {
  it('지정한 경기를 가정 결과로 덮어쓰고 Finished 로 만든다', () => {
    const scheduled = makeMatch('A', 'A1', 'A2', 0, 0, MatchStatus.Scheduled);
    const other = makeMatch('A', 'A3', 'A4', 2, 1, MatchStatus.Finished);
    const overrides = new Map([[scheduled.id, MatchOutcome.HomeWin]]);

    const result = applyScenario([scheduled, other], overrides);
    const applied = result.find((m) => m.id === scheduled.id)!;

    expect(applied.status).toBe(MatchStatus.Finished);
    expect(applied.homeGoals).toBe(1);
    expect(applied.awayGoals).toBe(0);
  });

  it('원본 배열/객체를 변형하지 않는다(불변)', () => {
    const scheduled = makeMatch('A', 'A1', 'A2', 0, 0, MatchStatus.Scheduled);
    const overrides = new Map([[scheduled.id, MatchOutcome.AwayWin]]);

    applyScenario([scheduled], overrides);

    expect(scheduled.status).toBe(MatchStatus.Scheduled);
  });

  it('존재하지 않는 matchId 는 무시하고, override 없는 경기는 그대로 둔다', () => {
    const finished = makeMatch('A', 'A1', 'A2', 1, 1, MatchStatus.Finished);
    const overrides = new Map([['없는id', MatchOutcome.HomeWin]]);

    const result = applyScenario([finished], overrides);

    expect(result).toHaveLength(1);
    expect(result[0].status).toBe(MatchStatus.Finished);
    expect(result[0].homeGoals).toBe(1);
    expect(result[0].awayGoals).toBe(1);
  });

  it('적용 결과가 순위 계산에 반영된다', () => {
    const teams = [
      makeTeam('A1', 'A', 10),
      makeTeam('A2', 'A', 20),
      makeTeam('A3', 'A', 30),
      makeTeam('A4', 'A', 40),
    ];
    const pending = makeMatch('A', 'A1', 'A2', 0, 0, MatchStatus.Scheduled);
    const base = [
      makeMatch('A', 'A1', 'A3', 1, 0),
      makeMatch('A', 'A2', 'A4', 1, 0),
      pending,
    ];

    // 가정 전: A1, A2 각 3점, pending 미집계
    const before = computeGroupStandings(base, teams);

    expect(before.find((s) => s.teamId === 'A1')!.points).toBe(3);

    // A1 이 A2 를 이긴다고 가정 → A1 6점
    const after = computeGroupStandings(
      applyScenario(base, new Map([[pending.id, MatchOutcome.HomeWin]])),
      teams,
    );

    expect(after.find((s) => s.teamId === 'A1')!.points).toBe(6);
    expect(after.find((s) => s.teamId === 'A2')!.points).toBe(3);
  });
});
