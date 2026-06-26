import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Team } from '../domain/Models';
import LanguageToggle from '../components/LanguageToggle';

interface TeamSelectViewProps {
  teams: Team[];
  onSelect: (teamId: string) => void;
}

const groupOf = (team: Team): string => {
  return team.group;
};

const TeamSelectView = ({ teams, onSelect }: TeamSelectViewProps) => {
  const { t, i18n } = useTranslation();
  const [query, setQuery] = useState<string>('');

  const isEn = i18n.language === 'en';

  const nameOf = (team: Team): string => {
    return isEn ? team.nameEn : team.nameKo;
  };

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    if (normalized.length === 0) {
      return teams;
    }

    return teams.filter((team) => {
      const haystack = `${team.nameKo} ${team.nameEn} ${team.code}`.toLowerCase();

      return haystack.includes(normalized);
    });
  }, [teams, query]);

  const groups = useMemo(() => {
    const byGroup = new Map<string, Team[]>();

    filtered.forEach((team) => {
      const key = groupOf(team);
      const list = byGroup.get(key) ?? [];

      list.push(team);
      byGroup.set(key, list);
    });

    return [...byGroup.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [filtered]);

  const handleQueryChange = (value: string) => {
    setQuery(value);
  };

  const handleSelect = (teamId: string) => {
    onSelect(teamId);
  };

  return (
    <div className="select-screen">
      <header className="select-header">
        <div className="select-header__top">
          <h1 className="select-header__title">{t('appTitle')}</h1>
          <LanguageToggle />
        </div>
        <p className="select-header__prompt">{t('chooseTeamPrompt')}</p>
        <input
          className="select-search"
          type="search"
          inputMode="search"
          value={query}
          placeholder={t('searchPlaceholder')}
          aria-label={t('searchPlaceholder')}
          onChange={(event) => handleQueryChange(event.target.value)}
        />
      </header>

      <div className="select-body">
        {groups.length === 0 ? (
          <p className="empty-note">{t('noSearchResult')}</p>
        ) : (
          groups.map(([group, members]) => (
            <section key={group} className="select-group">
              <h2 className="select-group__label">{group}</h2>
              <ul className="select-group__list">
                {members.map((team) => (
                  <li key={team.id}>
                    <button
                      type="button"
                      className="team-option"
                      onClick={() => handleSelect(team.id)}
                    >
                      <span className="team-option__flag">{team.flag}</span>
                      <span className="team-option__name">{nameOf(team)}</span>
                      <span className="team-option__code">{team.code}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))
        )}
      </div>
    </div>
  );
};

export default TeamSelectView;
