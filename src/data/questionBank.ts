import { PG_BANK } from './questionsPG';
import { PGK_BANK } from './questionsPGK';
import { URAIAN_BANK } from './questionsUraian';

export { PG_BANK, PGK_BANK, URAIAN_BANK };

export const EXAM_CONFIG = {
  schoolName: 'SMK Mudita Singkawang',
  subject: 'Teknologi Jaringan Kabel dan Nirkabel',
  examTitle: 'Penilaian Sumatif Akhir Semester (SAS) Ganjil',
  academicYear: '2026/2027',
  durationMinutes: 120,
  pgCount: 30,
  pgkCount: 15,
  uraianCount: 5,
  gasEndpoint:
    'https://script.google.com/macros/s/AKfycbxIHEj4PfQ-6nOP3YQ4Ja9JftskHh0mazXn1WfDDKitltP6EyUhtXZ6GGDwUDwq5ZbX/exec',
  validTokens: ['TJKN2026', 'MUDITA2026', 'SAS2026', 'SASGANJIL', 'TKJ2026'],
};
