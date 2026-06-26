import { ReactNode, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Match, Team, ThirdPlaceRow } from '../domain/Models';
import { MatchOutcome } from '../domain/MatchOutcome';
import { MatchStatus } from '../domain/MatchStatus';
import { OutcomeEffect } from '../domain/OutcomeEffect';
import { SupportedQualState } from '../domain/SupportedQualState';
import { MatchHint, RivalGroupCondition } from '../domain/QualificationConditions';
import { useQualificationBoard } from '../state/useQualificationBoard';
import ThirdPlaceTableView from './ThirdPlaceTableView';

interface QualificationBoardViewProps {
  supportedTeamId: string | null;
  matches: Match[];
  teams: Team[];
  teamById: Map<string, Team>;
}

/** 펼쳐진 미리보기 대상 케이스. */
interface SelectedCase {
  matchId: string;
  outcome: MatchOutcome;
}

interface HeadlineMeta {
  label: string;
  modifier: string;
}

/** status → 헤드라인 라벨/색 modifier. */
const resolveHeadlineMeta = (
  status: SupportedQualState,
  t: (key: string) => string,
): HeadlineMeta => {
  if (status === SupportedQualState.AutoQualified) {
    return { label: t('boardAutoQualified'), modifier: 'is-clinched' };
  }

  if (status === SupportedQualState.Clinched) {
    return { label: t('boardClinched'), modifier: 'is-clinched' };
  }

  if (status === SupportedQualState.Eliminated) {
    return { label: t('boardEliminated'), modifier: 'is-eliminated' };
  }

  if (status === SupportedQualState.NotThird) {
    return { label: t('boardNotThird'), modifier: 'is-contention' };
  }

  return { label: t('boardContending'), modifier: 'is-contention' };
};

/** OutcomeEffect → i18n 라벨 키. */
const effectLabelKey = (effect: OutcomeEffect): string => {
  if (effect === OutcomeEffect.Favorable) {
    return 'effectFavorable';
  }

  if (effect === OutcomeEffect.Unfavorable) {
    return 'effectUnfavorable';
  }

  return 'effectConditional';
};

/** OutcomeEffect → 색 modifier. */
const effectModifier = (effect: OutcomeEffect): string => {
  if (effect === OutcomeEffect.Favorable) {
    return 'is-favorable';
  }

  if (effect === OutcomeEffect.Unfavorable) {
    return 'is-unfavorable';
  }

  return 'is-conditional';
};

interface CasePreviewProps {
  supportedTeamId: string | null;
  resultLabel: string;
  rows: ThirdPlaceRow[];
  teamById: Map<string, Team>;
  matches: Match[];
  isEn: boolean;
  t: (key: string, options?: Record<string, unknown>) => string;
  onClose: () => void;
}

/** 한 케이스(가정 결과)의 3위 순위표 미리보기. */
const CasePreviewView = ({
  supportedTeamId,
  resultLabel,
  rows,
  teamById,
  matches,
  isEn,
  t,
  onClose,
}: CasePreviewProps) => {
  const supportedRow = supportedTeamId
    ? (rows.find((row) => row.teamId === supportedTeamId) ?? null)
    : null;

  const supportedTeam = supportedTeamId ? (teamById.get(supportedTeamId) ?? null) : null;
  const supportedName = supportedTeam ? (isEn ? supportedTeam.nameEn : supportedTeam.nameKo) : '—';

  const handleClose = () => {
    onClose();
  };

  return (
    <div className="board-preview">
      <div className="board-preview__head">
        <p className="board-preview__title">
          {supportedRow
            ? t('previewHeader', {
                result: resultLabel,
                team: supportedName,
                rank: supportedRow.thirdPlaceRank,
                verdict: supportedRow.qualifies ? t('verdictQualify') : t('verdictEliminate'),
              })
            : t('previewHeaderNoRank', { result: resultLabel, team: supportedName })}
        </p>
        <button
          type="button"
          className="board-preview__close"
          aria-label={t('close')}
          onClick={handleClose}
        >
          ×
        </button>
      </div>

      <ThirdPlaceTableView
        rows={rows}
        teamById={teamById}
        matches={matches}
        supportedTeamId={supportedTeamId}
      />
    </div>
  );
};

interface SwingCardProps {
  condition: RivalGroupCondition;
  teamById: Map<string, Team>;
  matchById: Map<string, Match>;
  isEn: boolean;
  selectedCase: SelectedCase | null;
  t: (key: string, options?: Record<string, unknown>) => string;
  onToggleCase: (matchId: string, outcome: MatchOutcome) => void;
  renderPreview: (matchId: string, outcome: MatchOutcome, resultLabel: string) => ReactNode;
}

