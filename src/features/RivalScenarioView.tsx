import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Match, Standing, Team } from '../domain/Models';
import { MatchOutcome } from '../domain/MatchOutcome';
import { OutcomeEffect } from '../domain/OutcomeEffect';
import {
  RivalGroupCondition,
  findFavorableScenario,
  projectRivalScenario,
} from '../domain/QualificationConditions';
import { projectThirdPlaceRanking } from '../domain/ThirdPlace';
import ScenarioThirdPlaceView from './ScenarioThirdPlaceView';

interface RivalScenarioViewProps {
  condition: RivalGroupCondition;
  groupMatches: Match[];
  groupTeams: Team[];
  supportedStanding: Standing | null;
  teamById: Map<string, Team>;
  matches: Match[];
  teams: Team[];
  supportedTeamId: string | null;
}

const effectModifier = (effect: OutcomeEffect): string => {
  if (effect === OutcomeEffect.Favorable) {
    return 'is-favorable';
  }

  if (effect === OutcomeEffect.Unfavorable) {
    return 'is-unfavorable';
  }

  return 'is-conditional';
};

const formatGoalDiff = (goalDiff: number): string => {
  return goalDiff > 0 ? `+${goalDiff}` : String(goalDiff);
};

/** 한 Swing 라이벌 조의 잔여 경기 결과를 눌러 순위 변화를 미리보는 뷰. */
const RivalScenarioView = (props: RivalScenarioViewProps) => {
  const {
    condition,
    groupMatches,
    groupTeams,
    supportedStanding,
    teamById,
    matches,
    teams,
    supportedTeamId,
  } = props;
  const { t, i18n } = useTranslation();

  const isEn = i18n.language === 'en';

  const favorableSelection = useMemo<Map<string, MatchOutcome>>(() => {
    if (!supportedStanding) {
      return new Map();
    }

    return findFavorableScenario(
      supportedStanding,
      groupMatches,
      groupTeams,
      teamById,
      condition.hints,
    );
  }, [supportedStanding, groupMatches, groupTeams, teamById, condition.hints]);

  const [selection, setSelection] = useState<Map<string, MatchOutcome>>(favorableSelection);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (!touched) {
      setSelection(favorableSelection);
    }
  }, [favorableSelection, touched]);

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

  const outcomeLabel = (homeId: string, awayId: string, outcome: MatchOutcome): string => {
    if (outcome === MatchOutcome.Draw) {
      return t('draw');
    }

    const teamId = outcome === MatchOutcome.HomeWin ? homeId : awayId;

    return t('teamWin', { team: nameOf(teamId) });
  };

  const projection = useMemo(() => {
    if (!supportedStanding) {
      return null;
    }

    return projectRivalScenario(supportedStanding, groupMatches, groupTeams, teamById, selection);
  }, [supportedStanding, groupMatches, groupTeams, teamById, selection]);

  const overallRanking = useMemo(() => {
    return projectThirdPlaceRanking(matches, teams, selection);
  }, [matches, teams, selection]);

  const supportedRank = supportedTeamId
    ? (overallRanking.find((row) => row.teamId === supportedTeamId) ?? null)
    : null;

  const thirdModifier = projection?.thirdIsAboveSupported ? 'is-above' : 'is-below';

  const handlePick = (matchId: string, outcome: MatchOutcome) => {
    setTouched(true);
    setSelection((prev) => {
      const next = new Map(prev);

      if (next.get(matchId) === outcome) {
        next.delete(matchId);
      } else {
        next.set(matchId, outcome);
      }

      return next;
    });
  };

  const handleReset = () => {
    setTouched(true);
    setSelection(new Map());
  };

  const handleApplyFavorable = () => {
    // 마운트 직후와 동일하게, 이후 갱신된 유리 조합도 계속 따라가도록 touched 를 해제한다.
    setTouched(false);
    setSelection(new Map(favorableSelection));
  };

  return (
    <div className="scenario">
      <div className="scenario__head">
        <span className="scenario__hint">{t('scenarioHint')}</span>
        <div className="scenario__actions">
          <button
            type="button"
            className="scenario__action"
            onClick={handleApplyFavorable}
          >
            {t('scenarioFavorable')}
          </button>
          <button type="button" className="scenario__reset" onClick={handleReset}>
            {t('scenarioReset')}
          </button>
        </div>
      </div>

      <ul className="scenario__matches">
        {condition.hints.map((hint) => {
          const picked = selection.get(hint.matchId) ?? null;

          return (
            <li key={hint.matchId} className="scenario-match">
              <span className="scenario-match__label">
                {nameOf(hint.homeId)} vs {nameOf(hint.awayId)}
              </span>
              <div
                className="scenario-match__btns"
                role="group"
                aria-label={`${nameOf(hint.homeId)} vs ${nameOf(hint.awayId)}`}
              >
                {hint.outcomes.map((verdict) => {
                  const isSelected = picked === verdict.outcome;
                  const className = `scenario-btn ${effectModifier(verdict.effect)} ${
                    isSelected ? 'is-selected' : ''
                  }`;

                  const handleClick = () => {
                    handlePick(hint.matchId, verdict.outcome);
                  };

                  return (
                    <button
                      key={verdict.outcome}
                      type="button"
                      className={className}
                      aria-pressed={isSelected}
                      onClick={handleClick}
                    >
                      {outcomeLabel(hint.homeId, hint.awayId, verdict.outcome)}
                    </button>
                  );
                })}
              </div>
            </li>
          );
        })}
      </ul>

      {projection ? (
        <>
          <table className="scenario-table">
            <thead>
              <tr>
                <th>{t('colRank')}</th>
                <th>{t('colTeam')}</th>
                <th>{t('colPlayed')}</th>
                <th>{t('colGoalDiff')}</th>
                <th>{t('colPoints')}</th>
              </tr>
            </thead>
            <tbody>
              {projection.standings.map((standing) => {
                const isThird = standing.rankInGroup === 3;
                const rowClass = `scenario-table__row ${
                  isThird ? `is-third ${thirdModifier}` : ''
                }`;

                return (
                  <tr key={standing.teamId} className={rowClass}>
                    <td>{standing.rankInGroup}</td>
                    <td className="scenario-table__team">
                      <span className="scenario-table__flag">{flagOf(standing.teamId)}</span>
                      {nameOf(standing.teamId)}
                    </td>
                    <td>{standing.played}</td>
                    <td>{formatGoalDiff(standing.goalDiff)}</td>
                    <td>{standing.points}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <p className="scenario__verdict">
            <span className="scenario__verdict-label">{t('scenarioProjectedThird')}</span>
            <span className="scenario__verdict-team">
              {projection.thirdTeamId
                ? `${flagOf(projection.thirdTeamId)} ${nameOf(projection.thirdTeamId)}`
                : '—'}
            </span>
            <span
              className={`threat-chip ${
                projection.thirdIsAboveSupported ? 'is-eliminate' : 'is-qualify'
              }`}
            >
              {projection.thirdIsAboveSupported ? t('threatAbove') : t('threatBelow')}
            </span>
          </p>

          {supportedRank ? (
            <p className="scenario__overall-rank">
              <span>
                {t('scenarioMyOverallRank', {
                  rank: supportedRank.thirdPlaceRank,
                  total: overallRanking.length,
                })}
              </span>
              <span
                className={`threat-chip ${
                  supportedRank.qualifies ? 'is-qualify' : 'is-eliminate'
                }`}
              >
                {supportedRank.qualifies ? t('scenarioInCut') : t('scenarioOutCut')}
              </span>
            </p>
          ) : null}

          <ScenarioThirdPlaceView
            rows={overallRanking}
            supportedTeamId={supportedTeamId}
            rivalThirdTeamId={projection.thirdTeamId}
            teamById={teamById}
          />
        </>
      ) : null}
    </div>
  );
};

export default RivalScenarioView;
