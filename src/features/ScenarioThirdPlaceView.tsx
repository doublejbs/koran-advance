import { useTranslation } from 'react-i18next';
import { Team, ThirdPlaceRow } from '../domain/Models';

interface ScenarioThirdPlaceViewProps {
  rows: ThirdPlaceRow[];
  supportedTeamId: string | null;
  rivalThirdTeamId: string | null;
  teamById: Map<string, Team>;
}

const QUALIFY_CUTOFF = 8;

const formatGoalDiff = (goalDiff: number): string => {
  return goalDiff > 0 ? `+${goalDiff}` : String(goalDiff);
};

/** 가정 결과를 반영한 전체 조 3위 순위표(컴팩트). 응원국 행/라이벌 3위/진출 경계(8위)를 강조. */
const ScenarioThirdPlaceView = (props: ScenarioThirdPlaceViewProps) => {
  const { rows, supportedTeamId, rivalThirdTeamId, teamById } = props;
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

  return (
    <table className="scenario-third">
      <thead>
        <tr>
          <th>{t('colRank')}</th>
          <th>{t('colTeam')}</th>
          <th>{t('colGroup')}</th>
          <th>{t('colGoalDiff')}</th>
          <th>{t('colPoints')}</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => {
          const isSupported = row.teamId === supportedTeamId;
          // 응원국 강조가 우선. 라이벌 조는 응원국 조를 제외하므로 보통 겹치지 않지만 방어적으로 분리.
          const isRival =
            !isSupported && rivalThirdTeamId !== null && row.teamId === rivalThirdTeamId;
          const isCutline = row.thirdPlaceRank === QUALIFY_CUTOFF && rows.length > QUALIFY_CUTOFF;
          const rowClass = [
            'scenario-third__row',
            row.qualifies ? 'is-qualify' : 'is-eliminate',
            isSupported ? 'is-supported' : '',
            isRival ? 'is-rival' : '',
            isCutline ? 'is-cutline' : '',
          ]
            .filter(Boolean)
            .join(' ');

          return (
            <tr key={row.teamId} className={rowClass}>
              <td>{row.thirdPlaceRank}</td>
              <td className="scenario-third__team">
                <span className="scenario-third__flag">{flagOf(row.teamId)}</span>
                {nameOf(row.teamId)}
                {isRival ? (
                  <span className="scenario-third__tag">{t('scenarioThisGroup')}</span>
                ) : null}
              </td>
              <td>{row.group}</td>
              <td>{formatGoalDiff(row.goalDiff)}</td>
              <td>{row.points}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};

export default ScenarioThirdPlaceView;
