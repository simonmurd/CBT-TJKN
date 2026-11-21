import React, { useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  KeyRound,
  Lock,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
} from 'lucide-react';
import { EXAM_CONFIG } from '../data/questionBank';
import { CompletedSessionSummary } from '../types/cbt';
import { downloadBackupCsv, downloadBackupJson } from '../utils/gasSubmission';

interface SummaryViewProps {
  summary: CompletedSessionSummary;
  onRetrySend: () => Promise<void>;
  isRetrying: boolean;
  onResetToLogin: () => void;
  onOpenTeacherModal: () => void;
}

export const SummaryView: React.FC<SummaryViewProps> = ({
  summary,
  onRetrySend,
  isRetrying,
  onResetToLogin,
  onOpenTeacherModal,
}) => {
  const [confirmExit, setConfirmExit] = useState(false);
  const { envelope, deliveryStatus, deliveryMessage, lastAttemptIso } = summary;

  const durationMins = Math.floor(envelope.durasi_terpakai_detik / 60);
  const durationSecs = envelope.durasi_terpakai_detik % 60;

  const isSuccess = deliveryStatus === 'SENT_VERIFIED' || deliveryStatus === 'SENT_NOCORS';

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* 3-Zone Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
          <div className="text-base sm:text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0">
            {EXAM_CONFIG.schoolName}
          </div>

          <div className="hidden md:flex items-center gap-3 text-sm text-slate-500 whitespace-nowrap shrink-0">
            <span>{EXAM_CONFIG.subject}</span>
            <span aria-hidden="true">·</span>
            <span>Ringkasan Sesi Ujian</span>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={onOpenTeacherModal}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer whitespace-nowrap shrink-0"
            >
              <KeyRound className="w-3.5 h-3.5 text-slate-500" />
              <span>Portal Guru</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-6">
        {/* Completion Banner */}
        <section className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-slate-100">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-700">
                <ShieldCheck className="w-4 h-4" />
                <span>Sesi Ujian Selesai & Terenkripsi ({envelope.encryption_version})</span>
              </div>
              <h1 className="text-2xl font-bold text-slate-900">
                Terima Kasih, {envelope.nama_peserta}
              </h1>
              <p className="text-sm text-slate-600">
                Rekaman jawaban Anda telah dikunci dan dienkripsi sebelum dikirim ke server penilaian
                jurusan.
              </p>
            </div>
          </div>

          {/* Delivery Status Box */}
          <div
            className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
              isSuccess
                ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                : deliveryStatus === 'SENDING'
                ? 'bg-sky-50 border-sky-200 text-sky-900'
                : 'bg-red-50 border-red-200 text-red-900'
            }`}
          >
            <div className="flex items-start gap-3">
              {isSuccess ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              )}
              <div className="space-y-1">
                <p className="text-sm font-bold">
                  Status Pengiriman Server:{' '}
                  {deliveryStatus === 'SENT_VERIFIED'
                    ? 'Berhasil Terkirim (Terverifikasi)'
                    : deliveryStatus === 'SENT_NOCORS'
                    ? 'Berhasil Terkirim ke Google Apps Script'
                    : deliveryStatus === 'SENDING'
                    ? 'Sedang Mengirim Data...'
                    : 'Gagal / Antrean Ulang'}
                </p>
                <p className="text-xs leading-relaxed opacity-90">{deliveryMessage}</p>
                <p className="text-[11px] font-mono opacity-75">
                  Percobaan terakhir: {new Date(lastAttemptIso).toLocaleString('id-ID')}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => void onRetrySend()}
              disabled={isRetrying}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold bg-white border border-slate-300 text-slate-800 rounded-lg hover:bg-slate-50 disabled:opacity-50 cursor-pointer whitespace-nowrap shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRetrying ? 'animate-spin' : ''}`} />
              <span>{isRetrying ? 'Mengirim Ulang...' : 'Kirim Ulang Data'}</span>
            </button>
          </div>

          {/* Student & Session Metadata (Strictly NO scores or correctness!) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="text-xs text-slate-500 block">Identitas Peserta</span>
              <span className="text-sm font-bold text-slate-900 block mt-0.5">
                {envelope.nama_peserta}
              </span>
              <span className="text-xs font-mono text-slate-600 block mt-0.5">
                {envelope.nis_no_peserta}
              </span>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="text-xs text-slate-500 block">Sekolah & Kelas</span>
              <span className="text-sm font-semibold text-slate-900 block mt-0.5">
                {envelope.kelas_rombel}
              </span>
              <span className="text-xs font-mono text-slate-600 block mt-0.5">
                Token: {envelope.token_ujian}
              </span>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="text-xs text-slate-500 block">Waktu Terpakai</span>
              <span className="text-lg font-bold font-mono tabular-nums text-slate-900 block mt-0.5">
                {durationMins}m {String(durationSecs).padStart(2, '0')}d
              </span>
              <span className="text-xs text-slate-500 block mt-0.5">
                Dari batas {EXAM_CONFIG.durationMinutes} menit
              </span>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="text-xs text-slate-500 block">Catatan Pengawasan</span>
              <span
                className={`text-lg font-bold font-mono tabular-nums block mt-0.5 ${
                  envelope.jumlah_pelanggaran_tab > 0 ? 'text-red-700' : 'text-emerald-700'
                }`}
              >
                {envelope.jumlah_pelanggaran_tab} Pelanggaran
              </span>
              <span className="text-xs text-slate-500 block mt-0.5">Perpindahan tab/jendela</span>
            </div>
          </div>

          {/* Question Coverage Summary (Counts Only, No Right/Wrong) */}
          <div className="border border-slate-200 rounded-xl p-5 space-y-4">
            <h2 className="text-sm font-bold text-slate-900">Ringkasan Kelengkapan Jawaban</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-600">Pilihan Ganda</span>
                <span className="font-mono font-bold tabular-nums text-slate-900">
                  {envelope.soal_terjawab.pg} / {EXAM_CONFIG.pgCount} terjawab
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-600">PG Kompleks</span>
                <span className="font-mono font-bold tabular-nums text-slate-900">
                  {envelope.soal_terjawab.pgk} / {EXAM_CONFIG.pgkCount} terjawab
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-600">Uraian</span>
                <span className="font-mono font-bold tabular-nums text-slate-900">
                  {envelope.soal_terjawab.uraian} / {EXAM_CONFIG.uraianCount} terjawab
                </span>
              </div>
            </div>

            {/* Privacy / Encryption Notice */}
            <div className="p-4 rounded-lg bg-slate-900 text-slate-100 flex items-start gap-3">
              <Lock className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs leading-relaxed">
                <p className="font-semibold text-white">
                  Proteksi Nilai & Kunci Jawaban Aktif ({envelope.encryption_version})
                </p>
                <p className="text-slate-300">
                  Sesuai kebijakan evaluasi, nilai ujian serta status benar/salah tiap butir soal
                  telah dienkripsi sebelum dikirim ke server dan disembunyikan dari layar peserta.
                  Hash integritas pengiriman:{' '}
                  <span className="font-mono text-sky-300 break-all">
                    {envelope.integrity_sha256.slice(0, 32)}...
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Backup & Exit Actions */}
          <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => downloadBackupJson(envelope)}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer whitespace-nowrap"
              >
                <Download className="w-4 h-4" />
                <span>Unduh JSON Cadangan</span>
              </button>
              <button
                type="button"
                onClick={() => downloadBackupCsv(envelope)}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer whitespace-nowrap"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Unduh CSV Cadangan</span>
              </button>
            </div>

            {!confirmExit ? (
              <button
                type="button"
                onClick={() => setConfirmExit(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 bg-slate-100 border border-slate-200 rounded-lg hover:bg-slate-200 cursor-pointer whitespace-nowrap"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Selesai & Peserta Berikutnya</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmExit(false)}
                  className="px-3 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={onResetToLogin}
                  className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 cursor-pointer"
                >
                  Ya, Keluar ke Halaman Login
                </button>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};