/** 한 swing 조의 응원 조건 카드. */
const SwingCardView = ({
  condition,
  teamById,
  matchById,
  isEn,
  selectedCase,
  t,
  onToggleCase,
  renderPreview,
}: SwingCardProps) => {
  const nameOf = (teamId: string): string => {
    const team = teamById.get(teamId);

    if (!team) {
      return '—';
    }

    return isEn ? team.nameEn : team.nameKo;
  };

  const flagOf = (teamId: string): string => {
    return teamById.get(teamId)?.flag ?? '🏳️';
  };

  /** 한 경기의 결과(홈승/원정승/무)를 국가명 기반 라벨로 만든다. */
  const resultLabelOf = (hint: MatchHint, outcome: MatchOutcome): string => {
    if (outcome === MatchOutcome.Draw) {
      return t('draw');
    }

    const teamId = outcome === MatchOutcome.HomeWin ? hint.homeId : hint.awayId;

    return t('teamWin', { team: nameOf(teamId) });
  };

  const isSelected = (matchId: string, outcome: MatchOutcome): boolean => {
    return selectedCase?.matchId === matchId && selectedCase?.outcome === outcome;
  };

  const currentThirdId = condition.currentThirdTeamId;

  return (
    <li className="board-card">
      <div className="board-card__head">
        <span className="board-card__group">{condition.group}</span>
        {currentThirdId ? (
          <span className="board-card__third">
            <span className="board-card__third-label">{t('boardCurrentThird')}</span>
            <span className="board-card__third-flag">{flagOf(currentThirdId)}</span>
            <span className="board-card__third-name">{nameOf(currentThirdId)}</span>
          </span>
        ) : null}
      </div>

      <ul className="board-match-list">
        {condition.hints.map((hint) => {
          const match = matchById.get(hint.matchId);
          const isLive = match?.status === MatchStatus.Live;

          return (
            <li key={hint.matchId} className="board-match">
              <span className="board-match__team">
                <span className="board-match__flag">{flagOf(hint.homeId)}</span>
                <span className="board-match__name">{nameOf(hint.homeId)}</span>
              </span>
              {isLive && match ? (
                <span className="board-match__score">
                  {match.homeGoals} - {match.awayGoals}
                </span>
              ) : (
                <span className="board-match__vs">vs</span>
              )}
              <span className="board-match__team board-match__team--away">
                <span className="board-match__name">{nameOf(hint.awayId)}</span>
                <span className="board-match__flag">{flagOf(hint.awayId)}</span>
              </span>
              {isLive ? <span className="board-match__live">{t('live')}</span> : null}

              {hint.favorable !== null ? (
                (() => {
                  const favorable: MatchOutcome = hint.favorable;
                  const resultLabel = resultLabelOf(hint, favorable);
                  const selected = isSelected(hint.matchId, favorable);

                  const handleClick = () => {
                    onToggleCase(hint.matchId, favorable);
                  };

                  return (
                    <>
                      <button
                        type="button"
                        className={`board-match__favorable board-case is-favorable ${
                          selected ? 'is-open' : ''
                        }`}
                        aria-expanded={selected}
                        onClick={handleClick}
                      >
                        {t('rootFor', { result: resultLabel })}
                      </button>
                      {selected ? renderPreview(hint.matchId, favorable, resultLabel) : null}
                    </>
                  );
                })()
              ) : (
                <ul className="board-match__verdicts">
                  {hint.outcomes.map((verdict) => {
                    const resultLabel = resultLabelOf(hint, verdict.outcome);
                    const selected = isSelected(hint.matchId, verdict.outcome);

                    const handleClick = () => {
                      onToggleCase(hint.matchId, verdict.outcome);
                    };

                    return (
                      <li key={verdict.outcome} className="board-match__verdict-item">
                        <button
                          type="button"
                          className={`board-match__verdict board-case ${effectModifier(
                            verdict.effect,
                          )} ${selected ? 'is-open' : ''}`}
                          aria-expanded={selected}
                          onClick={handleClick}
                        >
                          <span className="board-match__verdict-result">{resultLabel}</span>
                          <span className="board-match__verdict-effect">
                            {t(effectLabelKey(verdict.effect))}
                          </span>
                        </button>
                        {selected ? renderPreview(hint.matchId, verdict.outcome, resultLabel) : null}
                      </li>
                    );
                  })}
                </ul>
              )}
            </li>
          );
        })}
      </ul>

      <p className="board-card__hint">{t('boardCardHint')}</p>
    </li>
  );
};

