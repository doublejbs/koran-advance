import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Match, Standing, Team } from '../domain/Models';
import { RivalGroupCondition } from '../domain/QualificationConditions';
import RivalScenarioView from './RivalScenarioView';

interface ScenarioSheetViewProps {
  condition: RivalGroupCondition;
  groupMatches: Match[];
  groupTeams: Team[];
  supportedStanding: Standing | null;
  teamById: Map<string, Team>;
  matches: Match[];
  teams: Team[];
  supportedTeamId: string | null;
  onClose: () => void;
}

/** 한 조의 시나리오 상세(승무패 선택 + 순위 변화)를 보여주는 바텀시트. */
const ScenarioSheetView = (props: ScenarioSheetViewProps) => {
  const {
    condition,
    groupMatches,
    groupTeams,
    supportedStanding,
    teamById,
    matches,
    teams,
    supportedTeamId,
    onClose,
  } = props;
  const { t } = useTranslation();

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    // 시트가 열린 동안 뒤 배경(body) 스크롤을 잠근다.
    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKey);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKey);
    };
  }, [onClose]);

  const handleBackdrop = () => {
    onClose();
  };

  const handleStop = (event: React.MouseEvent) => {
    event.stopPropagation();
  };

  return (
    <div className="sheet-backdrop" role="presentation" onClick={handleBackdrop}>
      <div
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-label={`${condition.group}`}
        onClick={handleStop}
      >
        <div className="sheet__handle" aria-hidden="true" />
        <div className="sheet__head">
          <span className="sheet__title">{condition.group}</span>
          <button type="button" className="sheet__close" onClick={onClose} aria-label={t('sheetClose')}>
            ✕
          </button>
        </div>
        <div className="sheet__body">
          <RivalScenarioView
            condition={condition}
            groupMatches={groupMatches}
            groupTeams={groupTeams}
            supportedStanding={supportedStanding}
            teamById={teamById}
            matches={matches}
            teams={teams}
            supportedTeamId={supportedTeamId}
          />
        </div>
      </div>
    </div>
  );
};

export default ScenarioSheetView;
