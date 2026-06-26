import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Match, Standing, Team } from '../domain/Models';
import { MatchOutcome } from '../domain/MatchOutcome';
import { RivalGroupState } from '../domain/RivalGroupState';
import { RivalGroupCondition, findFavorableScenario } from '../domain/QualificationConditions';

interface GroupTileViewProps {
  condition: RivalGroupCondition;
  groupMatches: Match[];
  groupTeams: Team[];
  supportedStanding: Standing | null;
  teamById: Map<string, Team>;
  onOpen: (group: string) => void;
}

/** 한 라이벌 조의 컴팩트 격자 타일. 탭하면 상세 시트를 연다. */
const GroupTileView = (props: GroupTileViewProps) => {
  const { condition, groupMatches, groupTeams, supportedStanding, teamById, onOpen } = props;
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

  const isSwing = condition.state === RivalGroupState.Swing;
  const isAbove = condition.state === RivalGroupState.AlreadyAbove;

  const favorable = useMemo<Map<string, MatchOutcome>>(() => {
    if (!supportedStanding || !isSwing) {
      return new Map();
    }

    return findFavorableScenario(
      supportedStanding,
      groupMatches,
      groupTeams,
      teamById,
      condition.hints,
    );
  }, [supportedStanding, isSwing, groupMatches, groupTeams, teamById, condition.hints]);

  const outcomeLabel = (homeId: string, awayId: string, outcome: MatchOutcome): string => {
    if (outcome === MatchOutcome.Draw) {
      return t('draw');
    }

    const teamId = outcome === MatchOutcome.HomeWin ? homeId : awayId;

    return t('teamWin', { team: nameOf(teamId) });
  };

  const flagTeamIds =
    condition.thirdCandidateTeamIds.length > 0
      ? condition.thirdCandidateTeamIds.slice(0, 3)
      : condition.currentThirdTeamId
        ? [condition.currentThirdTeamId]
        : [];

  // 카드 요약: 경기마다 한 줄(국기 + 결과)로 표시해 어느 경기가 무/승인지 분명히 한다.
  const favorableLines = condition.hints
    .filter((hint) => favorable.has(hint.matchId))
    .map((hint) => ({
      key: hint.matchId,
      flags: `${flagOf(hint.homeId)} ${flagOf(hint.awayId)}`,
      result: outcomeLabel(hint.homeId, hint.awayId, favorable.get(hint.matchId)!),
    }));

  const lines =
    isSwing && favorableLines.length > 0
      ? favorableLines
      : [
          {
            key: condition.group,
            flags: flagTeamIds.map(flagOf).join(' '),
            result: isSwing
              ? t('threatSwing')
              : isAbove
                ? t('tileFailed')
                : t('tileSafe'),
          },
        ];

  const toneClass = isSwing ? 'is-swing' : isAbove ? 'is-above' : 'is-below';
  const chipLabel = isSwing ? t('threatSwing') : isAbove ? t('tileFailed') : t('threatBelow');

  const handleClick = () => {
    onOpen(condition.group);
  };

  return (
    <li className={`gtile ${toneClass}`}>
      <button type="button" className="gtile__btn" onClick={handleClick}>
        {isAbove ? (
          <svg
            className="gtile__xmark"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <line x1="10" y1="10" x2="90" y2="90" />
            <line x1="90" y1="10" x2="10" y2="90" />
          </svg>
        ) : null}
        <span className="gtile__top">
          <span className="gtile__group">{condition.group}</span>
          <span className="gtile__chip">{chipLabel}</span>
        </span>
        <span className="gtile__lines">
          {lines.map((line) => (
            <span key={line.key} className="gtile__line">
              <span className="gtile__lineflags">{line.flags}</span>
              <span className="gtile__lineresult">{line.result}</span>
            </span>
          ))}
        </span>
      </button>
    </li>
  );
};

export default GroupTileView;