const QualificationBoardView = (props: QualificationBoardViewProps) => {
  const { supportedTeamId, matches, teams, teamById } = props;
  const { t, i18n } = useTranslation();

  const { conditions, sortedSwingGroups, matchById, projectFor } = useQualificationBoard({
    supportedTeamId,
    matches,
    teams,
  });
  const isEn = i18n.language === 'en';

  const [selectedCase, setSelectedCase] = useState<SelectedCase | null>(null);

  const previewRows = useMemo<ThirdPlaceRow[]>(() => {
    if (!selectedCase) {
      return [];
    }

    return projectFor(selectedCase.matchId, selectedCase.outcome);
  }, [selectedCase, projectFor]);

  const meta = resolveHeadlineMeta(conditions.status, t);
  const isContending = conditions.status === SupportedQualState.Contending;
  const needCount = Math.max(conditions.swingCount - conditions.allowedLosses, 0);

  const handleToggleCase = (matchId: string, outcome: MatchOutcome) => {
    setSelectedCase((prev) => {
      if (prev && prev.matchId === matchId && prev.outcome === outcome) {
        return null;
      }

      return { matchId, outcome };
    });
  };

  const handleClosePreview = () => {
    setSelectedCase(null);
  };

  const renderPreview = (
    matchId: string,
    outcome: MatchOutcome,
    resultLabel: string,
  ): ReactNode => {
    if (!selectedCase || selectedCase.matchId !== matchId || selectedCase.outcome !== outcome) {
      return null;
    }

    return (
      <CasePreviewView
        supportedTeamId={supportedTeamId}
        resultLabel={resultLabel}
        rows={previewRows}
        teamById={teamById}
        matches={matches}
        isEn={isEn}
        t={t}
        onClose={handleClosePreview}
      />
    );
  };

  let description = '';

  if (conditions.status === SupportedQualState.AutoQualified) {
    description = t('boardAutoQualifiedDesc');
  } else if (conditions.status === SupportedQualState.NotThird) {
    description = t('boardNotThirdDesc');
  } else if (conditions.status === SupportedQualState.Clinched) {
    description = t('boardClinchedDesc');
  } else if (conditions.status === SupportedQualState.Eliminated) {
    description = t('boardEliminatedDesc');
  }

  return (
    <section className="board">
      <div className={`board-headline ${meta.modifier}`}>
        <span className={`status-pill ${meta.modifier}`}>{meta.label}</span>
        {isContending ? (
          <div className="board-headline__magic">
            <p className="board-headline__magic-main">
              {t('boardMagicNumber', {
                locked: conditions.lockedAboveCount,
                swing: conditions.swingCount,
                allowed: conditions.allowedLosses,
              })}
            </p>
            <p className="board-headline__magic-hint">
              {t('boardMagicNumberHint', { need: needCount })}
            </p>
          </div>
        ) : (
          <p className="board-headline__desc">{description}</p>
        )}
      </div>

      {isContending ? (
        <div className="board-swing">
          <div className="board-swing__head">
            <h2 className="board-swing__title">{t('boardSwingTitle')}</h2>
            <p className="board-swing__subtitle">{t('boardSwingSubtitle')}</p>
          </div>

          {sortedSwingGroups.length > 0 ? (
            <ul className="board-card-list">
              {sortedSwingGroups.map((condition) => (
                <SwingCardView
                  key={condition.group}
                  condition={condition}
                  teamById={teamById}
                  matchById={matchById}
                  isEn={isEn}
                  selectedCase={selectedCase}
                  t={t}
                  onToggleCase={handleToggleCase}
                  renderPreview={renderPreview}
                />
              ))}
            </ul>
          ) : (
            <p className="empty-note">{t('boardNoSwingGroups')}</p>
          )}
        </div>
      ) : null}

      {isContending &&
      (conditions.alreadyAboveGroups.length > 0 || conditions.safeBelowGroups.length > 0) ? (
        <div className="board-summary">
          {conditions.alreadyAboveGroups.length > 0 ? (
            <p className="board-summary__line is-locked">
              {t('boardLockedAbove', {
                groups: conditions.alreadyAboveGroups.join(', '),
                count: conditions.alreadyAboveGroups.length,
              })}
            </p>
          ) : null}
          {conditions.safeBelowGroups.length > 0 ? (
            <p className="board-summary__line is-safe">
              {t('boardSafeBelow', {
                groups: conditions.safeBelowGroups.join(', '),
                count: conditions.safeBelowGroups.length,
              })}
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
};

export default QualificationBoardView;
