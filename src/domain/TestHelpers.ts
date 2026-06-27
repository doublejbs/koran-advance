import { Match, Standing, Team } from './Models';
import { MatchStatus } from './MatchStatus';

let seq = 0;

export const makeTeam = (id: string, group: string, fifaRanking = 100): Team => ({
  id,
  code: id.toUpperCase(),
  nameKo: id,
  nameEn: id,
  flag: '🏳️',
  group,
  fifaRanking,
});

export const makeMatch = (
  group: string,
  homeId: string,
  awayId: string,
  homeGoals: number,
  awayGoals: number,
  status: MatchStatus = MatchStatus.Finished,
): Match => ({
  id: `m${++seq}`,
  group,
  status,
  homeId,
  awayId,
  homeGoals,
  awayGoals,
  kickoff: '2026-06-20T18:00:00Z',
});

/** 3위 순위표 테스트용 Standing 생성기. */
export const makeThirdStanding = (
  teamId: string,
  group: string,
  points: number,
  goalDiff: number,
  goalsFor: number,
): Standing => ({
  teamId,
  group,
  played: 3,
  won: 0,
  drawn: 0,
  lost: 0,
  goalsFor,
  goalsAgainst: goalsFor - goalDiff,
  goalDiff,
  points,
  rankInGroup: 3,
});
