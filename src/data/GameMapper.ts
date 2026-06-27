import { Match } from '../domain/Models';
import { MatchStatus } from '../domain/MatchStatus';
import { TEAM_BY_ID } from './Teams';
import { RawGame, RawGamesResponse } from './RawGame';

/** 조별리그 그룹 식별자('A'~'L'). 그 외 group 값은 토너먼트로 간주한다. */
const GROUP_GAME_TYPE = 'group';
const VALID_GROUPS = new Set(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L']);

/** 'TRUE'/'finished' 등 종료를 의미하는 표기(대소문자 무시). */
const FINISHED_FLAG = 'TRUE';
const FINISHED_ELAPSED = 'finished';
const LIVE_ELAPSED = 'live';

/**
 * 문자열 스코어를 숫자로 변환한다.
 * 빈 문자열·'null'·파싱 불가(NaN) 는 모두 0 으로 방어한다.
 */
const toScore = (raw: string | undefined | null): number => {
  if (raw === undefined || raw === null) {
    return 0;
  }

  const trimmed = raw.trim();

  if (trimmed === '' || trimmed.toLowerCase() === 'null') {
    return 0;
  }

  const parsed = Number(trimmed);

  if (Number.isNaN(parsed)) {
    return 0;
  }

  return parsed;
};

/**
 * time_elapsed / finished 필드를 MatchStatus 로 매핑한다.
 * - 'live' → Live
 * - finished('TRUE' 또는 time_elapsed 가 'finished'/'Finished') → Finished
 * - 그 외('notstarted' 등) → Scheduled
 */
export const mapStatus = (raw: RawGame): MatchStatus => {
  const elapsed = (raw.time_elapsed ?? '').trim().toLowerCase();

  if (elapsed === LIVE_ELAPSED) {
    return MatchStatus.Live;
  }

  const isFinishedFlag = (raw.finished ?? '').trim().toUpperCase() === FINISHED_FLAG;

  if (isFinishedFlag || elapsed === FINISHED_ELAPSED) {
    return MatchStatus.Finished;
  }

  return MatchStatus.Scheduled;
};

/**
 * 'MM/DD/YYYY HH:mm' 형식의 로컬 날짜를 ISO 8601 문자열로 변환한다.
 * 파싱 실패 시 원본 문자열을 그대로 반환해 안전하게 처리한다.
 */
export const parseKickoff = (localDate: string): string => {
  if (typeof localDate !== 'string' || localDate.trim() === '') {
    return '';
  }

  const match = localDate.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})$/);

  if (!match) {
    return localDate;
  }

  const [, month, day, year, hour, minute] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute));

  if (Number.isNaN(date.getTime())) {
    return localDate;
  }

  return date.toISOString();
};

/**
 * 한 경기를 도메인 Match 로 변환한다.
 * 조별 경기(type==='group' 이고 group 이 'A'~'L')만 변환하고,
 * 토너먼트이거나 TEAM_BY_ID 에 없는 team_id 가 포함되면 null 을 반환한다.
 */
export const mapGame = (raw: RawGame): Match | null => {
  if (raw.type !== GROUP_GAME_TYPE || !VALID_GROUPS.has(raw.group)) {
    return null;
  }

  if (!TEAM_BY_ID.has(raw.home_team_id) || !TEAM_BY_ID.has(raw.away_team_id)) {
    return null;
  }

  return {
    id: raw.id,
    group: raw.group,
    status: mapStatus(raw),
    homeId: raw.home_team_id,
    awayId: raw.away_team_id,
    homeGoals: toScore(raw.home_score),
    awayGoals: toScore(raw.away_score),
    kickoff: parseKickoff(raw.local_date),
  };
};

/**
 * 원시 응답에서 조별 경기만 추려 Match[] 로 변환한다.
 * mapGame 이 null 을 반환한(토너먼트·미등록 팀) 경기는 제외한다.
 */
export const mapGames = (rawResponse: RawGamesResponse): Match[] => {
  const games = rawResponse?.games ?? [];

  return games.reduce<Match[]>((acc, raw) => {
    const match = mapGame(raw);

    if (match !== null) {
      acc.push(match);
    }

    return acc;
  }, []);
};
