import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Match, Standing, Team, ThirdPlaceRow } from '../domain/Models';
import { MatchStatus } from '../domain/MatchStatus';
import { computeAllGroupStandings } from '../domain/Standings';
import { rankThirdPlaceTeams, selectThirdPlacedStandings } from '../domain/ThirdPlace';
import { createWorldcup2026Provider } from '../data/Worldcup2026Provider';

const LIVE_POLL_MS = 30_000;
const IDLE_POLL_MS = 120_000;

const provider = createWorldcup2026Provider('/wc-api');

interface UseTournamentDataResult {
  teams: Team[];
  matches: Match[];
  thirdPlaceRows: ThirdPlaceRow[];
  standingsByGroup: Map<string, Standing[]>;
  loading: boolean;
  error: Error | null;
  lastUpdated: Date | null;
  refetch: () => void;
}

const hasLiveMatch = (matches: Match[]): boolean => {
  return matches.some((match) => match.status === MatchStatus.Live);
};

/**
 * provider 로 경기를 로드하고 폴링한다.
 * 라이브 경기가 있으면 30초, 없으면 120초 간격으로 갱신한다.
 */
export const useTournamentData = (): UseTournamentDataResult => {
  const teams = useMemo(() => provider.getTeams(), []);

  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef<boolean>(true);

  // runCycle 을 ref 로 보관해 setTimeout 콜백이 항상 최신 구현을 호출하게 한다.
  const runCycleRef = useRef<() => void>(() => {});

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const runCycle = useCallback(async () => {
    try {
      const next = await provider.getMatches();

      if (!mountedRef.current) {
        return;
      }

      setMatches(next);
      setLastUpdated(new Date());
      setError(null);

      clearTimer();

      const delay = hasLiveMatch(next) ? LIVE_POLL_MS : IDLE_POLL_MS;

      timerRef.current = setTimeout(() => runCycleRef.current(), delay);
    } catch (caught) {
      if (!mountedRef.current) {
        return;
      }

      setError(caught instanceof Error ? caught : new Error(String(caught)));

      clearTimer();
      timerRef.current = setTimeout(() => runCycleRef.current(), IDLE_POLL_MS);
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [clearTimer]);

  runCycleRef.current = () => {
    void runCycle();
  };

  const refetch = useCallback(() => {
    setLoading(true);
    void runCycle();
  }, [runCycle]);

  useEffect(() => {
    mountedRef.current = true;

    void runCycle();

    return () => {
      mountedRef.current = false;

      clearTimer();
    };
  }, [runCycle, clearTimer]);

  const standingsByGroup = useMemo(() => {
    return computeAllGroupStandings(matches, teams);
  }, [matches, teams]);

  const thirdPlaceRows = useMemo(() => {
    const thirds = selectThirdPlacedStandings(standingsByGroup);

    return rankThirdPlaceTeams(thirds, teams);
  }, [standingsByGroup, teams]);

  return {
    teams,
    matches,
    thirdPlaceRows,
    standingsByGroup,
    loading,
    error,
    lastUpdated,
    refetch,
  };
};
