# 데이터 모델 (개념)

```ts
enum MatchStatus { Scheduled = 'SCHEDULED', Live = 'LIVE', Finished = 'FINISHED' }

interface Team { id: string; code: string; nameKo: string; nameEn: string; flag: string; group: string }
interface Match {
  id: string; group: string; status: MatchStatus;
  homeId: string; awayId: string;
  homeGoals: number; awayGoals: number;
  minute?: number; kickoff: string; // ISO
}
interface Standing { // 경기 결과로부터 파생 계산
  teamId: string; group: string;
  played: number; won: number; drawn: number; lost: number;
  goalsFor: number; goalsAgainst: number; goalDiff: number; points: number;
  rankInGroup: number; // 1~4
}
interface ThirdPlaceRow extends Standing { thirdPlaceRank: number; qualifies: boolean } // 1~12, 상위 8 true
```

- 순위(Standing)는 API 순위표를 그대로 신뢰하지 않고 **경기 결과에서 직접 계산**한다
  (라이브 반영·시뮬레이터 가정과 동일 로직을 쓰기 위해).
