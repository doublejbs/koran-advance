export enum OutcomeEffect {
  Favorable = 'FAVORABLE', // 이 결과면 그 조 3위가 우리 아래 → 유리
  Unfavorable = 'UNFAVORABLE', // 이 결과면 그 조 3위가 우리 위 → 불리
  Conditional = 'CONDITIONAL', // 같은 조 다른 잔여 경기 결과에 따라 갈림
}
