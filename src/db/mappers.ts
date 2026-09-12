import { DEFAULT_CERTIFICATION_ID } from '@/certifications';
import { fromJson } from '@/lib/json';
import type { DomainId } from '@/types/domain';
import { isContentStatus, type AnswerOption, type ContentStatus, type Difficulty, type Question } from '@/types/question';
import type {
  ExamSession,
  FlaggedQuestion,
  MistakeRecord,
  PracticeDomainFilter,
  PracticeSession,
  SessionAnswer,
  SessionStatus,
  SessionType,
  UserProgress,
} from '@/types/session';

export type QuestionRow = {
  id: string;
  certification_id?: string | null;
  exam_version: string;
  domain: string;
  objective: string;
  subobjective: string;
  difficulty: string;
  question_text: string;
  options_json: string;
  correct_answer_id: string;
  explanation: string;
  option_explanations_json: string;
  source_url: string | null;
  source_title: string | null;
  verified_date: string | null;
  question_version: number;
  content_status: string;
  updated_at?: string | null;
};

export type PracticeSessionRow = {
  id: string;
  certification_id?: string | null;
  domain_filter: string;
  question_count: number;
  question_ids_json: string;
  current_index: number;
  status: string;
  started_at: string;
  completed_at: string | null;
  score: number | null;
  updated_at: string;
};

export type ExamSessionRow = {
  id: string;
  certification_id?: string | null;
  question_ids_json: string;
  current_index: number;
  duration_seconds: number;
  remaining_seconds: number;
  last_tick_at: string;
  status: string;
  started_at: string;
  completed_at: string | null;
  score: number | null;
  updated_at: string;
};

export type AnswerRow = {
  id: string;
  session_id: string;
  question_id: string;
  selected_option_id: string | null;
  is_correct: number | null;
  answered_at: string | null;
};

export type FlagRow = {
  id: string;
  session_id: string;
  session_type: string;
  question_id: string;
  flagged_at: string;
};

export type MistakeRow = {
  certification_id?: string | null;
  question_id: string;
  times_missed: number;
  last_missed_at: string;
  last_session_id: string | null;
};

export type ProgressRow = {
  id: string;
  certification_id?: string | null;
  questions_answered: number;
  questions_correct: number;
  mock_exam_best_percent: number | null;
  updated_at: string;
};

function asContentStatus(value: string): ContentStatus {
  if (isContentStatus(value)) {
    return value;
  }
  if (value === 'development_sample') {
    return 'development';
  }
  throw new Error(`Unknown content status: ${value}`);
}

function asDomain(value: string): DomainId {
  if (!value.trim()) {
    throw new Error('Unknown domain: empty');
  }
  return value;
}

function asDomainFilter(value: string): PracticeDomainFilter {
  if (value === 'all') {
    return 'all';
  }
  return asDomain(value);
}

export function mapQuestion(row: QuestionRow): Question {
  const options = fromJson<AnswerOption[]>(row.options_json);
  if (options.length !== 4) {
    throw new Error(`Question ${row.id} does not have four options.`);
  }

  return {
    id: row.id,
    certificationId: row.certification_id?.trim() || DEFAULT_CERTIFICATION_ID,
    examVersion: row.exam_version,
    domain: asDomain(row.domain),
    objective: row.objective,
    subobjective: row.subobjective,
    difficulty: row.difficulty as Difficulty,
    questionText: row.question_text,
    options: options as [AnswerOption, AnswerOption, AnswerOption, AnswerOption],
    correctAnswerId: row.correct_answer_id,
    explanation: row.explanation,
    optionExplanations: fromJson<Record<string, string>>(row.option_explanations_json),
    sourceUrl: row.source_url ?? '',
    sourceTitle: row.source_title ?? '',
    verifiedDate: row.verified_date,
    questionVersion: row.question_version,
    contentStatus: asContentStatus(row.content_status),
  };
}

export function mapPracticeSession(row: PracticeSessionRow): PracticeSession {
  return {
    id: row.id,
    certificationId: row.certification_id?.trim() || DEFAULT_CERTIFICATION_ID,
    domainFilter: asDomainFilter(row.domain_filter),
    questionCount: row.question_count,
    questionIds: fromJson<string[]>(row.question_ids_json),
    currentIndex: row.current_index,
    status: row.status as SessionStatus,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    score: row.score,
    updatedAt: row.updated_at,
  };
}

export function mapExamSession(row: ExamSessionRow): ExamSession {
  return {
    id: row.id,
    certificationId: row.certification_id?.trim() || DEFAULT_CERTIFICATION_ID,
    questionIds: fromJson<string[]>(row.question_ids_json),
    currentIndex: row.current_index,
    durationSeconds: row.duration_seconds,
    remainingSeconds: row.remaining_seconds,
    lastTickAt: row.last_tick_at,
    status: row.status as SessionStatus,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    score: row.score,
    updatedAt: row.updated_at,
  };
}

export function mapAnswer(row: AnswerRow): SessionAnswer {
  return {
    id: row.id,
    sessionId: row.session_id,
    questionId: row.question_id,
    selectedOptionId: row.selected_option_id,
    isCorrect: row.is_correct === null ? null : row.is_correct === 1,
    answeredAt: row.answered_at,
  };
}

export function mapFlag(row: FlagRow): FlaggedQuestion {
  return {
    id: row.id,
    sessionId: row.session_id,
    sessionType: row.session_type as SessionType,
    questionId: row.question_id,
    flaggedAt: row.flagged_at,
  };
}

export function mapMistake(row: MistakeRow): MistakeRecord {
  return {
    certificationId: row.certification_id?.trim() || DEFAULT_CERTIFICATION_ID,
    questionId: row.question_id,
    timesMissed: row.times_missed,
    lastMissedAt: row.last_missed_at,
    lastSessionId: row.last_session_id,
  };
}

export function mapProgress(row: ProgressRow): UserProgress {
  return {
    id: row.id,
    certificationId: row.certification_id?.trim() || DEFAULT_CERTIFICATION_ID,
    questionsAnswered: row.questions_answered,
    questionsCorrect: row.questions_correct,
    mockExamBestPercent: row.mock_exam_best_percent,
    updatedAt: row.updated_at,
  };
}
