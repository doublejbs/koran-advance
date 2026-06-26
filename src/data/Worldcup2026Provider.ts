import { Match, Team } from '../domain/Models';
import { TEAMS } from './Teams';
import { RawGamesResponse } from './RawGame';
import { mapGames } from './GameMapper';
import { DataProvider } from './DataProvider';

const DEFAULT_BASE_URL = 'https://worldcup26.ir';
const GAMES_PATH = '/get/games';

/**
 * worldcup2026 API 를 도메인 모델로 노출하는 DataProvider 구현체.
 * fetch 를 주입받을 수 있어 테스트에서 네트워크 없이 동작을 검증할 수 있다.
 */
export const createWorldcup2026Provider = (
  baseUrl: string = DEFAULT_BASE_URL,
  fetchFn: typeof fetch = fetch,
): DataProvider => {
  const getMatches = async (): Promise<Match[]> => {
    const response = await fetchFn(`${baseUrl}${GAMES_PATH}`);

    if (!response.ok) {
      throw new Error(`worldcup2026 /get/games 요청 실패: ${response.status}`);
    }

    const body = (await response.json()) as RawGamesResponse;

    return mapGames(body);
  };

  const getTeams = (): Team[] => {
    return TEAMS;
  };

  return {
    getMatches,
    getTeams,
  };
};
