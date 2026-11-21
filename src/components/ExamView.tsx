import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Flag,
  Send,
  ShieldAlert,
} from 'lucide-react';
import { EXAM_CONFIG } from '../data/questionBank';
import { ExamPaper, ExamSessionState, RenderedQuestion } from '../types/cbt';
import { saveActiveSession } from '../utils/gasSubmission';

interface ExamViewProps {
  session: ExamSessionState;
  paper: ExamPaper;
  onUpdateSession: (updater: (prev: ExamSessionState) => ExamSessionState) => void;
  onSubmitExam: (finalSession: ExamSessionState, autoTriggered: boolean) => Promise<void>;
  isSubmitting: boolean;
}

function formatCountdown(secondsLeft: number): string {
  const safe = Math.max(0, Math.floor(secondsLeft));
  const hrs = Math.floor(safe / 3600);
  const mins = Math.floor((safe % 3600) / 60);
  const secs = safe % 60;
  return [hrs, mins, secs].map((v) => String(v).padStart(2, '0')).join(':');
}

function isQuestionAnswered(q: RenderedQuestion, session: ExamSessionState): boolean {
  const ans = session.answers[q.questionId];
  if (q.type === 'PG') {
    return typeof ans === 'string' && ans.length > 0;
  }
  if (q.type === 'PGK') {
    return Array.isArray(ans) && ans.length > 0;
  }
  return typeof ans === 'string' && ans.trim().length > 0;
}

