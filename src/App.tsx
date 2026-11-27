import { useCallback, useMemo, useState } from 'react';
import { ExamView } from './components/ExamView';
import { LoginView } from './components/LoginView';
import { SummaryView } from './components/SummaryView';
import { TeacherDecryptModal } from './components/TeacherDecryptModal';
import { EXAM_CONFIG } from './data/questionBank';
import { CompletedSessionSummary, ExamSessionState, StudentRecord } from './types/cbt';
import {
  buildEncryptedSubmissionEnvelope,
  clearActiveSession,
  clearCompletedSummary,
  loadActiveSession,
  loadCompletedSummary,
  saveActiveSession,
  saveCompletedSummary,
  sendEnvelopeToGAS,
} from './utils/gasSubmission';
import { generateExamPaper, getLocalDateKey } from './utils/prng';

export default function App() {
  const [activeSession, setActiveSession] = useState<ExamSessionState | null>(() =>
    loadActiveSession()
  );
  const [completedSummary, setCompletedSummary] = useState<CompletedSessionSummary | null>(() =>
    loadCompletedSummary()
  );
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isRetrying, setIsRetrying] = useState<boolean>(false);
  const [teacherModalOpen, setTeacherModalOpen] = useState<boolean>(false);

  const examPaper = useMemo(() => {
    if (!activeSession) return null;
    const dateKey =
      activeSession.examDateKey ?? getLocalDateKey(new Date(activeSession.startedAtIso));
    return generateExamPaper(activeSession.student, dateKey);
  }, [activeSession?.student, activeSession?.examDateKey, activeSession?.startedAtIso]);

  const handleStartExam = useCallback((student: StudentRecord, token: string) => {
    const nowMs = Date.now();
    const examDateKey = getLocalDateKey(new Date(nowMs));
    const newSession: ExamSessionState = {
      student,
      token,
      examDateKey,
      startedAtIso: new Date(nowMs).toISOString(),
      endAtMs: nowMs + EXAM_CONFIG.durationMinutes * 60 * 1000,
      currentIndex: 0,
      answers: {},
      flagged: {},
      tabViolations: 0,
      violationLogs: [],
      lastSavedAtIso: new Date(nowMs).toISOString(),
      submitted: false,
    };

    clearCompletedSummary();
    setCompletedSummary(null);
    saveActiveSession(newSession);
    setActiveSession(newSession);
  }, []);

  const handleUpdateSession = useCallback(
    (updater: (prev: ExamSessionState) => ExamSessionState) => {
      setActiveSession((prev) => {
        if (!prev) return prev;
        return updater(prev);
      });
    },
    []
  );

  const handleSubmitExam = useCallback(
    async (finalSession: ExamSessionState) => {
      if (isSubmitting) return;
      setIsSubmitting(true);
      try {
        const dateKey =
          finalSession.examDateKey ?? getLocalDateKey(new Date(finalSession.startedAtIso));
        const paper = generateExamPaper(finalSession.student, dateKey);
        const envelope = await buildEncryptedSubmissionEnvelope(finalSession, paper);

        const initialSummary: CompletedSessionSummary = {
          envelope,
          deliveryStatus: 'SENDING',
          deliveryMessage: 'Mengenkripsi jawaban dan menghubungi server Google Apps Script...',
          lastAttemptIso: new Date().toISOString(),
        };
        saveCompletedSummary(initialSummary);
        setCompletedSummary(initialSummary);

        clearActiveSession();
        setActiveSession(null);

        const delivery = await sendEnvelopeToGAS(envelope);
        const finalizedSummary: CompletedSessionSummary = {
          envelope,
          deliveryStatus: delivery.status,
          deliveryMessage: delivery.message,
          lastAttemptIso: new Date().toISOString(),
        };
        saveCompletedSummary(finalizedSummary);
        setCompletedSummary(finalizedSummary);
      } finally {
        setIsSubmitting(false);
      }
    },
    [isSubmitting]
  );

  const handleRetrySend = useCallback(async () => {
    if (!completedSummary || isRetrying) return;
    setIsRetrying(true);
    try {
      const delivery = await sendEnvelopeToGAS(completedSummary.envelope);
      const updated: CompletedSessionSummary = {
        ...completedSummary,
        deliveryStatus: delivery.status,
        deliveryMessage: delivery.message,
        lastAttemptIso: new Date().toISOString(),
      };
      saveCompletedSummary(updated);
      setCompletedSummary(updated);
    } finally {
      setIsRetrying(false);
    }
  }, [completedSummary, isRetrying]);

  const handleResetToLogin = useCallback(() => {
    clearActiveSession();
    clearCompletedSummary();
    setActiveSession(null);
    setCompletedSummary(null);
  }, []);

  return (
    <>
      {activeSession && examPaper ? (
        <ExamView
          session={activeSession}
          paper={examPaper}
          onUpdateSession={handleUpdateSession}
          onSubmitExam={handleSubmitExam}
          isSubmitting={isSubmitting}
        />
      ) : completedSummary ? (
        <SummaryView
          summary={completedSummary}
          onRetrySend={handleRetrySend}
          isRetrying={isRetrying}
          onResetToLogin={handleResetToLogin}
          onOpenTeacherModal={() => setTeacherModalOpen(true)}
        />
      ) : (
        <LoginView
          onStartExam={handleStartExam}
          onOpenTeacherModal={() => setTeacherModalOpen(true)}
        />
      )}

      <TeacherDecryptModal
        isOpen={teacherModalOpen}
        onClose={() => setTeacherModalOpen(false)}
        initialEnvelope={completedSummary?.envelope ?? null}
      />
    </>
  );
}
