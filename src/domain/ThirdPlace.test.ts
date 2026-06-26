import { describe, it, expect } from 'vitest';
import { rankThirdPlaceTeams, selectThirdPlacedStandings } from './ThirdPlace';
import { makeTeam, makeThirdStanding } from './TestHelpers';
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
