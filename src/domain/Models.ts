import { MatchStatus } from './MatchStatus';

export interface Team {
  id: string;
  code: string; // 3-letter country code 등 식별 코드
  nameKo: string;
  nameEn: string;
  flag: string; // 이모지 또는 이미지 URL
  group: string; // 'A' ~ 'L'
  fifaRanking?: number; // 낮을수록 상위. 최종 타이브레이커
}

export interface Match {
  id: string;
  group: string; // 조별 경기는 'A'~'L', 토너먼트는 'KO' 등
  status: MatchStatus;
  homeId: string;
  awayId: string;
  homeGoals: number;
  awayGoals: number;
  minute?: number; // 라이브 경과 시간(분)
  kickoff: string; // ISO 8601
}

export interface Standing {
  teamId: string;
  group: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  points: number;
  rankInGroup: number; // 1 ~ 4
}

export interface ThirdPlaceRow extends Standing {
  thirdPlaceRank: number; // 1 ~ 12
  qualifies: boolean; // 상위 8팀이면 true
}
