import { useCallback, useState } from 'react';

const STORAGE_KEY = 'supportedTeamId';

interface UseSupportedTeamResult {
  supportedTeamId: string | null;
  setSupportedTeam: (teamId: string) => void;
  clearSupportedTeam: () => void;
}

const readStored = (): string | null => {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
};

/** localStorage 기반 응원국 id 상태. 기본값 없음(미선택 = null). */
export const useSupportedTeam = (): UseSupportedTeamResult => {
  const [supportedTeamId, setSupportedTeamId] = useState<string | null>(readStored);

  const setSupportedTeam = useCallback((teamId: string) => {
    try {
      localStorage.setItem(STORAGE_KEY, teamId);
    } catch {
      // 저장 실패해도 메모리 상태는 갱신한다.
    }

    setSupportedTeamId(teamId);
  }, []);

  const clearSupportedTeam = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // noop
    }

    setSupportedTeamId(null);
  }, []);

  return {
    supportedTeamId,
    setSupportedTeam,
    clearSupportedTeam,
  };
};
