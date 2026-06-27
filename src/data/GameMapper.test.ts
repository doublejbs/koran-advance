import { describe, it, expect } from 'vitest';
import { mapStatus, parseKickoff, mapGame, mapGames } from './GameMapper';
import { MatchStatus } from '../domain/MatchStatus';
import { RawGame, RawGamesResponse } from './RawGame';

/** 조별 경기 기본 픽스처. 각 테스트에서 필요한 필드만 덮어쓴다. */
const makeRawGame = (overrides: Partial<RawGame> = {}): RawGame => ({
  id: '2',
  home_team_id: '3',
  away_team_id: '4',
  home_score: '2',
  away_score: '1',
  group: 'A',
  type: 'group',
  finished: 'TRUE',
  time_elapsed: 'finished',
  local_date: '06/11/2026 20:00',
  ...overrides,
});

describe('mapStatus', () => {
  it("time_elapsed 가 'live' 면 Live 로 매핑한다", () => {
    const raw = makeRawGame({ time_elapsed: 'live', finished: 'FALSE' });

    expect(mapStatus(raw)).toBe(MatchStatus.Live);
  });

  it("time_elapsed 가 'finished' 면 Finished 로 매핑한다", () => {
    const raw = makeRawGame({ time_elapsed: 'finished', finished: 'FALSE' });

    expect(mapStatus(raw)).toBe(MatchStatus.Finished);
  });

  it("대문자 'Finished' 도 Finished 로 매핑한다", () => {
    const raw = makeRawGame({ time_elapsed: 'Finished', finished: 'FALSE' });

    expect(mapStatus(raw)).toBe(MatchStatus.Finished);
  });

  it("finished 플래그가 'TRUE' 면 Finished 로 매핑한다", () => {
    const raw = makeRawGame({ time_elapsed: 'notstarted', finished: 'TRUE' });

    expect(mapStatus(raw)).toBe(MatchStatus.Finished);
  });

  it("time_elapsed 가 'notstarted' 면 Scheduled 로 매핑한다", () => {
    const raw = makeRawGame({ time_elapsed: 'notstarted', finished: 'FALSE' });

    expect(mapStatus(raw)).toBe(MatchStatus.Scheduled);
  });
});

describe('parseKickoff', () => {
  it("'MM/DD/YYYY HH:mm' 를 ISO 8601 문자열로 변환한다", () => {
    const iso = parseKickoff('06/11/2026 20:00');

    // 로컬 타임존 의존을 피하려고 ISO 형식과 시각 성분만 검증한다.
    const parsed = new Date(iso);

    expect(Number.isNaN(parsed.getTime())).toBe(false);
    expect(parsed.getFullYear()).toBe(2026);
    expect(parsed.getMonth()).toBe(5); // 0-based, 6월
    expect(parsed.getDate()).toBe(11);
    expect(parsed.getHours()).toBe(20);
    expect(parsed.getMinutes()).toBe(0);
  });

  it('형식이 맞지 않으면 원본 문자열을 그대로 반환한다', () => {
    expect(parseKickoff('not-a-date')).toBe('not-a-date');
  });

  it('빈 문자열은 빈 문자열로 안전 처리한다', () => {
    expect(parseKickoff('')).toBe('');
  });
});

describe('mapGame', () => {
  it('조별 경기를 Match 로 정상 변환한다', () => {
    const raw = makeRawGame({
      id: '2',
      home_team_id: '3',
      away_team_id: '4',
      home_score: '2',
      away_score: '1',
      group: 'A',
      time_elapsed: 'finished',
    });

    const match = mapGame(raw);

    expect(match).not.toBeNull();
    expect(match).toMatchObject({
      id: '2',
      group: 'A',
      status: MatchStatus.Finished,
      homeId: '3',
      awayId: '4',
      homeGoals: 2,
      awayGoals: 1,
    });
  });

  it("토너먼트 group('R32') 은 null 을 반환한다", () => {
    const raw = makeRawGame({ group: 'R32', type: 'group', home_team_id: '1', away_team_id: '2' });

    expect(mapGame(raw)).toBeNull();
  });

  it("type 이 'group' 이 아니면 null 을 반환한다", () => {
    const raw = makeRawGame({ group: 'A', type: 'r32' });

    expect(mapGame(raw)).toBeNull();
  });

  it("미등록 team_id('0') 가 포함되면 null 을 반환한다", () => {
    const raw = makeRawGame({ home_team_id: '0', away_team_id: '4' });

    expect(mapGame(raw)).toBeNull();
  });

  it('문자열 스코어를 숫자로 변환한다', () => {
    const raw = makeRawGame({ home_score: '7', away_score: '1' });

    const match = mapGame(raw);

    expect(match?.homeGoals).toBe(7);
    expect(match?.awayGoals).toBe(1);
  });

  it("빈/'null' 스코어는 0 으로 처리한다", () => {
    const raw = makeRawGame({ home_score: 'null', away_score: '', time_elapsed: 'notstarted', finished: 'FALSE' });

    const match = mapGame(raw);

    expect(match?.homeGoals).toBe(0);
    expect(match?.awayGoals).toBe(0);
  });
});

describe('mapGames', () => {
  it('조별 경기만 추출하고 토너먼트·미등록 팀 경기는 제외한다', () => {
    const response: RawGamesResponse = {
      games: [
        makeRawGame({ id: '2', group: 'A', type: 'group', home_team_id: '3', away_team_id: '4' }),
        makeRawGame({ id: '95', group: 'R16', type: 'r16', home_team_id: '0', away_team_id: '0' }),
        makeRawGame({ id: '8', group: 'B', type: 'group', home_team_id: '7', away_team_id: '8' }),
        makeRawGame({ id: '86', group: 'R32', type: 'r32', home_team_id: '37', away_team_id: '0' }),
      ],
    };

    const matches = mapGames(response);

    expect(matches.map((m) => m.id)).toEqual(['2', '8']);
    expect(matches.every((m) => ['A', 'B'].includes(m.group))).toBe(true);
  });
});
