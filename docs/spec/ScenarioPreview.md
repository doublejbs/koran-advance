# 진출 조건 — 결과별 순위 미리보기 (Scenario Preview)

> "진출 조건" 탭의 **Swing 조 카드**에서, 잔여 경기의 각 결과(홈승/무/원정승)를 직접 눌러
> 그 조 순위가 어떻게 바뀌고 그 조 3위가 **우리보다 위/아래**가 되는지 즉시 보여준다.

## 1. 배경

- 현재 `GroupThreatCardView`의 Swing 카드는 경기별 힌트 문구(`threatHintFavorable` /
  `threatHintConditional`)만 정적으로 노출한다.
- 사용자 요구: **각 결과를 누르면 순위가 어떻게 되는지** 보여줄 것.

## 2. 동작

- Swing 조 카드의 정적 힌트 목록을 **인터랙티브 시나리오 뷰**로 대체한다.
- 카드별로 잔여 경기마다 결과 버튼 3개(홈승 / 무 / 원정승)를 렌더한다.
  - 각 버튼은 미리 계산된 `OutcomeEffect`로 색을 입힌다(유리=초록 / 불리=빨강 / 갈림=노랑).
  - 클릭하면 해당 경기의 가정 결과로 선택된다(같은 버튼 재클릭 시 선택 해제).
- 선택 조합을 그 조 경기에 적용(`applyScenario`)해 **그 조 순위표를 재계산**하고,
  컴팩트 미니 순위표(순위·팀·경기·골득실·승점)를 카드 안에 보여준다.
- **판정 라인**: 가정 결과에서의 그 조 3위 팀과, 그 3위가 우리보다 **위(불리) / 아래(유리)**인지.
- **초기화** 버튼으로 선택을 모두 해제(= 현재 실제 결과 기준 순위)한다.
- 아무 것도 선택하지 않은 초기 상태는 현재 집계(Finished/Live만 반영) 순위를 보여준다.

## 3. 도메인 (`projectRivalScenario`)

`QualificationConditions.ts`에 순수 함수 추가:

```ts
interface RivalScenarioProjection {
  standings: Standing[];        // 가정 결과를 반영한 그 조 정렬 순위표
  thirdTeamId: string | null;   // 그 조 3위 팀 id
  thirdIsAboveSupported: boolean; // 그 조 3위가 우리보다 위(불리)면 true
}

projectRivalScenario(
  supportedRecord, groupMatches, groupTeams, teamsById, overrides,
): RivalScenarioProjection
```

- `applyScenario(groupMatches, overrides)` → `computeGroupStandings` 조합.
- 비교 기준은 3위표와 동일(`compareThirdPlaceRecords`).
- 기존 함수 조합이므로 동작은 그 함수들의 규칙을 그대로 따른다.

## 4. 화면 (`RivalScenarioView`)

- props: `condition`(힌트·잔여경기), `groupMatches`, `groupTeams`, `supportedStanding`, `teamById`.
- 로컬 상태: `Map<matchId, MatchOutcome>` 선택값.
- `GroupThreatBoardView` → `GroupThreatCardView`로 `groupMatches`/`groupTeams`/`supportedStanding`을
  per-group으로 내려준다. Swing 카드에서만 이 뷰를 렌더한다.

## 5. i18n 추가 키

| key | Ko | En |
|---|---|---|
| `scenarioHint` | 결과를 눌러 순위 변화를 확인하세요 | Tap a result to preview the standings |
| `scenarioReset` | 초기화 | Reset |
| `scenarioProjectedThird` | 예상 3위 | Projected 3rd |

순위표 헤더(`colRank`/`colTeam`/`colPlayed`/`colGoalDiff`/`colPoints`)와 위/아래 라벨
(`threatAbove`/`threatBelow`), 결과 라벨(`teamWin`/`draw`)은 기존 키 재사용.

## 6. 테스트

`QualificationConditions.test.ts`에 `projectRivalScenario` 케이스 추가:
- override 없음 → 현재 순위/3위 그대로.
- 특정 결과 override → 그 조 3위가 바뀌고 `thirdIsAboveSupported`가 기대대로 토글.

## 7. 한계

- 대표 스코어(승 1:0 / 무 0:0) 단위는 기존 시뮬레이터와 동일.
- 미선택 잔여 경기는 미집계(Scheduled) — 부분 선택도 결정적으로 계산된다.
