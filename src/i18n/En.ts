export const En = {
  translation: {
    appTitle: 'World Cup 2026 Knockout Tracker',
    appSubtitle: 'Live race for third-place qualification',

    // qualification status
    statusClinched: 'Qualified',
    statusEliminated: 'Eliminated',
    statusInContention: 'In contention',

    // supported team
    chooseTeam: 'Choose team',
    chooseTeamPrompt: 'Pick the nation you support',
    searchPlaceholder: 'Search nations',
    changeTeam: 'Change team',
    noSearchResult: 'No results found',

    // rank / position
    groupRank: 'Group {{group}} · {{rank}}',
    thirdPlaceRankLabel: '3rd-place {{rank}}/{{total}}',

    // third place table
    thirdPlaceTitle: 'Third-place ranking',
    thirdPlaceCaption: 'Top 8 nations advance to the round of 32',
    qualifyLine: 'Cut line',

    // table headers
    colRank: '#',
    colTeam: 'Team',
    colGroup: 'Grp',
    colPlayed: 'P',
    colRecord: 'W-D-L',
    colGoals: 'GF-GA',
    colGoalDiff: 'GD',
    colPoints: 'Pts',

    // live matches
    liveTitle: 'Live matches',
    live: 'LIVE',
    noLiveMatches: 'No matches in progress',
    minuteSuffix: "'",

    // refresh / status
    lastUpdated: 'Last updated',
    refresh: 'Refresh',
    loading: 'Loading…',
    errorTitle: 'Failed to load data',
    retry: 'Retry',

    // language
    language: 'Language',

    // tabs
    tabStandings: 'Standings',
    tabConditions: 'Conditions',

    // qualification board — headline
    boardAutoQualified: 'Already qualified (group 1st/2nd)',
    boardAutoQualifiedDesc: 'Finished 1st or 2nd in the group and advance directly.',
    boardNotThird: 'Not 3rd in the group, so not in the wildcard race',
    boardNotThirdDesc: 'A team must finish 3rd to contend for a top-8 third-place spot.',
    boardClinched: 'Qualified',
    boardClinchedDesc: 'Stays inside the top 8 third-place spots under any remaining result.',
    boardEliminated: 'Eliminated',
    boardEliminatedDesc: 'Too many third-place teams are already locked above to advance.',
    boardContending: 'In contention',
    boardMagicNumber:
      '{{locked}} locked above · of {{swing}} swing groups, up to {{allowed}} may rise above us and we still advance',
    boardMagicNumberHint: '= advance if at least {{need}} groups go our way',

    // qualification board — cards
    boardSwingTitle: 'Results to root for',
    boardSwingSubtitle: 'These groups’ third-placers must drop below us',
    boardCurrentThird: 'Current 3rd',
    boardCardHint: 'Favorable if this group’s 3rd drops below us',

    // qualification board — summary
    boardLockedAbove: 'Locked above us: {{groups}} ({{count}})',
    boardSafeBelow: 'No impact (safe): {{groups}} ({{count}})',
    boardNoSwingGroups: 'No groups are still in the balance',

    // match outcome verdicts
    rootFor: 'Root for: {{result}}',
    teamWin: '{{team}} win',
    draw: 'Draw',
    effectFavorable: 'Favorable',
    effectUnfavorable: 'Unfavorable',
    effectConditional: 'Depends on other results',

    // case preview
    previewHeader: 'If {{result}} — {{team}} #{{rank}} · {{verdict}}',
    previewHeaderNoRank: 'If {{result}} — {{team}} not 3rd',
    verdictQualify: 'Qualifying',
    verdictEliminate: 'Eliminated',
    close: 'Close',

    // ad
    ad: 'Advertisement',
  },
};
