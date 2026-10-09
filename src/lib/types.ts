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
  health: 'urgent' | 'warning' | 'healthy' | 'neutral';
  healthReason: string;
  ownerId: string | null;
  hubspotUrl: string;
  associatedContacts?: Array<{
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    jobTitle?: string;
  }>;
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
