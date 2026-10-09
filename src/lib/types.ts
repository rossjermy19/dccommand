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
  associatedContacts?: DealContact[];
  source?: string | null;
  subSource?: string | null;
  tags?: string[];
  createdDate?: string | null;
  isNewDeal?: boolean;
  alignedStory?: string | null;
  alignedStoryReady?: boolean;
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
