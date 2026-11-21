import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Clock,
  FileText,
  KeyRound,
  Lock,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import { EXAM_CONFIG } from '../data/questionBank';
import { SCHOOL_LIST, STUDENTS_DB } from '../data/students';
import { StudentRecord } from '../types/cbt';

interface LoginViewProps {
  onStartExam: (student: StudentRecord, token: string) => void;
  onOpenTeacherModal: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onStartExam, onOpenTeacherModal }) => {
  const [selectedSekolah, setSelectedSekolah] = useState<string>('');
  const [selectedKelas, setSelectedKelas] = useState<string>('');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [tokenInput, setTokenInput] = useState<string>('');
  const [confirmedIdentity, setConfirmedIdentity] = useState<boolean>(false);
  const [tokenError, setTokenError] = useState<string>('');
  const [isValidatingRemote, setIsValidatingRemote] = useState<boolean>(false);

  // Dropdown 2: Filtered Kelas by selectedSekolah
  const availableKelas = useMemo(() => {
    if (!selectedSekolah) return [];
    return Array.from(
      new Set(STUDENTS_DB.filter((s) => s.sekolah === selectedSekolah).map((s) => s.kelas))
    );
  }, [selectedSekolah]);

  // Dropdown 3: Filtered Nama Peserta sorted A-Z by nama
  const availableStudents = useMemo(() => {
    if (!selectedSekolah || !selectedKelas) return [];
    return STUDENTS_DB.filter(
      (s) => s.sekolah === selectedSekolah && s.kelas === selectedKelas
    ).sort((a, b) => {
      const nameCmp = a.nama.localeCompare(b.nama, 'id', { sensitivity: 'base' });
      if (nameCmp !== 0) return nameCmp;
      return a.absen.localeCompare(b.absen, 'id');
    });
  }, [selectedSekolah, selectedKelas]);

  const selectedStudent = useMemo(
    () => availableStudents.find((s) => s.id === selectedStudentId) ?? null,
    [availableStudents, selectedStudentId]
  );

  // Cascading reset handlers
  const handleSekolahChange = (value: string) => {
    setSelectedSekolah(value);
    setSelectedKelas('');
    setSelectedStudentId('');
    setConfirmedIdentity(false);
  };

  const handleKelasChange = (value: string) => {
    setSelectedKelas(value);
    setSelectedStudentId('');
    setConfirmedIdentity(false);
  };

  const handleStudentChange = (value: string) => {
    setSelectedStudentId(value);
    setConfirmedIdentity(false);
  };

  const normalizedToken = tokenInput.trim().toUpperCase();
  const isTokenLocallyValid = EXAM_CONFIG.validTokens.includes(normalizedToken);
  const canSubmit = Boolean(
    selectedStudent && normalizedToken.length >= 4 && confirmedIdentity && !isValidatingRemote
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !confirmedIdentity) return;

    setTokenError('');
    if (isTokenLocallyValid) {
      onStartExam(selectedStudent, normalizedToken);
      return;
    }

    // Optional check against Apps Script if custom proctor token is configured remotely
    setIsValidatingRemote(true);
    try {
      const controller = new AbortController();
      const tid = window.setTimeout(() => controller.abort(), 4000);
      const url = `${EXAM_CONFIG.gasEndpoint}?action=validateToken&token=${encodeURIComponent(
        normalizedToken
      )}`;
      const res = await fetch(url, { method: 'GET', signal: controller.signal });
      window.clearTimeout(tid);
      if (res.ok) {
        const data = (await res.json().catch(() => null)) as { valid?: boolean } | null;
        if (data?.valid === true) {
          onStartExam(selectedStudent, normalizedToken);
          return;
        }
      }
      setTokenError(
        'Token ujian tidak dikenali. Periksa kembali token dari pengawas (contoh token sesi: TJKN2026).'
      );
    } catch {
      setTokenError(
        'Token ujian tidak valid. Gunakan token resmi dari pengawas ruang (contoh sesi: TJKN2026).'
      );
    } finally {
      setIsValidatingRemote(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* 3-Zone Top Bar */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
          <div className="text-base sm:text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0">
            {EXAM_CONFIG.schoolName}
          </div>

          <nav className="hidden md:flex items-center gap-4 text-sm text-slate-500 whitespace-nowrap shrink-0">
            <span>{EXAM_CONFIG.examTitle}</span>
            <span aria-hidden="true">·</span>
            <span>{EXAM_CONFIG.subject}</span>
          </nav>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={onOpenTeacherModal}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <KeyRound className="w-3.5 h-3.5 text-slate-500" />
              <span>Portal Guru</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Exam Briefing & Specifications */}
          <section className="lg:col-span-5 space-y-6">
            <div className="space-y-3">
              <p className="text-xs font-semibold tracking-wide text-sky-700">
                Tahun Pelajaran {EXAM_CONFIG.academicYear} · Sesi Ujian Terenkripsi
              </p>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 text-balance leading-tight">
                {EXAM_CONFIG.subject}
              </h1>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                Sistem Computer-Based Test (CBT) dengan paket soal unik untuk setiap peserta,
                penyimpanan otomatis di peramban, serta pengiriman hasil terenkripsi langsung ke
                server jurusan.
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
              <h2 className="text-sm font-semibold text-slate-900">Komposisi & Ketentuan Ujian</h2>

              <dl className="grid grid-cols-2 gap-4 pt-1 border-t border-slate-100 text-sm">
                <div>
                  <dt className="text-xs text-slate-500">Durasi Pengerjaan</dt>
                  <dd className="mt-0.5 font-semibold text-slate-900 font-mono tabular-nums flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-sky-700 shrink-0" />
                    <span>{EXAM_CONFIG.durationMinutes} Menit</span>
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Total Soal Peserta</dt>
                  <dd className="mt-0.5 font-semibold text-slate-900 font-mono tabular-nums flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-sky-700 shrink-0" />
                    <span>
                      {EXAM_CONFIG.pgCount + EXAM_CONFIG.pgkCount + EXAM_CONFIG.uraianCount} Butir
                    </span>
                  </dd>
                </div>
              </dl>

              <ul className="space-y-2.5 pt-3 border-t border-slate-100 text-xs sm:text-sm text-slate-600">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    <strong className="font-semibold text-slate-800">
                      {EXAM_CONFIG.pgCount} Pilihan Ganda
                    </strong>{' '}
                    (1 jawaban benar),{' '}
                    <strong className="font-semibold text-slate-800">
                      {EXAM_CONFIG.pgkCount} PG Kompleks
                    </strong>{' '}
                    (wajib pilih 5 dari 10 opsi), dan{' '}
                    <strong className="font-semibold text-slate-800">
                      {EXAM_CONFIG.uraianCount} Uraian
                    </strong>
                    .
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-sky-700 shrink-0 mt-0.5" />
                  <span>
                    Soal dan urutan opsi diacak secara deterministik berdasarkan identitas peserta
                    sehingga tetap konsisten bila halaman dimuat ulang.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    Berpindah tab atau jendela peramban selama ujian berlangsung tercatat otomatis
                    pada laporan pengawasan.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Lock className="w-4 h-4 text-slate-700 shrink-0 mt-0.5" />
                  <span>
                    Seluruh jawaban dan skor dienkripsi dengan AES-256-GCM sebelum dikirim ke
                    server. Peserta tidak dapat melihat nilai maupun kunci jawaban.
                  </span>
                </li>
              </ul>
            </div>
          </section>

          {/* Right Column: Cascading Login Form */}
          <section className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 sm:p-8">
            <div className="mb-6 pb-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">Identifikasi Peserta Ujian</h2>
              <p className="mt-1 text-sm text-slate-500">
                Pilih asal sekolah, kelas, dan nama Anda secara berurutan sesuai daftar peserta
                resmi.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Dropdown 1: Sekolah */}
              <div>
                <label
                  htmlFor="select-sekolah"
                  className="block text-xs font-semibold text-slate-700 mb-1.5"
                >
                  1. Asal Sekolah / Institusi
                </label>
                <select
                  id="select-sekolah"
                  value={selectedSekolah}
                  onChange={(e) => handleSekolahChange(e.target.value)}
                  className="w-full h-11 px-3.5 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-600 focus:border-sky-600 transition-colors"
                  required
                >
                  <option value="">— Pilih Sekolah —</option>
                  {SCHOOL_LIST.map((school) => (
                    <option key={school} value={school}>
                      {school}
                    </option>
                  ))}
                </select>
              </div>

              {/* Dropdown 2: Kelas / Jurusan */}
              <div>
                <label
                  htmlFor="select-kelas"
                  className="block text-xs font-semibold text-slate-700 mb-1.5"
                >
                  2. Kelas / Program Keahlian
                </label>
                <select
                  id="select-kelas"
                  value={selectedKelas}
                  onChange={(e) => handleKelasChange(e.target.value)}
                  disabled={!selectedSekolah}
                  className="w-full h-11 px-3.5 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-600 focus:border-sky-600 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors"
                  required
                >
                  <option value="">
                    {selectedSekolah ? '— Pilih Kelas / Jurusan —' : '— Pilih Sekolah Terlebih Dahulu —'}
                  </option>
                  {availableKelas.map((kelas) => (
                    <option key={kelas} value={kelas}>
                      {kelas}
                    </option>
                  ))}
                </select>
              </div>

              {/* Dropdown 3: Nama Peserta (A-Z) */}
              <div>
                <label
                  htmlFor="select-peserta"
                  className="block text-xs font-semibold text-slate-700 mb-1.5"
                >
                  3. Nama Peserta (Urut A–Z)
                </label>
                <select
                  id="select-peserta"
                  value={selectedStudentId}
                  onChange={(e) => handleStudentChange(e.target.value)}
                  disabled={!selectedKelas}
                  className="w-full h-11 px-3.5 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-600 focus:border-sky-600 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors"
                  required
                >
                  <option value="">
                    {selectedKelas
                      ? `— Pilih Nama Peserta (${availableStudents.length} siswa) —`
                      : '— Pilih Kelas Terlebih Dahulu —'}
                  </option>
                  {availableStudents.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.nama} (No. Absen {student.absen})
                    </option>
                  ))}
                </select>
              </div>

              {/* Read-only Biodata Auto-fill */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-slate-500" />
                    <span>Biodata Peserta (Read-Only)</span>
                  </span>
                  {selectedStudent && (
                    <span className="text-xs font-mono font-medium text-emerald-700">
                      Terverifikasi
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="block text-xs text-slate-500">Nama Lengkap</span>
                    <span className="font-semibold text-slate-900">
                      {selectedStudent ? selectedStudent.nama : '—'}
                    </span>
                  </div>
                  <div>
                    <span className="block text-xs text-slate-500">No. Peserta / Absen</span>
                    <span className="font-mono font-medium text-slate-900 tabular-nums">
                      {selectedStudent
                        ? `${selectedStudent.nisNoPeserta} (No. ${selectedStudent.absen})`
                        : '—'}
                    </span>
                  </div>
                  <div>
                    <span className="block text-xs text-slate-500">Sekolah</span>
                    <span className="font-medium text-slate-800">
                      {selectedStudent ? selectedStudent.sekolah : '—'}
                    </span>
                  </div>
                  <div>
                    <span className="block text-xs text-slate-500">Kelas / Rombel</span>
                    <span className="font-medium text-slate-800">
                      {selectedStudent ? selectedStudent.kelas : '—'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Input Token Ujian */}
              <div>
                <label
                  htmlFor="input-token"
                  className="block text-xs font-semibold text-slate-700 mb-1.5"
                >
                  4. Token Ujian
                </label>
                <input
                  id="input-token"
                  type="text"
                  value={tokenInput}
                  onChange={(e) => {
                    setTokenInput(e.target.value.toUpperCase());
                    setTokenError('');
                  }}
                  placeholder="Masukkan token dari pengawas (contoh: TJKN2026)"
                  autoComplete="off"
                  className="w-full h-11 px-3.5 text-sm font-mono uppercase tracking-wider bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:normal-case placeholder:tracking-normal placeholder:font-sans placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-600 focus:border-sky-600"
                  required
                />
                <p className="mt-1.5 text-xs text-slate-500">
                  Gunakan token ujian resmi dari pengawas ruang (untuk uji coba sesi ini:{' '}
                  <span className="font-mono font-semibold text-slate-700">TJKN2026</span>).
                </p>
                {tokenError && (
                  <p className="mt-1.5 text-xs font-medium text-red-600 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{tokenError}</span>
                  </p>
                )}
              </div>

              {/* Checkbox Konfirmasi Identitas */}
              <label className="flex items-start gap-3 p-3.5 rounded-lg border border-slate-200 bg-slate-50/70 cursor-pointer hover:bg-slate-100/70 transition-colors">
                <input
                  type="checkbox"
                  checked={confirmedIdentity}
                  onChange={(e) => setConfirmedIdentity(e.target.checked)}
                  disabled={!selectedStudent}
                  className="mt-0.5 w-4 h-4 rounded border-slate-300 text-sky-700 focus:ring-sky-600 disabled:opacity-50"
                />
                <span className="text-xs sm:text-sm text-slate-700 leading-snug">
                  Saya menyatakan bahwa biodata peserta di atas adalah benar diri saya sendiri dan
                  saya siap mengerjakan ujian secara jujur tanpa membuka tab atau sumber lain.
                </span>
              </label>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={!canSubmit}
                className="w-full h-12 px-6 inline-flex items-center justify-center gap-2 text-sm font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 focus-visible:ring-offset-2 disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                <span>{isValidatingRemote ? 'Memverifikasi Token...' : 'Mulai Ujian'}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </form>
          </section>
        </div>
      </main>
    </div>
  );
};
