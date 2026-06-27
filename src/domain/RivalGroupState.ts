export enum RivalGroupState {
  AlreadyAbove = 'ALREADY_ABOVE', // 이 조 3위가 어떤 결과든 우리보다 위(우리에게 불리 확정)
  AlwaysBelow = 'ALWAYS_BELOW', // 이 조 3위가 어떤 결과든 우리보다 아래(안전)
  Swing = 'SWING', // 결과에 따라 우리보다 위/아래가 갈림(응원 대상)
}
