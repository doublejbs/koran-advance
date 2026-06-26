import { useTranslation } from 'react-i18next';
import { Team } from '../domain/Models';
import { MatchOutcome } from '../domain/MatchOutcome';
import { RivalGroupState } from '../domain/RivalGroupState';
import { MatchHint, RivalGroupCondition } from '../domain/QualificationConditions';

interface GroupThreatCardViewProps {
  condition: RivalGroupCondition;
  teamById: Map<string, Team>;
}

interface VerdictChipMeta {
  label: string;
  modifier: string;
}

const resolveChipMeta = (
  state: RivalGroupState,
  t: (key: string) => string,
): VerdictChipMeta => {
  if (state === RivalGroupState.AlreadyAbove) {
    return { label: t('threatAbove'), modifier: 'is-eliminate' };
  }

  if (state === RivalGroupState.AlwaysBelow) {
    return { label: t('threatBelow'), modifier: 'is-qualify' };
  }

  return { label: t('threatSwing'), modifier: 'is-contention' };
};

/** 한 라이벌 조의 3위 경쟁 상태 카드. */
const GroupThreatCardView = (props: GroupThreatCardViewProps) => {
  const { condition, teamById } = props;
  const { t, i18n } = useTranslation();

  const isEn = i18n.language === 'en';

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

  const teamTag = (teamId: string): string => {
    return `${flagOf(teamId)} ${nameOf(teamId)}`;
  };

  const resultLabelOf = (hint: MatchHint, outcome: MatchOutcome): string => {
    if (outcome === MatchOutcome.Draw) {
      return t('draw');
    }

    const teamId = outcome === MatchOutcome.HomeWin ? hint.homeId : hint.awayId;

    return t('teamWin', { team: nameOf(teamId) });
  };

  const chip = resolveChipMeta(condition.state, t);
  const isSwing = condition.state === RivalGroupState.Swing;
  const hasPending = condition.pendingMatchIds.length > 0;

  const candidateTag = condition.thirdCandidateTeamIds.map(teamTag).join(', ');
  const currentTag = condition.currentThirdTeamId ? teamTag(condition.currentThirdTeamId) : '—';
  const lockedTag = condition.lockedTopTwoTeamIds.map(teamTag).join(', ');

  return (
    <li className="threat-card">
      <div className="threat-card__head">
        <span className="threat-card__group">{condition.group}</span>
        <span className="threat-card__third">
          {isSwing ? (
            <>
              <span className="threat-card__third-label">{t('threatThirdRace')}</span>
              <span className="threat-card__third-teams">{candidateTag}</span>
            </>
          ) : (
            <>
              <span className="threat-card__third-label">{t('threatThird')}</span>
              <span className="threat-card__third-teams">{currentTag}</span>
            </>
          )}
        </span>
        <span className={`threat-chip ${chip.modifier}`}>{chip.label}</span>
      </div>

      {isSwing ? (
        <ul className="threat-hints">
          {condition.hints.map((hint) => {
            const matchup = `${nameOf(hint.homeId)} vs ${nameOf(hint.awayId)}`;

            const text =
              hint.favorable !== null
                ? t('threatHintFavorable', {
                    matchup,
                    result: resultLabelOf(hint, hint.favorable),
                  })
                : t('threatHintConditional', { matchup });

            return (
              <li key={hint.matchId} className="threat-hint">
                {text}
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="threat-card__note">
          {hasPending
            ? condition.state === RivalGroupState.AlreadyAbove
              ? t('threatNoteAlwaysAbove')
              : t('threatNoteAlwaysBelow')
            : t('threatNoteSettled')}
        </p>
      )}

      {condition.lockedTopTwoTeamIds.length > 0 ? (
        <p className="threat-card__locked">{t('threatLockedTopTwo', { teams: lockedTag })}</p>
      ) : null}
    </li>
  );
};

export default GroupThreatCardView;
