import { describe, it, expect } from 'vitest';
import { classifyRivalGroup, summarizeVerdict } from './QualificationConditions';
import { RivalGroupState } from './RivalGroupState';
import { SupportedQualState } from './SupportedQualState';
import { MatchOutcome } from './MatchOutcome';
import { OutcomeEffect } from './OutcomeEffect';
import { MatchStatus } from './MatchStatus';
import { makeTeam, makeMatch, makeThirdStanding } from './TestHelpers';

describe('summarizeVerdict', () => {
  it('모든 swing 이 우리 위로 가도 8자리 안 → 진출 확정', () => {
    const result = summarizeVerdict(0, 3, 8);

    expect(result.status).toBe(SupportedQualState.Clinched);
    expect(result.allowedLosses).toBe(7);
  });

  it('이미 8팀이 위 확정 → 탈락 확정', () => {
    const result = summarizeVerdict(8, 0, 8);

    expect(result.status).toBe(SupportedQualState.Eliminated);
    expect(result.allowedLosses).toBeLessThan(0);
  });

  it('여유(allowedLosses)보다 swing 이 많으면 경합 중', () => {
    const result = summarizeVerdict(7, 2, 8);

    expect(result.status).toBe(SupportedQualState.Contending);
    expect(result.allowedLosses).toBe(0);
  });

  it('슬롯 파라미터를 따른다 (slots=2)', () => {
    expect(summarizeVerdict(1, 0, 2).status).toBe(SupportedQualState.Clinched);
    expect(summarizeVerdict(2, 0, 2).status).toBe(SupportedQualState.Eliminated);
  });
});

// 라이벌 조 B: B1, B2 가 상위, 3위 자리는 잔여 경기 B3 vs B4 로 갈림.
const buildRivalGroupB = () => {
  const groupTeams = [
    makeTeam('B1', 'B', 10),
    makeTeam('B2', 'B', 20),
    makeTeam('B3', 'B', 30),
    makeTeam('B4', 'B', 40),
  ];
  const pending = makeMatch('B', 'B3', 'B4', 0, 0, MatchStatus.Scheduled);
  const groupMatches = [
    makeMatch('B', 'B1', 'B2', 1, 0),
    makeMatch('B', 'B1', 'B3', 1, 0),
    makeMatch('B', 'B1', 'B4', 1, 0),
    makeMatch('B', 'B2', 'B3', 1, 0),
    makeMatch('B', 'B2', 'B4', 1, 0),
    pending,
  ];
  const teamsById = new Map(groupTeams.map((t) => [t.id, t]));

  return { groupTeams, groupMatches, teamsById, pendingId: pending.id };
};

describe('classifyRivalGroup', () => {
  it('우리가 약하면(승점 같고 골득실 열세) 라이벌 3위가 위로 갈 수 있어 Swing, 무승부가 유리', () => {
    const { groupTeams, groupMatches, teamsById, pendingId } = buildRivalGroupB();
    // 우리: 3점, 골득실 -2, 다득점 1 (약한 3위)
    const supported = makeThirdStanding('KOR', 'A', 3, -2, 1);

    const cond = classifyRivalGroup(supported, groupMatches, groupTeams, teamsById);

    // B3 win / B4 win → 그 3위팀 3점·골득실 -1 로 우리(-2)보다 위, 무승부 → 1점으로 우리 아래
    expect(cond.state).toBe(RivalGroupState.Swing);
    expect(cond.pendingMatchIds).toEqual([pendingId]);

    const hint = cond.hints.find((h) => h.matchId === pendingId)!;

    expect(hint.favorable).toBe(MatchOutcome.Draw);
    // 결과별 정리: 단일 잔여 경기이므로 각 결과가 확정적으로 유불리
    expect(hint.outcomes).toEqual([
      { outcome: MatchOutcome.HomeWin, effect: OutcomeEffect.Unfavorable },
      { outcome: MatchOutcome.AwayWin, effect: OutcomeEffect.Unfavorable },
      { outcome: MatchOutcome.Draw, effect: OutcomeEffect.Favorable },
    ]);
  });

  it('lockedTopTwoTeamIds 는 항상 1·2위인 팀, thirdCandidateTeamIds 는 3위 후보 팀', () => {
    const { groupTeams, groupMatches, teamsById } = buildRivalGroupB();
    const supported = makeThirdStanding('KOR', 'A', 3, -2, 1);

    const cond = classifyRivalGroup(supported, groupMatches, groupTeams, teamsById);

    // B1·B2 는 어떤 결과든 1·2위 확정
    expect(cond.lockedTopTwoTeamIds).toEqual(['B1', 'B2']);
    // 잔여 B3 vs B4 결과에 따라 3위 자리는 B3 또는 B4
    expect(cond.thirdCandidateTeamIds).toContain('B3');
    expect(cond.thirdCandidateTeamIds).toContain('B4');
  });

  it('우리가 충분히 강하면 라이벌 3위가 어떤 결과든 아래 → AlwaysBelow', () => {
    const { groupTeams, groupMatches, teamsById } = buildRivalGroupB();
    // 우리: 3점, 골득실 +5 (강한 3위) → B의 3위(최대 3점·골득실 -1)는 항상 아래
    const supported = makeThirdStanding('KOR', 'A', 3, 5, 9);

    const cond = classifyRivalGroup(supported, groupMatches, groupTeams, teamsById);

    expect(cond.state).toBe(RivalGroupState.AlwaysBelow);
  });

  it('우리가 매우 약하면 라이벌 3위가 어떤 결과든 위 → AlreadyAbove', () => {
    const { groupTeams, groupMatches, teamsById } = buildRivalGroupB();
    // 우리: 0점 → B의 3위(최소 1점)는 항상 위
    const supported = makeThirdStanding('KOR', 'A', 0, -9, 0);

    const cond = classifyRivalGroup(supported, groupMatches, groupTeams, teamsById);

    expect(cond.state).toBe(RivalGroupState.AlreadyAbove);
  });

  it('진행 중(Live) 경기도 아직 미확정 변수로 보아 분류·힌트에 포함한다', () => {
    const groupTeams = [
      makeTeam('B1', 'B', 10),
      makeTeam('B2', 'B', 20),
      makeTeam('B3', 'B', 30),
      makeTeam('B4', 'B', 40),
    ];
    // B3 vs B4 가 진행 중(0-0 라이브) — Scheduled 가 아니라 Live
    const live = makeMatch('B', 'B3', 'B4', 0, 0, MatchStatus.Live);
    const groupMatches = [
      makeMatch('B', 'B1', 'B2', 1, 0),
      makeMatch('B', 'B1', 'B3', 1, 0),
      makeMatch('B', 'B1', 'B4', 1, 0),
      makeMatch('B', 'B2', 'B3', 1, 0),
      makeMatch('B', 'B2', 'B4', 1, 0),
      live,
    ];
    const teamsById = new Map(groupTeams.map((t) => [t.id, t]));
    const supported = makeThirdStanding('KOR', 'A', 3, -2, 1);

    const cond = classifyRivalGroup(supported, groupMatches, groupTeams, teamsById);

    expect(cond.state).toBe(RivalGroupState.Swing);
    expect(cond.pendingMatchIds).toContain(live.id);

    const hint = cond.hints.find((h) => h.matchId === live.id)!;

    expect(hint.favorable).toBe(MatchOutcome.Draw);
  });
});
