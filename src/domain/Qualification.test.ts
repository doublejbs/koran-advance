import { describe, it, expect } from 'vitest';
import { evaluateQualification } from './Qualification';
import { QualificationStatus } from './QualificationStatus';
import { makeTeam, makeMatch } from './TestHelpers';

// 한 조 전 경기 종료: A1 전승(1위) · A2(2위) · A3(3위) · A4(4위)
const finishedGroup = () => {
  const teams = [
    makeTeam('A1', 'A', 10),
    makeTeam('A2', 'A', 20),
    makeTeam('A3', 'A', 30),
    makeTeam('A4', 'A', 40),
  ];
  const matches = [
    makeMatch('A', 'A1', 'A2', 1, 0),
    makeMatch('A', 'A1', 'A3', 1, 0),
    makeMatch('A', 'A1', 'A4', 1, 0),
    makeMatch('A', 'A2', 'A3', 1, 0),
    makeMatch('A', 'A2', 'A4', 1, 0),
    makeMatch('A', 'A3', 'A4', 1, 0),
  ];

  return { teams, matches };
};

describe('evaluateQualification - 결정된(전 경기 종료) 상태', () => {
  it('조 1위는 진출 확정', () => {
    const { teams, matches } = finishedGroup();

    expect(evaluateQualification('A1', matches, teams)).toBe(QualificationStatus.Clinched);
  });

  it('조 2위는 진출 확정', () => {
    const { teams, matches } = finishedGroup();

    expect(evaluateQualification('A2', matches, teams)).toBe(QualificationStatus.Clinched);
  });

  it('조 4위는 탈락 확정', () => {
    const { teams, matches } = finishedGroup();

    expect(evaluateQualification('A4', matches, teams)).toBe(QualificationStatus.Eliminated);
  });

  it('유일한 3위 팀은 3위 순위표 1위 → 진출 확정', () => {
    const { teams, matches } = finishedGroup();

    // 단일 조이므로 3위 팀(A3)은 3위 순위표에서 1위 → 상위 8 이내
    expect(evaluateQualification('A3', matches, teams)).toBe(QualificationStatus.Clinched);
  });
});
