import { describe, it, expect } from 'vitest';
import {
  projectThirdPlaceRanking,
  rankThirdPlaceTeams,
  selectThirdPlacedStandings,
} from './ThirdPlace';
import { makeMatch, makeTeam, makeThirdStanding } from './TestHelpers';
import { MatchOutcome } from './MatchOutcome';
import { MatchStatus } from './MatchStatus';
import { Standing } from './Models';

describe('rankThirdPlaceTeams', () => {
  it('승점→골득실→다득점 순으로 12팀을 줄세우고 상위 8팀만 진출 표시', () => {
    // [그룹, 승점, 골득실, 다득점]
    const spec: Array<[string, number, number, number]> = [
      ['A', 7, 3, 5],
      ['B', 6, 2, 4],
      ['C', 6, 2, 3], // B와 승점·골득실 동률 → 다득점으로 B > C
      ['D', 5, 1, 3],
      ['E', 4, 2, 4],
      ['F', 4, 1, 3], // E와 승점 동률 → 골득실로 E > F
      ['G', 4, 1, 2], // F와 승점·골득실 동률 → 다득점으로 F > G
      ['H', 3, 0, 2], // 8위 (진출 경계)
      ['I', 3, -1, 2], // 9위 (탈락)
      ['J', 2, -1, 1],
      ['K', 1, -2, 1],
      ['L', 0, -3, 0],
    ];
    const standings = spec.map(([g, p, gd, gf]) => makeThirdStanding(`${g}3`, g, p, gd, gf));
    const teams = spec.map(([g], i) => makeTeam(`${g}3`, g, i + 1));

    const rows = rankThirdPlaceTeams(standings, teams);

    expect(rows.map((r) => r.teamId)).toEqual([
      'A3', 'B3', 'C3', 'D3', 'E3', 'F3', 'G3', 'H3', 'I3', 'J3', 'K3', 'L3',
    ]);
    expect(rows.map((r) => r.thirdPlaceRank)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    expect(rows.filter((r) => r.qualifies).map((r) => r.teamId)).toEqual([
      'A3', 'B3', 'C3', 'D3', 'E3', 'F3', 'G3', 'H3',
    ]);
    expect(rows.slice(8).every((r) => !r.qualifies)).toBe(true);
  });
});

describe('selectThirdPlacedStandings', () => {
  it('각 조에서 rankInGroup === 3 인 팀만 뽑는다', () => {
    const build = (group: string): Standing[] =>
      [1, 2, 3, 4].map((rank) => ({
        teamId: `${group}${rank}`,
        group,
        played: 3,
        won: 0,
        drawn: 0,
        lost: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDiff: 0,
        points: 0,
        rankInGroup: rank,
      }));
    const byGroup = new Map<string, Standing[]>([
      ['A', build('A')],
      ['B', build('B')],
    ]);

    const thirds = selectThirdPlacedStandings(byGroup);

    expect(thirds.map((s) => s.teamId).sort()).toEqual(['A3', 'B3']);
    expect(thirds.every((s) => s.rankInGroup === 3)).toBe(true);
  });
});

// A조: 전부 종료(A3 = 1점 3위). B조: B3 vs B4 만 잔여.
const buildTwoGroups = () => {
  const teams = [
    makeTeam('A1', 'A', 1),
    makeTeam('A2', 'A', 2),
    makeTeam('A3', 'A', 3),
    makeTeam('A4', 'A', 4),
    makeTeam('B1', 'B', 10),
    makeTeam('B2', 'B', 20),
    makeTeam('B3', 'B', 30),
    makeTeam('B4', 'B', 40),
  ];
  const pending = makeMatch('B', 'B3', 'B4', 0, 0, MatchStatus.Scheduled);
  const matches = [
    makeMatch('A', 'A1', 'A2', 1, 0),
    makeMatch('A', 'A1', 'A3', 1, 0),
    makeMatch('A', 'A1', 'A4', 1, 0),
    makeMatch('A', 'A2', 'A3', 1, 0),
    makeMatch('A', 'A2', 'A4', 1, 0),
    makeMatch('A', 'A3', 'A4', 0, 0), // A3·A4 무 → A3 1점(FIFA 우위로 3위)
    makeMatch('B', 'B1', 'B2', 1, 0),
    makeMatch('B', 'B1', 'B3', 1, 0),
    makeMatch('B', 'B1', 'B4', 1, 0),
    makeMatch('B', 'B2', 'B3', 1, 0),
    makeMatch('B', 'B2', 'B4', 1, 0),
    pending,
  ];

  return { teams, matches, pendingId: pending.id };
};

describe('projectThirdPlaceRanking', () => {
  it('override 없으면 현재 결과로 전체 3위 순위를 매긴다', () => {
    const { teams, matches } = buildTwoGroups();

    const rows = projectThirdPlaceRanking(matches, teams, new Map());

    // A3(1점) > B3(0점)
    expect(rows.map((r) => r.teamId)).toEqual(['A3', 'B3']);
    expect(rows.map((r) => r.thirdPlaceRank)).toEqual([1, 2]);
  });

  it('B3 승 가정 → B3(3점)가 전체 3위 순위에서 A3(1점) 위로 올라간다', () => {
    const { teams, matches, pendingId } = buildTwoGroups();

    const rows = projectThirdPlaceRanking(
      matches,
      teams,
      new Map([[pendingId, MatchOutcome.HomeWin]]),
    );

    expect(rows.map((r) => r.teamId)).toEqual(['B3', 'A3']);
    expect(rows[0].thirdPlaceRank).toBe(1);
  });
});
