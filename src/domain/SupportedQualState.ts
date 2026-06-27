export enum SupportedQualState {
  AutoQualified = 'AUTO_QUALIFIED', // 조 1·2위 → 자동 진출
  NotThird = 'NOT_THIRD', // 3위가 아님(4위 등) → 직접 진출 불가
  Clinched = 'CLINCHED', // 3위지만 어떤 잔여 결과에도 진출 확정
  Eliminated = 'ELIMINATED', // 3위지만 이미 8자리 밖 확정
  Contending = 'CONTENDING', // 3위, 잔여 결과에 따라 진출/탈락 갈림
}
