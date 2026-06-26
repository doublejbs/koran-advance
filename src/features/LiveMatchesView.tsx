import { useTranslation } from 'react-i18next';
import { Match, Team } from '../domain/Models';
import { MatchStatus } from '../domain/MatchStatus';

interface LiveMatchesViewProps {
  matches: Match[];
  teamById: Map<string, Team>;
}

const LiveMatchesView = ({ matches, teamById }: LiveMatchesViewProps) => {
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

  const liveMatches = matches.filter((match) => match.status === MatchStatus.Live);

  return (
    <section className="live-section">
      <div className="live-section__head">
        <span className="live-dot" aria-hidden="true" />
        <h2 className="live-section__title">{t('liveTitle')}</h2>
      </div>

      {liveMatches.length === 0 ? (
        <p className="empty-note">{t('noLiveMatches')}</p>
      ) : (
        <ul className="live-list">
          {liveMatches.map((match) => (
            <li key={match.id} className="live-card">
              <div className="live-card__top">
                <span className="live-card__group">{match.group}</span>
                <span className="live-card__minute">
                  {typeof match.minute === 'number' ? `${match.minute}${t('minuteSuffix')}` : t('live')}
                </span>
              </div>

              <div className="live-card__teams">
                <div className="live-card__team">
                  <span className="live-card__flag">{flagOf(match.homeId)}</span>
                  <span className="live-card__name">{nameOf(match.homeId)}</span>
                </div>
                <div className="live-card__score">
                  <span>{match.homeGoals}</span>
                  <span className="live-card__sep">:</span>
                  <span>{match.awayGoals}</span>
                </div>
                <div className="live-card__team live-card__team--away">
                  <span className="live-card__flag">{flagOf(match.awayId)}</span>
                  <span className="live-card__name">{nameOf(match.awayId)}</span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

export default LiveMatchesView;
