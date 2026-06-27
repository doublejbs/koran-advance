import { Match, Team } from '../domain/Models';

/**
 * 외부 데이터 소스를 도메인 모델로 노출하는 어댑터 인터페이스.
 * getTeams 는 정적 레퍼런스 데이터라 동기, getMatches 는 네트워크 호출이라 비동기.
 */
export interface DataProvider {
  getMatches: () => Promise<Match[]>;
  getTeams: () => Team[];
}
