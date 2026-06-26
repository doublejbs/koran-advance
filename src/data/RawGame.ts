/**
 * worldcup2026 API(/get/games) 의 원시 응답 타입.
 * 모든 필드가 문자열로 내려오므로 number 가 아닌 string 으로 선언한다.
 * 변환에 필요한 필드만 정의한다.
 */
export interface RawGame {
  id: string;
  home_team_id: string;
  away_team_id: string;
  home_score: string;
  away_score: string;
  group: string;
  type: string;
  finished: string;
  time_elapsed: string;
  local_date: string;
}

export interface RawGamesResponse {
  games: RawGame[];
}
