import { EXAM_CONFIG, PG_BANK, PGK_BANK, URAIAN_BANK } from '../data/questionBank';
import { ExamPaper, RenderedOption, RenderedQuestion, StudentRecord } from '../types/cbt';

const LABELS_PG = ['A', 'B', 'C', 'D', 'E'];
const LABELS_PGK = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];

export function fnv1a32(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

export function createMulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function seededShuffle<T>(items: readonly T[], rng: () => number): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const temp = arr[i];
    arr[i] = arr[j];
    arr[j] = temp;
  }
  return arr;
}

export function getLocalDateKey(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function generateExamPaper(
  student: StudentRecord,
  dateKey: string = getLocalDateKey()
): ExamPaper {
  const seedString = `${student.sekolah}|${student.kelas}|${student.nisNoPeserta}|${student.namaLabel}|${dateKey}|TJKN-SAS-2026`;
  const seedHash = fnv1a32(seedString);
  const rng = createMulberry32(seedHash);

  // 1. Sample 30 PG from 60 PG
  const shuffledPG = seededShuffle(PG_BANK, rng).slice(0, EXAM_CONFIG.pgCount);
  // 2. Sample 15 PGK from 30 PGK
  const shuffledPGK = seededShuffle(PGK_BANK, rng).slice(0, EXAM_CONFIG.pgkCount);
  // 3. Sample 5 Uraian from 10 Uraian
  const shuffledUraian = seededShuffle(URAIAN_BANK, rng).slice(0, EXAM_CONFIG.uraianCount);

  const questions: RenderedQuestion[] = [];
  let displayNumber = 1;

  for (const q of shuffledPG) {
    const shuffledOptions = seededShuffle(q.options, rng);
    const renderedOptions: RenderedOption[] = shuffledOptions.map((opt, idx) => ({
      displayLabel: LABELS_PG[idx],
      originalKey: opt.originalKey,
      text: opt.text,
    }));

    questions.push({
      displayNumber: displayNumber++,
      questionId: q.id,
      type: 'PG',
      topic: q.topic,
      prompt: q.prompt,
      options: renderedOptions,
      correctKeys: [q.correctKey],
    });
  }

  for (const q of shuffledPGK) {
    const shuffledOptions = seededShuffle(q.options, rng);
    const renderedOptions: RenderedOption[] = shuffledOptions.map((opt, idx) => ({
      displayLabel: LABELS_PGK[idx],
      originalKey: opt.originalKey,
      text: opt.text,
    }));

    questions.push({
      displayNumber: displayNumber++,
      questionId: q.id,
      type: 'PGK',
      topic: q.topic,
      prompt: q.prompt,
      options: renderedOptions,
      correctKeys: [...q.correctKeys],
    });
  }

  for (const q of shuffledUraian) {
    questions.push({
      displayNumber: displayNumber++,
      questionId: q.id,
      type: 'URAIAN',
      topic: q.topic,
      prompt: q.prompt,
      rubric: q.rubric,
    });
  }

  return {
    seedString,
    seedHash,
    questions,
  };
}
