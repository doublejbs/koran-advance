import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Standing, ThirdPlaceRow } from '../domain/Models';
import { QualificationStatus } from '../domain/QualificationStatus';
import { evaluateQualification } from '../domain/Qualification';
import { TEAM_BY_ID } from '../data/Teams';
import { useSupportedTeam } from '../state/useSupportedTeam';
import { useTournamentData } from '../state/useTournamentData';
import LanguageToggle from '../components/LanguageToggle';
import AdBanner from '../components/AdBanner';
import TeamSelectView from './TeamSelectView';
import StatusBannerView from './StatusBannerView';
import ThirdPlaceTableView from './ThirdPlaceTableView';
import LiveMatchesView from './LiveMatchesView';
import GroupThreatBoardView from './GroupThreatBoardView';
import { AppTab } from './AppTab';

const formatTime = (date: Date, lang: string): string => {
  return new Intl.DateTimeFormat(lang === 'en' ? 'en-US' : 'ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(date);
};

const App = () => {
  const { t, i18n } = useTranslation();
  const { supportedTeamId, setSupportedTeam, clearSupportedTeam } = useSupportedTeam();
  const {
    teams,
    matches,
    thirdPlaceRows,
    standingsByGroup,
    loading,
    error,
    lastUpdated,
    refetch,
  } = useTournamentData();

  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.Standings);

  const supportedTeam = supportedTeamId ? (TEAM_BY_ID.get(supportedTeamId) ?? null) : null;

  const supportedStanding = useMemo<Standing | null>(() => {
    if (!supportedTeam) {
      return null;
    }

    const groupStandings = standingsByGroup.get(supportedTeam.group) ?? [];

    return groupStandings.find((standing) => standing.teamId === supportedTeam.id) ?? null;
  }, [supportedTeam, standingsByGroup]);

  const supportedThirdRow = useMemo<ThirdPlaceRow | null>(() => {
    if (!supportedTeamId) {
      return null;
    }

    return thirdPlaceRows.find((row) => row.teamId === supportedTeamId) ?? null;
  }, [supportedTeamId, thirdPlaceRows]);

  const qualificationStatus = useMemo<QualificationStatus>(() => {
    if (!supportedTeam || matches.length === 0) {
      return QualificationStatus.InContention;
    }

    try {
      return evaluateQualification(supportedTeam.id, matches, teams);
    } catch {
      return QualificationStatus.InContention;
    }
  }, [supportedTeam, matches, teams]);

  const handleChangeTeam = () => {
    clearSupportedTeam();
  };

  const handleRetry = () => {
    refetch();
  };

  const handleSelectStandingsTab = () => {
    setActiveTab(AppTab.Standings);
  };

  const handleSelectConditionsTab = () => {
    setActiveTab(AppTab.Conditions);
  };

  if (!supportedTeam) {
    return <TeamSelectView teams={teams} onSelect={setSupportedTeam} />;
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header__titles">
          <h1 className="app-header__title">{t('appTitle')}</h1>
          <p className="app-header__subtitle">{t('appSubtitle')}</p>
        </div>
        <LanguageToggle />
      </header>

      <StatusBannerView
        team={supportedTeam}
        status={qualificationStatus}
        standing={supportedStanding}
        thirdPlaceRow={supportedThirdRow}
        thirdPlaceTotal={thirdPlaceRows.length}
        onChangeTeam={handleChangeTeam}
      />

      <nav className="tab-bar" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === AppTab.Standings}
          className={`tab-bar__btn ${activeTab === AppTab.Standings ? 'is-active' : ''}`}
          onClick={handleSelectStandingsTab}
        >
          {t('tabStandings')}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === AppTab.Conditions}
          className={`tab-bar__btn ${activeTab === AppTab.Conditions ? 'is-active' : ''}`}
          onClick={handleSelectConditionsTab}
        >
          {t('tabConditions')}
        </button>
      </nav>

      <main className="app-main">
        {error && matches.length === 0 ? (
          <div className="error-box">
            <p className="error-box__title">{t('errorTitle')}</p>
            <button type="button" className="btn-primary" onClick={handleRetry}>
              {t('retry')}
            </button>
          </div>
        ) : loading && matches.length === 0 ? (
          <p className="empty-note">{t('loading')}</p>
        ) : activeTab === AppTab.Standings ? (
          <>
            <ThirdPlaceTableView
              rows={thirdPlaceRows}
              teamById={TEAM_BY_ID}
              matches={matches}
              supportedTeamId={supportedTeamId}
            />
            <LiveMatchesView matches={matches} teamById={TEAM_BY_ID} />
          </>
        ) : (
          <GroupThreatBoardView
            supportedTeamId={supportedTeamId}
            supportedStanding={supportedStanding}
            supportedThirdRow={supportedThirdRow}
            thirdPlaceTotal={thirdPlaceRows.length}
            matches={matches}
            teams={teams}
            teamById={TEAM_BY_ID}
          />
        )}
      </main>

      <footer className="app-footer">
        <span className="app-footer__updated">
          {t('lastUpdated')}
          {lastUpdated ? ` · ${formatTime(lastUpdated, i18n.language)}` : ' · —'}
        </span>
        <button type="button" className="btn-ghost" onClick={handleRetry} disabled={loading}>
          {t('refresh')}
        </button>
      </footer>

      <AdBanner />
    </div>
  );
};

export default App;
