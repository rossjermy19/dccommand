export interface DealContact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  jobTitle?: string;
  phone?: string;
}

export interface DealNote {
  id: string;
  body: string;
  createdAt: string;
  timestamp: string;
}

export interface DealTask {
  id: string;
  subject: string;
  body: string;
  status: 'NOT_STARTED' | 'COMPLETED' | 'IN_PROGRESS';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  dueDate: string | null;
  createdAt: string;
}

export interface DealEmail {
  id: string;
  subject: string;
  body?: string;
  direction?: string;
  timestamp: string;
}

export interface DealMeeting {
  id: string;
  title: string;
  body?: string;
  startTime: string | null;
  endTime?: string | null;
  outcome?: string | null;
  createdAt: string;
}

export interface DealCall {
  id: string;
  title: string;
  body?: string;
  disposition?: string | null;
  duration?: number | null;
  timestamp: string;
}

export interface Deal {
  id: string;
  name: string;
  amount: number | null;
  stage: string;
  stageLabel: string;
  pipeline: string;
  closeDate: string | null;
  lastModifiedDate: string;
  lastContactedDate: string | null;
  daysSinceContact: number | null;
  health: 'urgent' | 'warning' | 'healthy' | 'neutral' | 'snoozed';
  healthReason: string;
  ownerId: string | null;
  hubspotUrl: string;
  nextTaskDate?: string | null;
  nextTaskSubject?: string | null;
  nextMeetingDate?: string | null;
  nextMeetingTitle?: string | null;
  associatedContacts?: DealContact[];
  source?: string | null;
  subSource?: string | null;
  tags?: string[];
  createdDate?: string | null;
  isNewDeal?: boolean;
  alignedStory?: string | null;
  alignedStoryReady?: boolean;
  isLibertyJ?: boolean;
  isBackWithLibertyJ?: boolean;
  backWithLibertyJDate?: string | null;
  daysWithLibertyJ?: number | null;
  isGold?: boolean;
  goldDate?: string | null;
  hasAlignedRoom?: boolean;
  alignedRoomDate?: string | null;
}

export interface PipelineStage {
  id: string;
  label: string;
  probability: number;
  isClosed: boolean;
  displayOrder: number;
}

export interface TranscriptAnalysisResult {
  summary: string;
  dealHealth: 'strong' | 'moderate' | 'at_risk';
  urgencyScore: number; // 1 - 100
  buyingSignals: string[];
  objections: string[];
  despatchCloudFit: string[];
  commitmentsMade: {
    byRoss: string[];
    byClient: string[];
  };
  recommendedNextAction: string;
  suggestedFollowUpEmail: {
    subject: string;
    body: string;
  };
}

export const PIPELINE_STAGES = [
  { id: 'appointmentscheduled', label: 'New Lead' },
  { id: '1638150379', label: 'Back Burning' },
  { id: 'qualifiedtobuy', label: 'Contact Made' },
  { id: '1352329431', label: 'No Response' },
  { id: '1209215206', label: 'Meeting Booked' },
  { id: 'presentationscheduled', label: 'Meeting Held' },
  { id: '1465977055', label: 'Upside' },
  { id: '1965601015', label: 'Expected to close' },
  { id: 'decisionmakerboughtin', label: 'Committed' },
  { id: 'contractsent', label: 'Contract Sent' },
  { id: 'closedwon', label: 'Closed Won' },
  { id: 'closedlost', label: 'Closed Lost' },
  { id: '1352329432', label: 'No Response - After Meeting' },
  { id: '5536133318', label: 'Back Burner' },
];

/**
 * Checks whether a deal stage corresponds to an active closing stage:
 * Expected to Close, Upside, Committed, or Contract Sent.
 * These deals are actively being worked and negotiated by Ross,
 * and should never be surfaced as stalled/action-required on the Command Centre dashboard.
 */
export function isActivelyClosingStage(stageId: string = '', stageLabel: string = ''): boolean {
  const idLower = (stageId || '').toLowerCase();
  const labelLower = (stageLabel || '').toLowerCase().trim();

  // Upside
  if (idLower === '1465977055' || idLower === '5030008017' || labelLower.includes('upside')) {
    return true;
  }

  // Expected to Close
  if (idLower === '1965601015' || idLower === '5030008018' || labelLower.includes('expected to close')) {
    return true;
  }

  // Committed
  if (
    idLower === 'decisionmakerboughtin' ||
    idLower === '5030008019' ||
    idLower === '5537029307' ||
    labelLower.includes('committed') ||
    labelLower.includes('decision maker')
  ) {
    return true;
  }

  // Contract Sent
  if (
    idLower === 'contractsent' ||
    idLower === '5030008020' ||
    idLower === '2181144790' ||
    idLower === '5537029308' ||
    labelLower.includes('contract sent') ||
    labelLower.includes('agreement sent')
  ) {
    return true;
  }

  return false;
}