export const ExamView: React.FC<ExamViewProps> = ({
  session,
  paper,
  onUpdateSession,
  onSubmitExam,
  isSubmitting,
}) => {
  const [secondsLeft, setSecondsLeft] = useState<number>(() =>
    Math.max(0, Math.ceil((session.endAtMs - Date.now()) / 1000))
  );
  const [pgkLimitNotice, setPgkLimitNotice] = useState<boolean>(false);
  const [showTabWarningModal, setShowTabWarningModal] = useState<boolean>(false);
  const [showSubmitConfirmModal, setShowSubmitConfirmModal] = useState<boolean>(false);

  const autoSubmittedRef = useRef<boolean>(false);
  const lastViolationAtRef = useRef<number>(0);
  const sessionRef = useRef<ExamSessionState>(session);
  sessionRef.current = session;

  const currentQuestion = paper.questions[session.currentIndex] ?? paper.questions[0];

  // Countdown timer synced to endAtMs so refresh never resets time
  useEffect(() => {
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((sessionRef.current.endAtMs - Date.now()) / 1000));
      setSecondsLeft(remaining);
      if (remaining <= 0 && !autoSubmittedRef.current && !isSubmitting) {
        autoSubmittedRef.current = true;
        void onSubmitExam(sessionRef.current, true);
      }
    };

    tick();
    const interval = window.setInterval(tick, 1000);
    return () => window.clearInterval(interval);
  }, [isSubmitting, onSubmitExam]);

  // Tab switch & window blur anti-cheat detector (debounced 1500ms)
  useEffect(() => {
    const recordViolation = (source: 'visibilitychange' | 'blur') => {
      if (sessionRef.current.submitted || autoSubmittedRef.current) return;
      const now = Date.now();
      if (now - lastViolationAtRef.current < 1500) return;
      lastViolationAtRef.current = now;

      onUpdateSession((prev) => {
        const next: ExamSessionState = {
          ...prev,
          tabViolations: prev.tabViolations + 1,
          violationLogs: [
            ...prev.violationLogs,
            { timestamp: new Date().toISOString(), type: source },
          ],
          lastSavedAtIso: new Date().toISOString(),
        };
        saveActiveSession(next);
        return next;
      });
      setShowTabWarningModal(true);
    };

    const handleVisibility = () => {
      if (document.hidden) {
        recordViolation('visibilitychange');
      }
    };

    const handleBlur = () => {
      recordViolation('blur');
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('blur', handleBlur);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('blur', handleBlur);
    };
  }, [onUpdateSession]);

  // Summary stats for navigation panel
  const stats = useMemo(() => {
    let answered = 0;
    let flagged = 0;
    for (const q of paper.questions) {
      if (isQuestionAnswered(q, session)) answered++;
      if (session.flagged[q.questionId]) flagged++;
    }
    const unanswered = paper.questions.length - answered;
    return { answered, flagged, unanswered };
  }, [paper.questions, session]);

  const groupedSections = useMemo(() => {
    const pg = paper.questions.filter((q) => q.type === 'PG');
    const pgk = paper.questions.filter((q) => q.type === 'PGK');
    const uraian = paper.questions.filter((q) => q.type === 'URAIAN');
    return { pg, pgk, uraian };
  }, [paper.questions]);

  const navigateTo = useCallback(
    (targetIndex: number) => {
      const clamped = Math.max(0, Math.min(paper.questions.length - 1, targetIndex));
      setPgkLimitNotice(false);
      onUpdateSession((prev) => {
        const next: ExamSessionState = {
          ...prev,
          currentIndex: clamped,
          lastSavedAtIso: new Date().toISOString(),
        };
        saveActiveSession(next);
        return next;
      });
    },
    [onUpdateSession, paper.questions.length]
  );

  const handleSelectPG = (originalKey: string) => {
    onUpdateSession((prev) => {
      const next: ExamSessionState = {
        ...prev,
        answers: {
          ...prev.answers,
          [currentQuestion.questionId]: originalKey,
        },
        lastSavedAtIso: new Date().toISOString(),
      };
      saveActiveSession(next);
      return next;
    });
  };

  const handleTogglePGK = (originalKey: string) => {
    const existing = session.answers[currentQuestion.questionId];
    const currentSelected = Array.isArray(existing) ? existing : [];
    const isAlreadySelected = currentSelected.includes(originalKey);

    if (!isAlreadySelected && currentSelected.length >= 5) {
      setPgkLimitNotice(true);
      return;
    }

    setPgkLimitNotice(false);
    const updated = isAlreadySelected
      ? currentSelected.filter((k) => k !== originalKey)
      : [...currentSelected, originalKey];

    onUpdateSession((prev) => {
      const next: ExamSessionState = {
        ...prev,
        answers: {
          ...prev.answers,
          [currentQuestion.questionId]: updated,
        },
        lastSavedAtIso: new Date().toISOString(),
      };
      saveActiveSession(next);
      return next;
    });
  };

  const handleChangeUraian = (text: string) => {
    onUpdateSession((prev) => {
      const next: ExamSessionState = {
        ...prev,
        answers: {
          ...prev.answers,
          [currentQuestion.questionId]: text,
        },
        lastSavedAtIso: new Date().toISOString(),
      };
      saveActiveSession(next);
      return next;
    });
  };

  const handleToggleFlag = () => {
    onUpdateSession((prev) => {
      const qId = currentQuestion.questionId;
      const next: ExamSessionState = {
        ...prev,
        flagged: {
          ...prev.flagged,
          [qId]: !prev.flagged[qId],
        },
        lastSavedAtIso: new Date().toISOString(),
      };
      saveActiveSession(next);
      return next;
    });
  };

  const handleSaveAndNext = () => {
    if (session.currentIndex < paper.questions.length - 1) {
      navigateTo(session.currentIndex + 1);
    } else {
      setShowSubmitConfirmModal(true);
    }
  };

  const currentFlagged = Boolean(session.flagged[currentQuestion.questionId]);
  const pgkSelectedKeys =
    currentQuestion.type === 'PGK' && Array.isArray(session.answers[currentQuestion.questionId])
      ? (session.answers[currentQuestion.questionId] as string[])
      : [];

  const timerUrgent = secondsLeft <= 300;
  const timerWarning = secondsLeft > 300 && secondsLeft <= 900;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Sticky 3-Zone Exam Header */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4 sm:gap-8">
          <div className="text-sm sm:text-base font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0">
            {EXAM_CONFIG.schoolName}
          </div>

          <div className="hidden md:flex items-center gap-3 text-xs sm:text-sm text-slate-600 truncate">
            <span className="font-medium text-slate-800">{EXAM_CONFIG.subject}</span>
            <span aria-hidden="true">·</span>
            <span className="truncate">{session.student.nama}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono text-xs text-slate-500">{session.student.kelas}</span>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border font-mono text-sm sm:text-base font-semibold tabular-nums whitespace-nowrap ${
                timerUrgent
                  ? 'bg-red-50 border-red-300 text-red-700'
                  : timerWarning
                  ? 'bg-amber-50 border-amber-300 text-amber-800'
                  : 'bg-slate-50 border-slate-200 text-slate-900'
              }`}
              aria-live="polite"
            >
              <Clock className="w-4 h-4 shrink-0" />
              <span>{formatCountdown(secondsLeft)}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main 2-Zone CBT Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left / Primary Stage: Active Question (~70%) */}
          <section className="lg:col-span-8 bg-white border border-slate-200 rounded-xl flex flex-col">
            {/* Question Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 text-sm">
                <span className="font-bold font-mono tabular-nums text-slate-900">
                  Soal {currentQuestion.displayNumber} / {paper.questions.length}
                </span>
                <span aria-hidden="true" className="text-slate-300">
                  ·
                </span>
                <span className="font-medium text-slate-600">
                  {currentQuestion.type === 'PG'
                    ? 'Pilihan Ganda'
                    : currentQuestion.type === 'PGK'
                    ? 'Pilihan Ganda Kompleks (Pilih 5)'
                    : 'Uraian'}
                </span>
              </div>

              <div className="flex items-center gap-3 text-xs text-slate-500">
                {currentFlagged && (
                  <span className="inline-flex items-center gap-1 font-semibold text-amber-700">
                    <Flag className="w-3.5 h-3.5 fill-amber-500 text-amber-600" />
                    <span>Ditandai Ragu-Ragu</span>
                  </span>
                )}
                <span className="font-mono tabular-nums">
                  Tersimpan {new Date(session.lastSavedAtIso).toLocaleTimeString('id-ID')}
                </span>
              </div>
            </div>

            {/* Question Body & Interactive Answers */}
            <div className="p-6 sm:p-8 space-y-6">
              <p className="text-base sm:text-[17px] leading-relaxed text-slate-900 font-normal">
                {currentQuestion.prompt}
              </p>

              {/* TYPE: PILIHAN GANDA */}
              {currentQuestion.type === 'PG' && currentQuestion.options && (
                <div className="space-y-3" role="radiogroup" aria-label="Pilihan jawaban">
                  {currentQuestion.options.map((opt) => {
                    const isSelected =
                      session.answers[currentQuestion.questionId] === opt.originalKey;
                    return (
                      <button
                        key={opt.originalKey}
                        type="button"
                        onClick={() => handleSelectPG(opt.originalKey)}
                        role="radio"
                        aria-checked={isSelected}
                        className={`w-full text-left p-4 rounded-lg border transition-colors flex items-start gap-3.5 cursor-pointer ${
                          isSelected
                            ? 'bg-sky-50/80 border-sky-700 text-slate-900'
                            : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50 hover:border-slate-300'
                        }`}
                      >
                        <span
                          className={`w-7 h-7 rounded-md font-mono text-xs font-bold flex items-center justify-center shrink-0 border transition-colors ${
                            isSelected
                              ? 'bg-sky-700 border-sky-700 text-white'
                              : 'bg-slate-50 border-slate-300 text-slate-700'
                          }`}
                        >
                          {opt.displayLabel}
                        </span>
                        <span className="text-sm sm:text-base leading-relaxed pt-0.5">
                          {opt.text}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* TYPE: PILIHAN GANDA KOMPLEKS (MAX 5) */}
              {currentQuestion.type === 'PGK' && currentQuestion.options && (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="text-sm font-semibold text-slate-800 font-mono tabular-nums">
                      Terpilih {pgkSelectedKeys.length} dari 5 jawaban
                    </div>
                    <div className="w-40 h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-150 ${
                          pgkSelectedKeys.length === 5 ? 'bg-emerald-600' : 'bg-sky-700'
                        }`}
                        style={{ width: `${(pgkSelectedKeys.length / 5) * 100}%` }}
                      />
                    </div>
                  </div>

                  {pgkLimitNotice && (
                    <div className="p-3 rounded-lg bg-amber-50 border border-amber-300 text-xs sm:text-sm text-amber-900 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                      <span>
                        Maksimal 5 jawaban sudah terpilih. Hapus centang salah satu opsi terlebih
                        dahulu untuk mengganti pilihan.
                      </span>
                    </div>
                  )}

                  <div className="space-y-2.5" role="group" aria-label="Pilihan ganda kompleks">
                    {currentQuestion.options.map((opt) => {
                      const isSelected = pgkSelectedKeys.includes(opt.originalKey);
                      const atLimit = pgkSelectedKeys.length >= 5 && !isSelected;
                      return (
                        <button
                          key={opt.originalKey}
                          type="button"
                          onClick={() => handleTogglePGK(opt.originalKey)}
                          aria-pressed={isSelected}
                          className={`w-full text-left p-3.5 rounded-lg border transition-colors flex items-start gap-3.5 cursor-pointer ${
                            isSelected
                              ? 'bg-sky-50/80 border-sky-700 text-slate-900'
                              : atLimit
                              ? 'bg-slate-50/50 border-slate-200 text-slate-500 hover:border-slate-300'
                              : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50 hover:border-slate-300'
                          }`}
                        >
                          <span
                            className={`w-6 h-6 rounded border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                              isSelected
                                ? 'bg-sky-700 border-sky-700 text-white'
                                : 'bg-white border-slate-300 text-slate-400'
                            }`}
                          >
                            {isSelected ? (
                              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                            ) : (
                              <span className="font-mono text-[11px] font-semibold text-slate-600">
                                {opt.displayLabel}
                              </span>
                            )}
                          </span>
                          <div className="text-sm sm:text-[15px] leading-relaxed">
                            <span className="font-mono font-semibold text-slate-500 mr-2">
                              {opt.displayLabel}.
                            </span>
                            <span>{opt.text}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TYPE: URAIAN */}
              {currentQuestion.type === 'URAIAN' && (
                <div className="space-y-2">
                  <label
                    htmlFor="uraian-textarea"
                    className="block text-xs font-semibold text-slate-700"
                  >
                    Jawaban Uraian Anda
                  </label>
                  <textarea
                    id="uraian-textarea"
                    rows={8}
                    value={
                      typeof session.answers[currentQuestion.questionId] === 'string'
                        ? (session.answers[currentQuestion.questionId] as string)
                        : ''
                    }
                    onChange={(e) => handleChangeUraian(e.target.value)}
                    placeholder="Tuliskan penjelasan teknis Anda secara lengkap, runtut, dan jelas..."
                    className="w-full p-4 text-sm sm:text-base leading-relaxed bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-600 focus:border-sky-600"
                  />
                  <div className="flex justify-between text-xs text-slate-500 font-mono tabular-nums">
                    <span>Autosave aktif setiap perubahan karakter</span>
                    <span>
                      {(
                        (typeof session.answers[currentQuestion.questionId] === 'string'
                          ? (session.answers[currentQuestion.questionId] as string)
                          : ''
                        ).length
                      )}{' '}
                      karakter
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Navigation Controls */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 rounded-b-xl flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => navigateTo(session.currentIndex - 1)}
                disabled={session.currentIndex === 0}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap shrink-0"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Sebelumnya</span>
              </button>

              <button
                type="button"
                onClick={handleToggleFlag}
                className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-lg border transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  currentFlagged
                    ? 'bg-amber-100 border-amber-400 text-amber-900 hover:bg-amber-200'
                    : 'bg-white border-slate-300 text-slate-700 hover:bg-amber-50 hover:border-amber-300'
                }`}
              >
                <Flag className={`w-4 h-4 ${currentFlagged ? 'fill-amber-600 text-amber-700' : ''}`} />
                <span>{currentFlagged ? 'Batalkan Ragu-Ragu' : 'Tandai Ragu-Ragu'}</span>
              </button>

              <button
                type="button"
                onClick={handleSaveAndNext}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 cursor-pointer whitespace-nowrap shrink-0"
              >
                <span>
                  {session.currentIndex === paper.questions.length - 1
                    ? 'Tinjau & Kirim Ujian'
                    : 'Simpan & Lanjutkan'}
                </span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </section>

          {/* Right Rail: Identity, Progress & Question Number Panel (~30%) */}
          <aside className="lg:col-span-4 space-y-5 lg:sticky lg:top-22">
            {/* Student Summary & Anti-Cheat */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900">{session.student.nama}</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {session.student.sekolah} · {session.student.kelas}
                </p>
                <p className="text-xs font-mono text-slate-500 mt-0.5">
                  No. Peserta: {session.student.nisNoPeserta}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100 text-center">
                <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200">
                  <span className="block text-lg font-bold font-mono tabular-nums text-emerald-800">
                    {stats.answered}
                  </span>
                  <span className="block text-[11px] font-medium text-emerald-700">Dijawab</span>
                </div>
                <div className="p-2 rounded-lg bg-amber-50 border border-amber-200">
                  <span className="block text-lg font-bold font-mono tabular-nums text-amber-800">
                    {stats.flagged}
                  </span>
                  <span className="block text-[11px] font-medium text-amber-700">Ragu-Ragu</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="block text-lg font-bold font-mono tabular-nums text-slate-700">
                    {stats.unanswered}
                  </span>
                  <span className="block text-[11px] font-medium text-slate-600">Belum</span>
                </div>
              </div>

              <div
                className={`flex items-center justify-between px-3 py-2 rounded-lg border text-xs ${
                  session.tabViolations > 0
                    ? 'bg-red-50 border-red-200 text-red-800'
                    : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}
              >
                <span className="inline-flex items-center gap-1.5 font-medium">
                  <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                  <span>Pelanggaran Pindah Tab</span>
                </span>
                <span className="font-mono font-bold tabular-nums">{session.tabViolations}</span>
              </div>
            </div>

            {/* Question Navigation Grid */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-900">Navigasi Nomor Soal</h2>
                <span className="text-xs font-mono text-slate-500 tabular-nums">
                  {paper.questions.length} Butir
                </span>
              </div>

              {[
                { label: 'Bagian A · Pilihan Ganda', items: groupedSections.pg },
                { label: 'Bagian B · PG Kompleks', items: groupedSections.pgk },
                { label: 'Bagian C · Uraian', items: groupedSections.uraian },
              ].map((group) => (
                <div key={group.label} className="space-y-2">
                  <h3 className="text-xs font-semibold text-slate-600">{group.label}</h3>
                  <div className="grid grid-cols-5 gap-1.5">
                    {group.items.map((q) => {
                      const idx = q.displayNumber - 1;
                      const isActive = idx === session.currentIndex;
                      const isFlagged = Boolean(session.flagged[q.questionId]);
                      const isAnswered = isQuestionAnswered(q, session);

                      let btnStyle =
                        'bg-white border-slate-300 text-slate-700 hover:bg-slate-100';
                      if (isFlagged) {
                        btnStyle = 'bg-amber-100 border-amber-400 text-amber-900';
                      } else if (isAnswered) {
                        btnStyle = 'bg-emerald-100 border-emerald-400 text-emerald-900';
                      }

                      return (
                        <button
                          key={q.questionId}
                          type="button"
                          onClick={() => navigateTo(idx)}
                          aria-label={`Soal nomor ${q.displayNumber}${
                            isActive ? ', sedang dibuka' : ''
                          }${isFlagged ? ', ragu-ragu' : isAnswered ? ', sudah dijawab' : ', belum dijawab'}`}
                          className={`relative h-10 rounded-lg border font-mono text-xs font-semibold tabular-nums flex items-center justify-center transition-colors cursor-pointer ${btnStyle} ${
                            isActive ? 'ring-2 ring-slate-900 ring-offset-1 border-slate-900' : ''
                          }`}
                        >
                          <span>{q.displayNumber}</span>
                          {isFlagged && (
                            <span
                              className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-amber-600"
                              aria-hidden="true"
                            />
                          )}
                          {!isFlagged && isAnswered && (
                            <Check
                              className="absolute top-0.5 right-0.5 w-2.5 h-2.5 text-emerald-700 stroke-[3]"
                              aria-hidden="true"
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Dual-Coded Legend */}
              <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded bg-emerald-100 border border-emerald-400 inline-flex items-center justify-center">
                    <Check className="w-2.5 h-2.5 text-emerald-700" />
                  </span>
                  <span>Sudah Dijawab</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded bg-amber-100 border border-amber-400 inline-flex items-center justify-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                  </span>
                  <span>Ragu-Ragu</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded bg-white border border-slate-300" />
                  <span>Belum Dijawab</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded bg-white border-2 border-slate-900" />
                  <span>Soal Aktif</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowSubmitConfirmModal(true)}
                disabled={isSubmitting}
                className="w-full h-11 px-4 inline-flex items-center justify-center gap-2 text-sm font-semibold text-white bg-sky-700 rounded-lg hover:bg-sky-800 disabled:opacity-50 cursor-pointer whitespace-nowrap"
              >
                <Send className="w-4 h-4" />
                <span>{isSubmitting ? 'Mengenkripsi & Mengirim...' : 'Selesai & Kirim Ujian'}</span>
              </button>
            </div>
          </aside>
        </div>
      </main>

      {/* Tab Switch Warning Modal */}
      {showTabWarningModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white border border-red-200 rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-red-50 text-red-600 shrink-0">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Peringatan Perpindahan Tab / Jendela
                </h3>
                <p className="mt-1 text-sm text-slate-600 leading-relaxed">
                  Sistem mendeteksi Anda meninggalkan halaman ujian. Aktivitas ini telah dicatat
                  dalam log pengawasan (Total pelanggaran:{' '}
                  <strong className="font-mono text-red-700">{session.tabViolations} kali</strong>
                  ).
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowTabWarningModal(false)}
              className="w-full h-10 text-sm font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 cursor-pointer"
            >
              Saya Mengerti & Kembali Mengerjakan
            </button>
          </div>
        </div>
      )}

      {/* Submit Confirmation Modal */}
      {showSubmitConfirmModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white border border-slate-200 rounded-xl max-w-md w-full p-6 space-y-5 shadow-xl">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-sky-50 text-sky-700 shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Konfirmasi Pengumpulan Ujian
                </h3>
                <p className="mt-1 text-sm text-slate-600 leading-relaxed">
                  Setelah dikumpulkan, jawaban akan dienkripsi dengan AES-256-GCM dan dikirim ke
                  server jurusan. Anda tidak dapat mengubah jawaban lagi.
                </p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 grid grid-cols-3 gap-3 text-center text-xs">
              <div>
                <span className="block text-base font-bold font-mono tabular-nums text-emerald-700">
                  {stats.answered}
                </span>
                <span className="text-slate-600">Dijawab</span>
              </div>
              <div>
                <span className="block text-base font-bold font-mono tabular-nums text-amber-700">
                  {stats.flagged}
                </span>
                <span className="text-slate-600">Ragu-Ragu</span>
              </div>
              <div>
                <span className="block text-base font-bold font-mono tabular-nums text-slate-700">
                  {stats.unanswered}
                </span>
                <span className="text-slate-600">Belum</span>
              </div>
            </div>

            {(stats.unanswered > 0 || stats.flagged > 0) && (
              <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-3">
                Masih terdapat {stats.unanswered} soal belum dijawab dan {stats.flagged} soal
                ditandai ragu-ragu. Pastikan Anda sudah memeriksa semua jawaban sebelum mengirim.
              </p>
            )}

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowSubmitConfirmModal(false)}
                disabled={isSubmitting}
                className="flex-1 h-10 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer"
              >
                Periksa Kembali
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowSubmitConfirmModal(false);
                  void onSubmitExam(session, false);
                }}
                disabled={isSubmitting}
                className="flex-1 h-10 text-sm font-semibold text-white bg-sky-700 rounded-lg hover:bg-sky-800 disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? 'Mengirim...' : 'Ya, Kirim Sekarang'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
