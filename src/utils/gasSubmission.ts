import { EXAM_CONFIG } from '../data/questionBank';
import {
  CompletedSessionSummary,
  DecryptedHasilBundle,
  DeliveryStatus,
  ExamPaper,
  ExamSessionState,
  RekapJawabanItem,
  SubmissionEnvelope,
} from '../types/cbt';
import { decryptText, encryptText, sha256Hex } from './crypto';

const SESSION_STORAGE_KEY = 'cbt_tjkn_active_session_v1';
const COMPLETED_STORAGE_KEY = 'cbt_tjkn_completed_summary_v1';

export function saveActiveSession(session: ExamSessionState): void {
  try {
    // Store answers & state cleanly without answer keys (keys come dynamically from seeded PRNG)
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  } catch {
    // Ignore quota errors gracefully
  }
}

export function loadActiveSession(): ExamSessionState | null {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ExamSessionState;
    if (!parsed?.student?.id || !parsed?.endAtMs) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearActiveSession(): void {
  try {
    localStorage.removeItem(SESSION_STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function saveCompletedSummary(summary: CompletedSessionSummary): void {
  try {
    localStorage.setItem(COMPLETED_STORAGE_KEY, JSON.stringify(summary));
  } catch {
    // ignore
  }
}

export function loadCompletedSummary(): CompletedSessionSummary | null {
  try {
    const raw = localStorage.getItem(COMPLETED_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CompletedSessionSummary;
  } catch {
    return null;
  }
}

export function clearCompletedSummary(): void {
  try {
    localStorage.removeItem(COMPLETED_STORAGE_KEY);
  } catch {
    // ignore
  }
}

function formatOptionText(
  qOptions: { originalKey: string; text: string }[] | undefined,
  keys: string | string[]
): string {
  if (!qOptions) {
    return Array.isArray(keys) ? keys.join(', ') : keys;
  }
  const keyList = Array.isArray(keys) ? keys : keys ? [keys] : [];
  if (keyList.length === 0) return '(Tidak dijawab)';
  return keyList
    .map((k) => {
      const found = qOptions.find((o) => o.originalKey === k);
      return found ? `[${k}] ${found.text}` : k;
    })
    .join(' | ');
}

export function gradeExamSession(session: ExamSessionState, paper: ExamPaper): DecryptedHasilBundle {
  const rekap: RekapJawabanItem[] = [];
  let pgBenar = 0;
  let pgTotal = 0;
  let pgkPoin = 0;
  let pgkMaksimal = 0;
  let uraianTerjawab = 0;
  let uraianTotal = 0;

  for (const q of paper.questions) {
    const rawAns = session.answers[q.questionId];

    if (q.type === 'PG') {
      pgTotal++;
      const studentKey = typeof rawAns === 'string' ? rawAns : '';
      const correctKey = q.correctKeys?.[0] ?? '';
      const isCorrect = Boolean(studentKey && studentKey === correctKey);
      if (isCorrect) pgBenar++;

      rekap.push({
        questionId: q.questionId,
        nomor_tampil: q.displayNumber,
        tipe_soal: 'PG',
        jawaban_siswa: studentKey || '-',
        jawaban_siswa_teks: formatOptionText(q.options, studentKey),
        kunci_jawaban: correctKey,
        kunci_jawaban_teks: formatOptionText(q.options, correctKey),
        status_benar_salah: isCorrect ? 'BENAR' : 'SALAH',
        skor_item: isCorrect ? 1 : 0,
        skor_maksimal: 1,
      });
    } else if (q.type === 'PGK') {
      pgkTotalCheck();
      function pgkTotalCheck() {
        pgkMaksimal += 5;
      }
      const studentKeys = Array.isArray(rawAns) ? [...rawAns].sort() : [];
      const correctKeys = [...(q.correctKeys ?? [])].sort();
      const correctSet = new Set(correctKeys);
      let matched = 0;
      for (const k of studentKeys) {
        if (correctSet.has(k)) matched++;
      }
      pgkPoin += matched;

      let status: RekapJawabanItem['status_benar_salah'] = 'SALAH';
      if (matched === 5 && studentKeys.length === 5) status = 'BENAR';
      else if (matched > 0) status = 'PARSIAL';

      rekap.push({
        questionId: q.questionId,
        nomor_tampil: q.displayNumber,
        tipe_soal: 'PGK',
        jawaban_siswa: studentKeys,
        jawaban_siswa_teks: formatOptionText(q.options, studentKeys),
        kunci_jawaban: correctKeys,
        kunci_jawaban_teks: formatOptionText(q.options, correctKeys),
        status_benar_salah: status,
        skor_item: matched,
        skor_maksimal: 5,
      });
    } else {
      uraianTotal++;
      const textAns = typeof rawAns === 'string' ? rawAns.trim() : '';
      if (textAns.length > 0) uraianTerjawab++;

      rekap.push({
        questionId: q.questionId,
        nomor_tampil: q.displayNumber,
        tipe_soal: 'URAIAN',
        jawaban_siswa: textAns || '-',
        jawaban_siswa_teks: textAns || '(Tidak dijawab)',
        kunci_jawaban: q.rubric ?? '',
        kunci_jawaban_teks: q.rubric ?? '',
        status_benar_salah: 'PERLU_KOREKSI_MANUAL',
        skor_item: 0,
        skor_maksimal: 10,
      });
    }
  }

  // Bobot otomatis: PG (50%) + PGK (50%) untuk bagian objektif skala 0-100
  const skor_pg = pgTotal > 0 ? Number(((pgBenar / pgTotal) * 50).toFixed(2)) : 0;
  const skor_pgk = pgkMaksimal > 0 ? Number(((pgkPoin / pgkMaksimal) * 50).toFixed(2)) : 0;
  const total_skor_otomatis = Number((skor_pg + skor_pgk).toFixed(2));

  return {
    skor_pg,
    skor_pgk,
    total_skor_otomatis,
    detail_skor: {
      pg_benar: pgBenar,
      pg_total: pgTotal,
      pgk_poin: pgkPoin,
      pgk_maksimal: pgkMaksimal,
      uraian_terjawab: uraianTerjawab,
      uraian_total: uraianTotal,
    },
    rekap_jawaban: rekap,
  };
}

export async function buildEncryptedSubmissionEnvelope(
  session: ExamSessionState,
  paper: ExamPaper
): Promise<SubmissionEnvelope> {
  const hasil = gradeExamSession(session, paper);
  const nowIso = new Date().toISOString();
  const startedMs = new Date(session.startedAtIso).getTime();
  const totalDurationSec = EXAM_CONFIG.durationMinutes * 60;
  const elapsedSec = Math.max(
    1,
    Math.min(totalDurationSec, Math.round((Date.now() - startedMs) / 1000))
  );

  let answeredPg = 0;
  let answeredPgk = 0;
  let answeredUraian = 0;
  for (const q of paper.questions) {
    const ans = session.answers[q.questionId];
    if (q.type === 'PG' && typeof ans === 'string' && ans.length > 0) answeredPg++;
    if (q.type === 'PGK' && Array.isArray(ans) && ans.length > 0) answeredPgk++;
    if (q.type === 'URAIAN' && typeof ans === 'string' && ans.trim().length > 0) answeredUraian++;
  }

  // Encrypt all sensitive grading & answer-key fields before sending or downloading
  const [encSkorPg, encSkorPgk, encTotalSkor, encRekap, encBundle] = await Promise.all([
    encryptText(String(hasil.skor_pg)),
    encryptText(String(hasil.skor_pgk)),
    encryptText(String(hasil.total_skor_otomatis)),
    encryptText(JSON.stringify(hasil.rekap_jawaban)),
    encryptText(
      JSON.stringify({
        peserta: {
          nama_peserta: session.student.namaLabel,
          nis_no_peserta: session.student.nisNoPeserta,
          kelas_rombel: session.student.kelas,
          sekolah: session.student.sekolah,
          token_ujian: session.token,
          durasi_terpakai_detik: elapsedSec,
          jumlah_pelanggaran_tab: session.tabViolations,
          timestamp: nowIso,
        },
        hasil,
      })
    ),
  ]);

  const integrity_sha256 = await sha256Hex(
    `${session.student.nisNoPeserta}|${nowIso}|${encBundle}`
  );

  return {
    timestamp: nowIso,
    nama_peserta: session.student.namaLabel,
    nama_lengkap: session.student.namaLabel,
    nis_no_peserta: session.student.nisNoPeserta,
    kelas: session.student.kelas,
    kelas_rombel: `${session.student.sekolah} — ${session.student.kelas}`,
    sekolah: session.student.sekolah,
    mata_pelajaran: EXAM_CONFIG.subject,
    pilihan_lkpd: `SAS TJKN (${session.token}) · Tab:${session.tabViolations}`,
    token_ujian: session.token,
    durasi_detik: elapsedSec,
    durasi_terpakai_detik: elapsedSec,
    jumlah_pelanggaran_tab: session.tabViolations,
    soal_terjawab: {
      pg: answeredPg,
      pgk: answeredPgk,
      uraian: answeredUraian,
      total: answeredPg + answeredPgk + answeredUraian,
      dari_total: paper.questions.length,
    },
    encryption_version: 'AES-256-GCM-v1',
    integrity_sha256,
    skor_pg: encSkorPg,
    skor_pgk: encSkorPgk,
    total_skor_otomatis: encTotalSkor,
    rekap_jawaban: encRekap,
    encrypted_payload: encBundle,
  };
}

export async function sendEnvelopeToGAS(envelope: SubmissionEnvelope): Promise<{
  status: DeliveryStatus;
  message: string;
}> {
  // Decrypt score fields strictly in memory for Apps Script doPost(e) columns G & H,
  // while keeping rekap_jawaban & encrypted_payload AES-256-GCM encrypted and never exposing scores in UI/localStorage.
  let skorPgBenar: number | string = envelope.skor_pg;
  let nilaiAkhir: number | string = envelope.total_skor_otomatis;
  try {
    const plainBundleJson = await decryptText(envelope.encrypted_payload);
    const parsed = JSON.parse(plainBundleJson) as { hasil?: DecryptedHasilBundle };
    if (parsed?.hasil) {
      skorPgBenar = parsed.hasil.detail_skor.pg_benar;
      nilaiAkhir = parsed.hasil.total_skor_otomatis;
    }
  } catch {
    // Keep encrypted tokens if in-memory decrypt fails
  }

  const gasPayload = {
    // Field sesuai doPost(e) Google Apps Script (Kolom B - H)
    sekolah: envelope.sekolah,
    kelas: envelope.kelas,
    nama_lengkap: envelope.nama_lengkap,
    pilihan_lkpd: envelope.pilihan_lkpd,
    durasi_detik: envelope.durasi_detik,
    skor_pg_benar: skorPgBenar,
    nilai_akhir: nilaiAkhir,
    // Field lengkap CBT & enkripsi jawaban
    timestamp: envelope.timestamp,
    nama_peserta: envelope.nama_peserta,
    nis_no_peserta: envelope.nis_no_peserta,
    kelas_rombel: envelope.kelas_rombel,
    mata_pelajaran: envelope.mata_pelajaran,
    token_ujian: envelope.token_ujian,
    durasi_terpakai_detik: envelope.durasi_terpakai_detik,
    jumlah_pelanggaran_tab: envelope.jumlah_pelanggaran_tab,
    encryption_version: envelope.encryption_version,
    integrity_sha256: envelope.integrity_sha256,
    skor_pg: envelope.skor_pg,
    skor_pgk: envelope.skor_pgk,
    total_skor_otomatis: envelope.total_skor_otomatis,
    rekap_jawaban: envelope.rekap_jawaban,
    encrypted_payload: envelope.encrypted_payload,
  };

  const bodyJson = JSON.stringify(gasPayload);

  // Attempt 1: Standard CORS fetch (text/plain avoids preflight OPTIONS issues on Google Apps Script)
  try {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 12000);
    const res = await fetch(EXAM_CONFIG.gasEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: bodyJson,
      signal: controller.signal,
    });
    window.clearTimeout(timeoutId);

    if (res.ok) {
      const json = (await res.json().catch(() => null)) as {
        result?: string;
        message?: string;
        error?: string;
      } | null;

      if (json?.result === 'error') {
        return {
          status: 'FAILED_QUEUED',
          message: `Server Apps Script mengembalikan error: ${json.error || 'Kesalahan tidak diketahui'}.`,
        };
      }

      return {
        status: 'SENT_VERIFIED',
        message:
          json?.message ||
          'Data terenkripsi berhasil disimpan oleh Google Apps Script.',
      };
    }
  } catch {
    // Fall through to no-cors fallback (standard behavior for Google Apps Script 302 redirects)
  }

  // Attempt 2: no-cors fallback for Google Apps Script redirect
  try {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 12000);
    await fetch(EXAM_CONFIG.gasEndpoint, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: bodyJson,
      signal: controller.signal,
    });
    window.clearTimeout(timeoutId);

    return {
      status: 'SENT_NOCORS',
      message:
        'Payload terenkripsi berhasil dikirim ke Google Apps Script (mode no-cors). Simpan cadangan JSON/CSV bila diperlukan.',
    };
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : 'Koneksi jaringan terputus';
    return {
      status: 'FAILED_QUEUED',
      message: `Gagal menghubungi server (${errMsg}). Data disimpan di antrean lokal—gunakan tombol Kirim Ulang Data atau Unduh Cadangan.`,
    };
  }
}

export function downloadBackupJson(envelope: SubmissionEnvelope): void {
  const blob = new Blob([JSON.stringify(envelope, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const safeName = envelope.nis_no_peserta.replace(/[^a-zA-Z0-9_-]/g, '_');
  a.href = url;
  a.download = `CBT_TJKN_${safeName}_${envelope.timestamp.slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadBackupCsv(envelope: SubmissionEnvelope): void {
  const headers = [
    'timestamp',
    'nama_peserta',
    'nis_no_peserta',
    'kelas_rombel',
    'mata_pelajaran',
    'token_ujian',
    'durasi_terpakai_detik',
    'jumlah_pelanggaran_tab',
    'encryption_version',
    'integrity_sha256',
    'skor_pg_encrypted',
    'skor_pgk_encrypted',
    'total_skor_otomatis_encrypted',
    'rekap_jawaban_encrypted',
    'encrypted_payload',
  ];

  const escapeCsv = (val: string | number) => {
    const str = String(val ?? '');
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const row = [
    envelope.timestamp,
    envelope.nama_peserta,
    envelope.nis_no_peserta,
    envelope.kelas_rombel,
    envelope.mata_pelajaran,
    envelope.token_ujian,
    envelope.durasi_terpakai_detik,
    envelope.jumlah_pelanggaran_tab,
    envelope.encryption_version,
    envelope.integrity_sha256,
    envelope.skor_pg,
    envelope.skor_pgk,
    envelope.total_skor_otomatis,
    envelope.rekap_jawaban,
    envelope.encrypted_payload,
  ];

  const csvContent = `${headers.join(',')}\n${row.map(escapeCsv).join(',')}\n`;
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const safeName = envelope.nis_no_peserta.replace(/[^a-zA-Z0-9_-]/g, '_');
  a.href = url;
  a.download = `CBT_TJKN_${safeName}_${envelope.timestamp.slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
