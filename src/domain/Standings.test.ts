import { describe, it, expect } from 'vitest';
import { computeGroupStandings, computeAllGroupStandings } from './Standings';
import { makeTeam, makeMatch } from './TestHelpers';
import { MatchStatus } from './MatchStatus';

const groupTeams = (group: string) => [
  makeTeam(`${group}1`, group, 10),
  makeTeam(`${group}2`, group, 20),
  makeTeam(`${group}3`, group, 30),
  makeTeam(`${group}4`, group, 40),
];

describe('computeGroupStandings - 기본 정렬', () => {
  it('승점 순으로 정렬하고 rankInGroup 을 1부터 채운다', () => {
    const teams = groupTeams('A');
    const matches = [
      makeMatch('A', 'A1', 'A2', 1, 0),
      makeMatch('A', 'A1', 'A3', 1, 0),
      makeMatch('A', 'A1', 'A4', 1, 0),
      makeMatch('A', 'A2', 'A3', 1, 0),
      makeMatch('A', 'A2', 'A4', 1, 0),
      makeMatch('A', 'A3', 'A4', 1, 0),
    ];

    const standings = computeGroupStandings(matches, teams);

    expect(standings.map((s) => s.teamId)).toEqual(['A1', 'A2', 'A3', 'A4']);
    expect(standings.map((s) => s.rankInGroup)).toEqual([1, 2, 3, 4]);
    expect(standings[0].points).toBe(9);
    expect(standings[0].goalDiff).toBe(3);
    expect(standings[3].points).toBe(0);
  });
});

describe('computeGroupStandings - 타이브레이커', () => {
  it('승점·맞대결이 동률이면 전체 골득실로 가른다', () => {
    const teams = groupTeams('B');
    const matches = [
      makeMatch('B', 'B1', 'B2', 1, 1), // 맞대결 무승부
      makeMatch('B', 'B1', 'B3', 3, 0),
      makeMatch('B', 'B1', 'B4', 1, 0),
      makeMatch('B', 'B2', 'B3', 1, 0),
      makeMatch('B', 'B2', 'B4', 1, 0),
      makeMatch('B', 'B3', 'B4', 0, 0),
    ];

    const standings = computeGroupStandings(matches, teams);

    // B1, B2 모두 7점 + 맞대결 무승부 → 전체 골득실 B1(+4) > B2(+2)
    expect(standings[0].teamId).toBe('B1');
    expect(standings[1].teamId).toBe('B2');
  });

  it('2026 규칙: 승점 동률이면 전체 골득실보다 승자승(맞대결)이 우선', () => {
    const teams = groupTeams('C');
    const matches = [
      makeMatch('C', 'C1', 'C2', 2, 1), // C1 이 C2 에 승 (맞대결)
      makeMatch('C', 'C1', 'C3', 2, 1), // C1 승
      makeMatch('C', 'C4', 'C1', 1, 0), // C1 패
      makeMatch('C', 'C2', 'C3', 3, 2), // C2 승
      makeMatch('C', 'C2', 'C4', 1, 0), // C2 승
      makeMatch('C', 'C3', 'C4', 0, 0), // 무
    ];

    const standings = computeGroupStandings(matches, teams);

    // C1: 6점, GD +1, GF 4 / C2: 6점, GD +1, GF 5
    // 전체 GF 는 C2 가 높지만, 맞대결에서 C1 이 이겼으므로 C1 이 상위 (2026 규칙)
    expect(standings[0].teamId).toBe('C1');
    expect(standings[1].teamId).toBe('C2');
  });
});

describe('computeGroupStandings - 라이브/스케줄', () => {
  it('Live 경기는 현재 스코어로 잠정 반영하고 Scheduled 경기는 무시한다', () => {
    const teams = groupTeams('D');
    const matches = [
      makeMatch('D', 'D1', 'D2', 1, 0, MatchStatus.Finished),
      makeMatch('D', 'D3', 'D4', 0, 1, MatchStatus.Live), // D4 잠정 리드
      makeMatch('D', 'D1', 'D3', 0, 0, MatchStatus.Scheduled), // 무시
    ];

    const standings = computeGroupStandings(matches, teams);
    const byId = Object.fromEntries(standings.map((s) => [s.teamId, s]));

    expect(byId['D1'].points).toBe(3);
    expect(byId['D1'].played).toBe(1); // Scheduled 는 미집계
    expect(byId['D4'].points).toBe(3); // Live 승 잠정 반영
    expect(byId['D3'].points).toBe(0);
    expect(byId['D2'].points).toBe(0);
  });
});

describe('computeAllGroupStandings', () => {
  it('조별로 분리해 순위표 맵을 만든다', () => {
    const teams = [...groupTeams('A'), ...groupTeams('B')];
    const matches = [
      makeMatch('A', 'A1', 'A2', 1, 0),
      makeMatch('B', 'B1', 'B2', 2, 0),
    ];

    const byGroup = computeAllGroupStandings(matches, teams);

    expect([...byGroup.keys()].sort()).toEqual(['A', 'B']);
    expect(byGroup.get('A')!.length).toBe(4);
    expect(byGroup.get('A')![0].teamId).toBe('A1');
  });
});
