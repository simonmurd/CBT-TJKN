export type QuestionType = 'PG' | 'PGK' | 'URAIAN';

export interface StudentRecord {
  id: string;
  sekolah: string;
  kelas: string;
  absen: string;
  nama: string;
  namaLabel: string;
  nisNoPeserta: string;
}

export interface QuestionOption {
  originalKey: string; // e.g., 'A', 'B', ..., 'J'
  text: string;
}

export interface PGQuestion {
  id: string; // e.g., 'PG-01'
  type: 'PG';
  topic: string;
  isOriginal: boolean;
  prompt: string;
  options: QuestionOption[]; // 5 options
  correctKey: string; // originalKey
}

export interface PGKQuestion {
  id: string; // e.g., 'PGK-01'
  type: 'PGK';
  topic: string;
  isOriginal: boolean;
  prompt: string;
  options: QuestionOption[]; // 10 options
  correctKeys: string[]; // exactly 5 originalKeys
}

export interface UraianQuestion {
  id: string; // e.g., 'UR-01'
  type: 'URAIAN';
  topic: string;
  isOriginal: boolean;
  prompt: string;
  rubric: string;
  keywords: string[];
}

export type AnyBankQuestion = PGQuestion | PGKQuestion | UraianQuestion;

export interface RenderedOption {
  displayLabel: string; // 'A'..'E' or 'A'..'J'
  originalKey: string;
  text: string;
}

export interface RenderedQuestion {
  displayNumber: number;
  questionId: string;
  type: QuestionType;
  topic: string;
  prompt: string;
  options?: RenderedOption[];
  correctKeys?: string[]; // originalKeys (stored internally only for grading, never shown to student)
  rubric?: string;
}

export interface ExamPaper {
  seedString: string;
  seedHash: number;
  questions: RenderedQuestion[];
}

export type AnswerValue = string | string[]; // PG: originalKey string, PGK: originalKey[], URAIAN: text

export interface TabViolationLog {
  timestamp: string;
  type: 'visibilitychange' | 'blur';
}

export interface ExamSessionState {
  student: StudentRecord;
  token: string;
  startedAtIso: string;
  endAtMs: number;
  currentIndex: number;
  answers: Record<string, AnswerValue>; // keyed by original questionId
  flagged: Record<string, boolean>; // keyed by original questionId
  tabViolations: number;
  violationLogs: TabViolationLog[];
  lastSavedAtIso: string;
  submitted: boolean;
}

export interface RekapJawabanItem {
  questionId: string;
  nomor_tampil: number;
  tipe_soal: QuestionType;
  jawaban_siswa: string | string[];
  jawaban_siswa_teks: string;
  kunci_jawaban: string | string[];
  kunci_jawaban_teks: string;
  status_benar_salah: 'BENAR' | 'SALAH' | 'PARSIAL' | 'PERLU_KOREKSI_MANUAL';
  skor_item: number;
  skor_maksimal: number;
}

export interface DecryptedHasilBundle {
  skor_pg: number;
  skor_pgk: number;
  total_skor_otomatis: number;
  detail_skor: {
    pg_benar: number;
    pg_total: number;
    pgk_poin: number;
    pgk_maksimal: number;
    uraian_terjawab: number;
    uraian_total: number;
  };
  rekap_jawaban: RekapJawabanItem[];
}

export type DeliveryStatus = 'IDLE' | 'SENDING' | 'SENT_VERIFIED' | 'SENT_NOCORS' | 'FAILED_QUEUED';

export interface SubmissionEnvelope {
  timestamp: string;
  nama_peserta: string;
  nama_lengkap: string;
  nis_no_peserta: string;
  kelas: string;
  kelas_rombel: string;
  sekolah: string;
  mata_pelajaran: string;
  pilihan_lkpd: string;
  token_ujian: string;
  durasi_detik: number;
  durasi_terpakai_detik: number;
  jumlah_pelanggaran_tab: number;
  soal_terjawab: {
    pg: number;
    pgk: number;
    uraian: number;
    total: number;
    dari_total: number;
  };
  encryption_version: string;
  integrity_sha256: string;
  // Encrypted fields so students cannot inspect scores or answer keys in localStorage / backups
  skor_pg: string;
  skor_pgk: string;
  total_skor_otomatis: string;
  rekap_jawaban: string;
  encrypted_payload: string;
}

export interface CompletedSessionSummary {
  envelope: SubmissionEnvelope;
  deliveryStatus: DeliveryStatus;
  deliveryMessage: string;
  lastAttemptIso: string;
}
