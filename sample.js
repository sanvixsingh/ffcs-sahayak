/**
 * Example shortlist shown on a first visit so the tool opens in a working
 * state instead of an empty shell. Deliberately spans branches and years —
 * these are illustrative names, not real VIT faculty or allotments.
 */
export const SAMPLE_STATE = {
  colorCounter: 3,
  locks: {},
  subjects: [
    {
      id: 'demo-1',
      name: 'Engineering Mathematics II',
      colorIndex: 0,
      teachers: [
        { id: 'demo-1a', name: 'Faculty A', theorySlots: ['A1'], labSlots: [], venue: 'SJT-402', priority: 1 },
        { id: 'demo-1b', name: 'Faculty B', theorySlots: ['C1'], labSlots: [], venue: 'SJT-410', priority: 2 },
      ],
    },
    {
      id: 'demo-2',
      name: 'Digital Logic Design',
      colorIndex: 1,
      teachers: [
        {
          id: 'demo-2a',
          name: 'Faculty C',
          theorySlots: ['D1'],
          labSlots: ['L21+L22'],
          venue: 'TT-105',
          priority: 1,
        },
        {
          id: 'demo-2b',
          name: 'Faculty D',
          theorySlots: ['E1'],
          labSlots: ['L27+L28'],
          venue: 'TT-210',
          priority: 2,
        },
      ],
    },
    {
      id: 'demo-3',
      name: 'Technical English',
      colorIndex: 2,
      teachers: [
        { id: 'demo-3a', name: 'Faculty E', theorySlots: ['G1'], labSlots: [], venue: 'SMV-301', priority: 1 },
        { id: 'demo-3b', name: 'Faculty F', theorySlots: ['B1'], labSlots: [], venue: 'SMV-214', priority: 2 },
      ],
    },
  ],
};
