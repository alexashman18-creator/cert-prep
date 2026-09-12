import type { DomainId } from '@/types/domain';

export type SessionStatus = 'in_progress' | 'completed' | 'expired' | 'abandoned';

export type SessionType = 'practice' | 'exam';

export type PracticeDomainFilter = 'all' | DomainId;

export const PRACTICE_LENGTHS = [10, 20, 30] as const;
export type PracticeLength = (typeof PRACTICE_LENGTHS)[number];

export interface PracticeSession {
  id: string;
  domainFilter: PracticeDomainFilter;
  questionCount: number;
  questionIds: string[];
  currentIndex: number;
  status: SessionStatus;
  startedAt: string;
  completedAt: string | null;
  score: number | null;
  updatedAt: string;
}

export interface ExamSession {
  id: string;
  questionIds: string[];
  currentIndex: number;
  durationSeconds: number;
  remainingSeconds: number;
  lastTickAt: string;
  status: SessionStatus;
  startedAt: string;
  completedAt: string | null;
  score: number | null;
  updatedAt: string;
}

export interface SessionAnswer {
  id: string;
  sessionId: string;
  questionId: string;
  selectedOptionId: string | null;
  isCorrect: boolean | null;
  answeredAt: string | null;
}

export interface FlaggedQuestion {
  id: string;
  sessionId: string;
  sessionType: SessionType;
  questionId: string;
  flaggedAt: string;
}

export interface MistakeRecord {
  questionId: string;
  timesMissed: number;
  lastMissedAt: string;
  lastSessionId: string | null;
}

export interface UserProgress {
  id: string;
  questionsAnswered: number;
  questionsCorrect: number;
  mockExamBestPercent: number | null;
  updatedAt: string;
}

export interface DomainPerformance {
  domain: DomainId;
  answered: number;
  correct: number;
  percent: number;
}

export interface SessionResults {
  sessionId: string;
  total: number;
  correct: number;
  incorrect: number;
  unanswered: number;
  percent: number;
  domainPerformance: DomainPerformance[];
}
