import React, { useState } from 'react';
import { CheckCircle2, KeyRound, LockOpen, X, AlertCircle } from 'lucide-react';
import { DecryptedHasilBundle, SubmissionEnvelope } from '../types/cbt';
import { decryptText, TEACHER_ACCESS_PASSCODE } from '../utils/crypto';

interface TeacherDecryptModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialEnvelope?: SubmissionEnvelope | null;
}

interface ParsedDecryptedView {
  peserta?: {
    nama_peserta: string;
    nis_no_peserta: string;
    kelas_rombel: string;
    sekolah: string;
    token_ujian: string;
    durasi_terpakai_detik: number;
    jumlah_pelanggaran_tab: number;
    timestamp: string;
  };
  hasil?: DecryptedHasilBundle;
  rawText?: string;
}

export const TeacherDecryptModal: React.FC<TeacherDecryptModalProps> = ({
  isOpen,
  onClose,
  initialEnvelope,
}) => {
  const [passcode, setPasscode] = useState('');
  const [unlocked, setUnlocked] = useState(false);
  const [authError, setAuthError] = useState('');

  const [cipherInput, setCipherInput] = useState('');
  const [decryptError, setDecryptError] = useState('');
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [decryptedResult, setDecryptedResult] = useState<ParsedDecryptedView | null>(null);

  if (!isOpen) return null;

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode.trim() === TEACHER_ACCESS_PASSCODE) {
      setUnlocked(true);
      setAuthError('');
      if (initialEnvelope?.encrypted_payload && !cipherInput) {
        setCipherInput(initialEnvelope.encrypted_payload);
      }
    } else {
      setAuthError('Kode akses guru salah.');
    }
  };

  const handleDecrypt = async () => {
    setDecryptError('');
    setDecryptedResult(null);
    const trimmed = cipherInput.trim();
    if (!trimmed) {
      setDecryptError('Tempelkan JSON cadangan atau string AES256GCM:v1:... terlebih dahulu.');
      return;
    }

    setIsDecrypting(true);
    try {
      let targetCipher = trimmed;
      // Support pasting full JSON backup envelope
      if (trimmed.startsWith('{')) {
        const parsedJson = JSON.parse(trimmed) as Partial<SubmissionEnvelope>;
        if (parsedJson.encrypted_payload) {
          targetCipher = parsedJson.encrypted_payload;
        } else if (parsedJson.rekap_jawaban) {
          targetCipher = parsedJson.rekap_jawaban;
        }
      }

      const plaintext = await decryptText(targetCipher);
      try {
        const parsed = JSON.parse(plaintext) as ParsedDecryptedView | DecryptedHasilBundle['rekap_jawaban'];
        if (Array.isArray(parsed)) {
          setDecryptedResult({
            hasil: {
              skor_pg: 0,
              skor_pgk: 0,
              total_skor_otomatis: 0,
              detail_skor: {
                pg_benar: 0,
                pg_total: 0,
                pgk_poin: 0,
                pgk_maksimal: 0,
                uraian_terjawab: 0,
                uraian_total: 0,
              },
              rekap_jawaban: parsed,
            },
          });
        } else {
          setDecryptedResult(parsed);
        }
      } catch {
        setDecryptedResult({ rawText: plaintext });
      }
    } catch (err) {
      setDecryptError(err instanceof Error ? err.message : 'Gagal mendekripsi data.');
    } finally {
      setIsDecrypting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="teacher-modal-title"
    >
      <div className="bg-white border border-slate-200 rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-xl">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <KeyRound className="w-5 h-5 text-slate-700" />
            <h2 id="teacher-modal-title" className="text-base font-bold text-slate-900">
              Portal Guru · Dekripsi Hasil Ujian
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 cursor-pointer"
            aria-label="Tutup modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6">
          {!unlocked ? (
            <form onSubmit={handleUnlock} className="max-w-md mx-auto py-4 space-y-4">
              <p className="text-sm text-slate-600 leading-relaxed">
                Fitur ini khusus untuk guru pengampu guna mendekripsi hasil ujian peserta dari
                Google Sheets atau berkas cadangan JSON/CSV.
              </p>
              <div>
                <label
                  htmlFor="teacher-passcode"
                  className="block text-xs font-semibold text-slate-700 mb-1.5"
                >
                  Kode Akses Pengawas / Guru
                </label>
                <input
                  id="teacher-passcode"
                  type="password"
                  value={passcode}
                  onChange={(e) => {
                    setPasscode(e.target.value);
                    setAuthError('');
                  }}
                  placeholder="Masukkan kode akses guru"
                  className="w-full h-11 px-3.5 text-sm font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-600"
                  required
                />
                <p className="mt-1.5 text-xs text-slate-500">
                  Kode akses standar pengawas: <span className="font-mono">GURU-TJKN-2026</span>
                </p>
                {authError && (
                  <p className="mt-1.5 text-xs font-medium text-red-600 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{authError}</span>
                  </p>
                )}
              </div>
              <button
                type="submit"
                className="w-full h-11 px-4 text-sm font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 cursor-pointer inline-flex items-center justify-center gap-2"
              >
                <LockOpen className="w-4 h-4" />
                <span>Buka Dekriptor Guru</span>
              </button>
            </form>
          ) : (
            <div className="space-y-5">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="cipher-input"
                    className="text-xs font-semibold text-slate-700"
                  >
                    Tempel JSON Cadangan atau String Ciphertext (AES256GCM:v1:...)
                  </label>
                  {initialEnvelope?.encrypted_payload && (
                    <button
                      type="button"
                      onClick={() => setCipherInput(initialEnvelope.encrypted_payload)}
                      className="text-xs font-medium text-sky-700 hover:underline cursor-pointer"
                    >
                      Muat Payload Sesi Ini
                    </button>
                  )}
                </div>
                <textarea
                  id="cipher-input"
                  rows={4}
                  value={cipherInput}
                  onChange={(e) => setCipherInput(e.target.value)}
                  placeholder='Tempel isi file .json cadangan atau nilai kolom "encrypted_payload" / "rekap_jawaban" dari Google Sheets...'
                  className="w-full p-3 text-xs font-mono bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-600"
                />
                {decryptError && (
                  <p className="mt-1.5 text-xs font-medium text-red-600 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{decryptError}</span>
                  </p>
                )}
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleDecrypt}
                  disabled={isDecrypting}
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-sky-700 rounded-lg hover:bg-sky-800 disabled:opacity-50 cursor-pointer whitespace-nowrap"
                >
                  {isDecrypting ? 'Mendekripsi...' : 'Dekripsi Hasil Ujian'}
                </button>
              </div>

              {decryptedResult && (
                <div className="border-t border-slate-200 pt-5 space-y-5">
                  {decryptedResult.rawText && (
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg font-mono text-sm">
                      {decryptedResult.rawText}
                    </div>
                  )}

                  {decryptedResult.peserta && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50 border border-slate-200 rounded-lg p-4 text-xs">
                      <div>
                        <span className="text-slate-500 block">Nama Peserta</span>
                        <span className="font-semibold text-slate-900">
                          {decryptedResult.peserta.nama_peserta}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">No. Peserta / Kelas</span>
                        <span className="font-mono font-semibold text-slate-900">
                          {decryptedResult.peserta.nis_no_peserta} · {decryptedResult.peserta.kelas_rombel}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Durasi Terpakai</span>
                        <span className="font-mono font-semibold text-slate-900 tabular-nums">
                          {Math.floor(decryptedResult.peserta.durasi_terpakai_detik / 60)}m{' '}
                          {decryptedResult.peserta.durasi_terpakai_detik % 60}d
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Pelanggaran Tab</span>
                        <span className="font-mono font-semibold text-slate-900 tabular-nums">
                          {decryptedResult.peserta.jumlah_pelanggaran_tab} kali
                        </span>
                      </div>
                    </div>
                  )}

                  {decryptedResult.hasil && (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="border border-slate-200 rounded-lg p-4">
                          <span className="text-xs text-slate-500 block">Skor Pilihan Ganda (Maks 50)</span>
                          <span className="text-2xl font-bold font-mono tabular-nums text-slate-900">
                            {decryptedResult.hasil.skor_pg}
                          </span>
                          <span className="block text-xs text-slate-500 mt-1">
                            Benar {decryptedResult.hasil.detail_skor.pg_benar} /{' '}
                            {decryptedResult.hasil.detail_skor.pg_total} soal
                          </span>
                        </div>
                        <div className="border border-slate-200 rounded-lg p-4">
                          <span className="text-xs text-slate-500 block">Skor PG Kompleks (Maks 50)</span>
                          <span className="text-2xl font-bold font-mono tabular-nums text-slate-900">
                            {decryptedResult.hasil.skor_pgk}
                          </span>
                          <span className="block text-xs text-slate-500 mt-1">
                            Poin {decryptedResult.hasil.detail_skor.pgk_poin} /{' '}
                            {decryptedResult.hasil.detail_skor.pgk_maksimal}
                          </span>
                        </div>
                        <div className="border border-emerald-200 bg-emerald-50/50 rounded-lg p-4">
                          <span className="text-xs text-emerald-800 block font-medium">
                            Total Skor Otomatis (Objektif)
                          </span>
                          <span className="text-2xl font-bold font-mono tabular-nums text-emerald-700">
                            {decryptedResult.hasil.total_skor_otomatis}
                          </span>
                          <span className="block text-xs text-emerald-700 mt-1 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Belum termasuk nilai uraian manual</span>
                          </span>
                        </div>
                      </div>

                      <div className="overflow-x-auto border border-slate-200 rounded-lg">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                            <tr>
                              <th className="py-2.5 px-3 font-semibold">No / ID</th>
                              <th className="py-2.5 px-3 font-semibold">Tipe</th>
                              <th className="py-2.5 px-3 font-semibold">Jawaban Siswa</th>
                              <th className="py-2.5 px-3 font-semibold">Kunci / Rubrik</th>
                              <th className="py-2.5 px-3 font-semibold">Status</th>
                              <th className="py-2.5 px-3 font-semibold text-right">Poin</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {decryptedResult.hasil.rekap_jawaban.map((item) => (
                              <tr key={item.questionId} className="align-top">
                                <td className="py-2.5 px-3 font-mono whitespace-nowrap">
                                  #{item.nomor_tampil} · {item.questionId}
                                </td>
                                <td className="py-2.5 px-3 font-medium whitespace-nowrap">
                                  {item.tipe_soal}
                                </td>
                                <td className="py-2.5 px-3 max-w-xs text-slate-700">
                                  {Array.isArray(item.jawaban_siswa)
                                    ? item.jawaban_siswa.join(', ') || '-'
                                    : item.jawaban_siswa}
                                </td>
                                <td className="py-2.5 px-3 max-w-xs text-slate-700">
                                  {Array.isArray(item.kunci_jawaban)
                                    ? item.kunci_jawaban.join(', ')
                                    : item.kunci_jawaban}
                                </td>
                                <td className="py-2.5 px-3 whitespace-nowrap font-semibold">
                                  <span
                                    className={
                                      item.status_benar_salah === 'BENAR'
                                        ? 'text-emerald-700'
                                        : item.status_benar_salah === 'SALAH'
                                        ? 'text-red-600'
                                        : 'text-amber-700'
                                    }
                                  >
                                    {item.status_benar_salah}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 text-right font-mono tabular-nums whitespace-nowrap">
                                  {item.skor_item}/{item.skor_maksimal}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
