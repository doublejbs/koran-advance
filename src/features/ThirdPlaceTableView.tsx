import { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Match, Team, ThirdPlaceRow } from '../domain/Models';
import { MatchStatus } from '../domain/MatchStatus';

interface ThirdPlaceTableViewProps {
  rows: ThirdPlaceRow[];
  teamById: Map<string, Team>;
  matches: Match[];
  supportedTeamId: string | null;
}

const QUALIFY_CUTOFF = 8;

const buildLiveTeamSet = (matches: Match[]): Set<string> => {
  const live = new Set<string>();

  matches.forEach((match) => {
    if (match.status === MatchStatus.Live) {
      live.add(match.homeId);
      live.add(match.awayId);
    }
  });

  return live;
};

interface RowGroupProps {
  children: ReactNode;
  cutAfter: boolean;
  cutLabel: string;
}

/** 한 행과, 진출 경계(8↔9위)일 때 그 아래 경계 라벨 행을 함께 렌더한다. */
const RowGroup = ({ children, cutAfter, cutLabel }: RowGroupProps) => {
  return (
    <>
      {children}
      {cutAfter ? (
        <tr className="cutline-row" aria-hidden="true">
          <td colSpan={8}>
            <span className="cutline-row__label">{cutLabel}</span>
          </td>
        </tr>
      ) : null}
    </>
  );
};

const ThirdPlaceTableView = (props: ThirdPlaceTableViewProps) => {
  const { rows, teamById, matches, supportedTeamId } = props;
  const { t, i18n } = useTranslation();

  const isEn = i18n.language === 'en';
  const liveTeams = buildLiveTeamSet(matches);

  const nameOf = (team: Team | undefined): string => {
    if (!team) {
      return '—';
    }

    return isEn ? team.nameEn : team.nameKo;
  };

  return (
    <section className="third-table">
      <div className="third-table__head">
        <h2 className="third-table__title">{t('thirdPlaceTitle')}</h2>
        <p className="third-table__caption">{t('thirdPlaceCaption')}</p>
      </div>

      <div className="third-table__scroll">
        <table className="standings">
          <thead>
            <tr>
              <th className="col-rank">{t('colRank')}</th>
              <th className="col-team">{t('colTeam')}</th>
              <th className="col-group">{t('colGroup')}</th>
              <th className="col-num">{t('colPlayed')}</th>
              <th className="col-num">{t('colRecord')}</th>
              <th className="col-num">{t('colGoals')}</th>
              <th className="col-num">{t('colGoalDiff')}</th>
              <th className="col-num">{t('colPoints')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const team = teamById.get(row.teamId);
              const isSupported = row.teamId === supportedTeamId;
              const isLive = liveTeams.has(row.teamId);
              const isLastQualifier = row.thirdPlaceRank === QUALIFY_CUTOFF;

              const classNames = [
                'standings__row',
                row.qualifies ? 'is-qualify' : 'is-eliminate',
                isSupported ? 'is-supported' : '',
                isLastQualifier ? 'is-cutline' : '',
              ]
                .filter(Boolean)
                .join(' ');

              return (
                <RowGroup
                  key={row.teamId}
                  cutAfter={isLastQualifier && rows.length > QUALIFY_CUTOFF}
                  cutLabel={t('qualifyLine')}
                >
                  <tr className={classNames}>
                    <td className="col-rank">{row.thirdPlaceRank}</td>
                    <td className="col-team">
                      <span className="cell-flag">{team?.flag ?? '🏳️'}</span>
                      <span className="cell-name">{nameOf(team)}</span>
                      {isLive ? <span className="cell-live">{t('live')}</span> : null}
                    </td>
                    <td className="col-group">{row.group}</td>
                    <td className="col-num">{row.played}</td>
                    <td className="col-num record">
                      {row.won}-{row.drawn}-{row.lost}
                    </td>
                    <td className="col-num">
                      {row.goalsFor}-{row.goalsAgainst}
                    </td>
                    <td className="col-num">
                      {row.goalDiff > 0 ? `+${row.goalDiff}` : row.goalDiff}
                    </td>
                    <td className="col-num col-points">{row.points}</td>
                  </tr>
                </RowGroup>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default ThirdPlaceTableView;
