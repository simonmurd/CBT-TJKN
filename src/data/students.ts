import { StudentRecord } from '../types/cbt';

interface RawStudentRow {
  sekolah: string;
  kelas: string;
  namaLabel: string;
}

const RAW_STUDENT_ROWS: RawStudentRow[] = [
  // SMK NEGERI 1 SINGKAWANG - X TJK (33 siswa)
  { sekolah: 'SMK NEGERI 1 SINGKAWANG', kelas: 'X TJK', namaLabel: '01 ALVINO' },
  { sekolah: 'SMK NEGERI 1 SINGKAWANG', kelas: 'X TJK', namaLabel: '02 DEBORA RATU GIASTA GULTOM' },
  { sekolah: 'SMK NEGERI 1 SINGKAWANG', kelas: 'X TJK', namaLabel: '03 DENIS' },
  { sekolah: 'SMK NEGERI 1 SINGKAWANG', kelas: 'X TJK', namaLabel: '04 DEO REVALDY AHMAD' },
  { sekolah: 'SMK NEGERI 1 SINGKAWANG', kelas: 'X TJK', namaLabel: '05 EVAN KRESNA LEE' },
  { sekolah: 'SMK NEGERI 1 SINGKAWANG', kelas: 'X TJK', namaLabel: '06 FEBRIYANTO' },
  { sekolah: 'SMK NEGERI 1 SINGKAWANG', kelas: 'X TJK', namaLabel: '07 HERKULANUS PERDY' },
  { sekolah: 'SMK NEGERI 1 SINGKAWANG', kelas: 'X TJK', namaLabel: '08 HIQMAL LIONEL ALVIANO' },
  { sekolah: 'SMK NEGERI 1 SINGKAWANG', kelas: 'X TJK', namaLabel: '09 INDRA KESUMAH' },
  { sekolah: 'SMK NEGERI 1 SINGKAWANG', kelas: 'X TJK', namaLabel: '10 JERRY KURNIAWAN' },
  { sekolah: 'SMK NEGERI 1 SINGKAWANG', kelas: 'X TJK', namaLabel: '11 KABILA SYIFA' },
  { sekolah: 'SMK NEGERI 1 SINGKAWANG', kelas: 'X TJK', namaLabel: '12 KEYLA KIRANA PUTRI' },
  { sekolah: 'SMK NEGERI 1 SINGKAWANG', kelas: 'X TJK', namaLabel: '13 KRISTIAN DAFI' },
  { sekolah: 'SMK NEGERI 1 SINGKAWANG', kelas: 'X TJK', namaLabel: '14 LIONEL VAN EXAUDI HUTABARAT' },
  { sekolah: 'SMK NEGERI 1 SINGKAWANG', kelas: 'X TJK', namaLabel: '15 MIRATUL TASYA RAMADHANI' },
  { sekolah: 'SMK NEGERI 1 SINGKAWANG', kelas: 'X TJK', namaLabel: '16 MUHAMMAD RAYHAN AL GHIFARY' },
  { sekolah: 'SMK NEGERI 1 SINGKAWANG', kelas: 'X TJK', namaLabel: '17 MUHAMMAD ZAKY RAFANANDO' },
  { sekolah: 'SMK NEGERI 1 SINGKAWANG', kelas: 'X TJK', namaLabel: '18 NATARI KEYZA JUNIAR' },
  { sekolah: 'SMK NEGERI 1 SINGKAWANG', kelas: 'X TJK', namaLabel: '19 NAZUA KASTINA' },
  { sekolah: 'SMK NEGERI 1 SINGKAWANG', kelas: 'X TJK', namaLabel: '20 NUR AZANI' },
  { sekolah: 'SMK NEGERI 1 SINGKAWANG', kelas: 'X TJK', namaLabel: '21 NURAINI' },
  { sekolah: 'SMK NEGERI 1 SINGKAWANG', kelas: 'X TJK', namaLabel: '22 PIRANDA RAMADANI' },
  { sekolah: 'SMK NEGERI 1 SINGKAWANG', kelas: 'X TJK', namaLabel: '23 REBHELIA' },
  { sekolah: 'SMK NEGERI 1 SINGKAWANG', kelas: 'X TJK', namaLabel: '24 REVAN' },
  { sekolah: 'SMK NEGERI 1 SINGKAWANG', kelas: 'X TJK', namaLabel: '25 RIA ADHA' },
  { sekolah: 'SMK NEGERI 1 SINGKAWANG', kelas: 'X TJK', namaLabel: '26 RINDU PRANITA NUARI' },
  { sekolah: 'SMK NEGERI 1 SINGKAWANG', kelas: 'X TJK', namaLabel: '27 RIVALDO RANGGA SAPUTRA' },
  { sekolah: 'SMK NEGERI 1 SINGKAWANG', kelas: 'X TJK', namaLabel: '28 SELVIA' },
  { sekolah: 'SMK NEGERI 1 SINGKAWANG', kelas: 'X TJK', namaLabel: '29 SITI MARIYAM' },
  { sekolah: 'SMK NEGERI 1 SINGKAWANG', kelas: 'X TJK', namaLabel: '30 SYIFA FAHIRA' },
  { sekolah: 'SMK NEGERI 1 SINGKAWANG', kelas: 'X TJK', namaLabel: '31 WULANDARI' },
  { sekolah: 'SMK NEGERI 1 SINGKAWANG', kelas: 'X TJK', namaLabel: '32 YULIANTI' },
  { sekolah: 'SMK NEGERI 1 SINGKAWANG', kelas: 'X TJK', namaLabel: '33 YUNKHI' },

  // SMK NEGERI 1 SINGKAWANG - XI TJK (35 siswa)
  { sekolah: 'SMK NEGERI 1 SINGKAWANG', kelas: 'XI TJK', namaLabel: '01 RIZKY JUNIANSYAH' },
  { sekolah: 'SMK NEGERI 1 SINGKAWANG', kelas: 'XI TJK', namaLabel: '02 SEMELIA' },
  { sekolah: 'SMK NEGERI 1 SINGKAWANG', kelas: 'XI TJK', namaLabel: '03 AHMAD NOVA RIANTO' },
  { sekolah: 'SMK NEGERI 1 SINGKAWANG', kelas: 'XI TJK', namaLabel: '04 AIDANAZMAN DATINOV' },
  { sekolah: 'SMK NEGERI 1 SINGKAWANG', kelas: 'XI TJK', namaLabel: '05 AJI SOPYAN DWI' },
  { sekolah: 'SMK NEGERI 1 SINGKAWANG', kelas: 'XI TJK', namaLabel: '06 ANGELA DARA LISTA' },
  { sekolah: 'SMK NEGERI 1 SINGKAWANG', kelas: 'XI TJK', namaLabel: '07 ANNISA SALSA SHAFIRA' },
  { sekolah: 'SMK NEGERI 1 SINGKAWANG', kelas: 'XI TJK', namaLabel: '09 AYRA' },
  { sekolah: 'SMK NEGERI 1 SINGKAWANG', kelas: 'XI TJK', namaLabel: '10 AZURA' },
  { sekolah: 'SMK NEGERI 1 SINGKAWANG', kelas: 'XI TJK', namaLabel: '11 BAYU CITRA PRATAMA' },
  { sekolah: 'SMK NEGERI 1 SINGKAWANG', kelas: 'XI TJK', namaLabel: '12 BUNGA LESTARI' },
  { sekolah: 'SMK NEGERI 1 SINGKAWANG', kelas: 'XI TJK', namaLabel: '13 CHASTLE ALPHA RICHIE' },
  { sekolah: 'SMK NEGERI 1 SINGKAWANG', kelas: 'XI TJK', namaLabel: '14 DEVINA YUNA' },
  { sekolah: 'SMK NEGERI 1 SINGKAWANG', kelas: 'XI TJK', namaLabel: '15 DINDA PUTRI RAHAYU' },
  { sekolah: 'SMK NEGERI 1 SINGKAWANG', kelas: 'XI TJK', namaLabel: '16 EDWIN PRAYOGA' },
  { sekolah: 'SMK NEGERI 1 SINGKAWANG', kelas: 'XI TJK', namaLabel: '17 FAJAR JULIANSYAH' },
  { sekolah: 'SMK NEGERI 1 SINGKAWANG', kelas: 'XI TJK', namaLabel: '18 FRANSISCO DWI ADITYA' },
  { sekolah: 'SMK NEGERI 1 SINGKAWANG', kelas: 'XI TJK', namaLabel: '19 GABRIEL ARESTA' },
  { sekolah: 'SMK NEGERI 1 SINGKAWANG', kelas: 'XI TJK', namaLabel: '20 GLORIA ELSIA' },
  { sekolah: 'SMK NEGERI 1 SINGKAWANG', kelas: 'XI TJK', namaLabel: '21 IHSAN AZHALLAH FAWWAZ' },
  { sekolah: 'SMK NEGERI 1 SINGKAWANG', kelas: 'XI TJK', namaLabel: '22 INDRAYANI' },
  { sekolah: 'SMK NEGERI 1 SINGKAWANG', kelas: 'XI TJK', namaLabel: '23 IRFAN RACHMANDANI FERDIAN' },
  { sekolah: 'SMK NEGERI 1 SINGKAWANG', kelas: 'XI TJK', namaLabel: '24 KEVIN APRILIO' },
  { sekolah: 'SMK NEGERI 1 SINGKAWANG', kelas: 'XI TJK', namaLabel: '25 KHOIRUNNISA' },
  { sekolah: 'SMK NEGERI 1 SINGKAWANG', kelas: 'XI TJK', namaLabel: '26 LAFYCA CALYZZA' },
  { sekolah: 'SMK NEGERI 1 SINGKAWANG', kelas: 'XI TJK', namaLabel: '27 MAHLIK ADI SAPUTRA' },
  { sekolah: 'SMK NEGERI 1 SINGKAWANG', kelas: 'XI TJK', namaLabel: '28 MUHAMAD ADHA NUR IKHSAN' },
  { sekolah: 'SMK NEGERI 1 SINGKAWANG', kelas: 'XI TJK', namaLabel: '29 MUHAMMAD NABIL PASHA' },
  { sekolah: 'SMK NEGERI 1 SINGKAWANG', kelas: 'XI TJK', namaLabel: '30 NURLILA FADILLA' },
  { sekolah: 'SMK NEGERI 1 SINGKAWANG', kelas: 'XI TJK', namaLabel: '31 RENI' },
  { sekolah: 'SMK NEGERI 1 SINGKAWANG', kelas: 'XI TJK', namaLabel: '32 RIA KURNIATI' },
  { sekolah: 'SMK NEGERI 1 SINGKAWANG', kelas: 'XI TJK', namaLabel: '33 RIDWAN RAKA HARTONO' },
  { sekolah: 'SMK NEGERI 1 SINGKAWANG', kelas: 'XI TJK', namaLabel: '34 SAEPUL MAJID' },
  { sekolah: 'SMK NEGERI 1 SINGKAWANG', kelas: 'XI TJK', namaLabel: '35 VIONA' },
  { sekolah: 'SMK NEGERI 1 SINGKAWANG', kelas: 'XI TJK', namaLabel: '36 WAHYU' },

  // SMK MUDITA SINGKAWANG - XI TJKT (38 siswa)
  { sekolah: 'SMK MUDITA SINGKAWANG', kelas: 'XI TJKT', namaLabel: '01 ALICIA JENIFER' },
  { sekolah: 'SMK MUDITA SINGKAWANG', kelas: 'XI TJKT', namaLabel: '02 ANGELA' },
  { sekolah: 'SMK MUDITA SINGKAWANG', kelas: 'XI TJKT', namaLabel: '03 CALVINIUS BUNARTO' },
  { sekolah: 'SMK MUDITA SINGKAWANG', kelas: 'XI TJKT', namaLabel: '04 CHELSY VEROSSA' },
  { sekolah: 'SMK MUDITA SINGKAWANG', kelas: 'XI TJKT', namaLabel: '05 DERMAN JOHAN' },
  { sekolah: 'SMK MUDITA SINGKAWANG', kelas: 'XI TJKT', namaLabel: '06 DESTIAN WIJAYA' },
  { sekolah: 'SMK MUDITA SINGKAWANG', kelas: 'XI TJKT', namaLabel: '07 DISON NIKANOR' },
  { sekolah: 'SMK MUDITA SINGKAWANG', kelas: 'XI TJKT', namaLabel: '08 ENNIO EDWARD' },
  { sekolah: 'SMK MUDITA SINGKAWANG', kelas: 'XI TJKT', namaLabel: '09 FANI VANESA' },
  { sekolah: 'SMK MUDITA SINGKAWANG', kelas: 'XI TJKT', namaLabel: '10 HANNY PHANGGESTY' },
  { sekolah: 'SMK MUDITA SINGKAWANG', kelas: 'XI TJKT', namaLabel: '11 HERWIT BRIAN' },
  { sekolah: 'SMK MUDITA SINGKAWANG', kelas: 'XI TJKT', namaLabel: '12 JAVI YANTO' },
  { sekolah: 'SMK MUDITA SINGKAWANG', kelas: 'XI TJKT', namaLabel: '13 JEFRY' },
  { sekolah: 'SMK MUDITA SINGKAWANG', kelas: 'XI TJKT', namaLabel: '14 JONATHAN VINCENTIUS' },
  { sekolah: 'SMK MUDITA SINGKAWANG', kelas: 'XI TJKT', namaLabel: '15 KELLY ANGELA' },
  { sekolah: 'SMK MUDITA SINGKAWANG', kelas: 'XI TJKT', namaLabel: '16 KEVIN KURNIAWAN' },
  { sekolah: 'SMK MUDITA SINGKAWANG', kelas: 'XI TJKT', namaLabel: '17 LEONARDO' },
  { sekolah: 'SMK MUDITA SINGKAWANG', kelas: 'XI TJKT', namaLabel: '18 LORENZO JONATHAN PANGESTU' },
  { sekolah: 'SMK MUDITA SINGKAWANG', kelas: 'XI TJKT', namaLabel: '19 MEDY SANJAYA' },
  { sekolah: 'SMK MUDITA SINGKAWANG', kelas: 'XI TJKT', namaLabel: '20 MEYCHEN CARNELLA' },
  { sekolah: 'SMK MUDITA SINGKAWANG', kelas: 'XI TJKT', namaLabel: '21 MICHELLE' },
  { sekolah: 'SMK MUDITA SINGKAWANG', kelas: 'XI TJKT', namaLabel: '22 NESHA FREDELINA XHIAUW' },
  { sekolah: 'SMK MUDITA SINGKAWANG', kelas: 'XI TJKT', namaLabel: '23 RAYMEND' },
  { sekolah: 'SMK MUDITA SINGKAWANG', kelas: 'XI TJKT', namaLabel: '24 RICARDO' },
  { sekolah: 'SMK MUDITA SINGKAWANG', kelas: 'XI TJKT', namaLabel: '25 SUYANBUN LIPFIANDY' },
  { sekolah: 'SMK MUDITA SINGKAWANG', kelas: 'XI TJKT', namaLabel: '26 TRI WIJAYA' },
  { sekolah: 'SMK MUDITA SINGKAWANG', kelas: 'XI TJKT', namaLabel: '27 VINCENT' },
  { sekolah: 'SMK MUDITA SINGKAWANG', kelas: 'XI TJKT', namaLabel: '28 VINCENT ALBERTO FEROZ' },
  { sekolah: 'SMK MUDITA SINGKAWANG', kelas: 'XI TJKT', namaLabel: '29 VINCENT BUN' },
  { sekolah: 'SMK MUDITA SINGKAWANG', kelas: 'XI TJKT', namaLabel: '30 VINCENT LAUNARDY' },
  { sekolah: 'SMK MUDITA SINGKAWANG', kelas: 'XI TJKT', namaLabel: '31 VINSEN' },
  { sekolah: 'SMK MUDITA SINGKAWANG', kelas: 'XI TJKT', namaLabel: '32 VITO ALBERT FEROZ' },
  { sekolah: 'SMK MUDITA SINGKAWANG', kelas: 'XI TJKT', namaLabel: '33 VITON' },
  { sekolah: 'SMK MUDITA SINGKAWANG', kelas: 'XI TJKT', namaLabel: '34 WENNI NINGSI WONGSO' },
  { sekolah: 'SMK MUDITA SINGKAWANG', kelas: 'XI TJKT', namaLabel: '35 WILLIAM' },
  { sekolah: 'SMK MUDITA SINGKAWANG', kelas: 'XI TJKT', namaLabel: '36 WILLIAM' },
  { sekolah: 'SMK MUDITA SINGKAWANG', kelas: 'XI TJKT', namaLabel: '37 WILLIAM' },
  { sekolah: 'SMK MUDITA SINGKAWANG', kelas: 'XI TJKT', namaLabel: '38 YUVENSIUS' },

  // SMK MUDITA SINGKAWANG - XII TJKT (33 siswa)
  { sekolah: 'SMK MUDITA SINGKAWANG', kelas: 'XII TJKT', namaLabel: '01 DALVIN ANDERSON' },
  { sekolah: 'SMK MUDITA SINGKAWANG', kelas: 'XII TJKT', namaLabel: '02 DANNIEL DAVE DAISUKE' },
  { sekolah: 'SMK MUDITA SINGKAWANG', kelas: 'XII TJKT', namaLabel: '03 DENNY' },
  { sekolah: 'SMK MUDITA SINGKAWANG', kelas: 'XII TJKT', namaLabel: '04 FERDI NOVENDI' },
  { sekolah: 'SMK MUDITA SINGKAWANG', kelas: 'XII TJKT', namaLabel: '05 FLOURA' },
  { sekolah: 'SMK MUDITA SINGKAWANG', kelas: 'XII TJKT', namaLabel: '06 HENGKY' },
  { sekolah: 'SMK MUDITA SINGKAWANG', kelas: 'XII TJKT', namaLabel: '07 JIU PHEN' },
  { sekolah: 'SMK MUDITA SINGKAWANG', kelas: 'XII TJKT', namaLabel: '08 JULIANA DELVI WANTRIANI' },
  { sekolah: 'SMK MUDITA SINGKAWANG', kelas: 'XII TJKT', namaLabel: '09 JULIYANTO' },
  { sekolah: 'SMK MUDITA SINGKAWANG', kelas: 'XII TJKT', namaLabel: '10 JUN KIUH' },
  { sekolah: 'SMK MUDITA SINGKAWANG', kelas: 'XII TJKT', namaLabel: '11 JUN PHEN' },
  { sekolah: 'SMK MUDITA SINGKAWANG', kelas: 'XII TJKT', namaLabel: '12 JUNIATY' },
  { sekolah: 'SMK MUDITA SINGKAWANG', kelas: 'XII TJKT', namaLabel: '14 KELVIN TERRENCE' },
  { sekolah: 'SMK MUDITA SINGKAWANG', kelas: 'XII TJKT', namaLabel: '15 LEONARDO' },
  { sekolah: 'SMK MUDITA SINGKAWANG', kelas: 'XII TJKT', namaLabel: '16 LEWIS MARCO' },
  { sekolah: 'SMK MUDITA SINGKAWANG', kelas: 'XII TJKT', namaLabel: '17 LI NA' },
  { sekolah: 'SMK MUDITA SINGKAWANG', kelas: 'XII TJKT', namaLabel: '18 MARCO GENIUS' },
  { sekolah: 'SMK MUDITA SINGKAWANG', kelas: 'XII TJKT', namaLabel: '19 NELSON ALVARO' },
  { sekolah: 'SMK MUDITA SINGKAWANG', kelas: 'XII TJKT', namaLabel: '21 NOFIKA' },
  { sekolah: 'SMK MUDITA SINGKAWANG', kelas: 'XII TJKT', namaLabel: '22 NYIAN BUN' },
  { sekolah: 'SMK MUDITA SINGKAWANG', kelas: 'XII TJKT', namaLabel: '23 NYUN CU' },
  { sekolah: 'SMK MUDITA SINGKAWANG', kelas: 'XII TJKT', namaLabel: '24 OKTAVIANI' },
  { sekolah: 'SMK MUDITA SINGKAWANG', kelas: 'XII TJKT', namaLabel: '25 RENDI' },
  { sekolah: 'SMK MUDITA SINGKAWANG', kelas: 'XII TJKT', namaLabel: '26 RICO WIJAYA' },
  { sekolah: 'SMK MUDITA SINGKAWANG', kelas: 'XII TJKT', namaLabel: '27 SI WEN' },
  { sekolah: 'SMK MUDITA SINGKAWANG', kelas: 'XII TJKT', namaLabel: '28 SIAU KHIM' },
  { sekolah: 'SMK MUDITA SINGKAWANG', kelas: 'XII TJKT', namaLabel: '29 SU CHUI' },
  { sekolah: 'SMK MUDITA SINGKAWANG', kelas: 'XII TJKT', namaLabel: '30 TRI DERMERSIA' },
  { sekolah: 'SMK MUDITA SINGKAWANG', kelas: 'XII TJKT', namaLabel: '31 VELIYAN VINSON' },
  { sekolah: 'SMK MUDITA SINGKAWANG', kelas: 'XII TJKT', namaLabel: '32 VICKA ANJELICA' },
  { sekolah: 'SMK MUDITA SINGKAWANG', kelas: 'XII TJKT', namaLabel: '33 WILLIAM' },
  { sekolah: 'SMK MUDITA SINGKAWANG', kelas: 'XII TJKT', namaLabel: '34 WILLSON HANATA' },
  { sekolah: 'SMK MUDITA SINGKAWANG', kelas: 'XII TJKT', namaLabel: '35 WILLY VEN' },
];

function buildStudentCode(sekolah: string, kelas: string, absen: string): string {
  const schoolCode = sekolah.includes('MUDITA') ? 'MDT' : 'SMKN1';
  const classCode = kelas.replace(/\s+/g, '');
  return `${schoolCode}-${classCode}-${absen}`;
}

export const STUDENTS_DB: StudentRecord[] = RAW_STUDENT_ROWS.map((row) => {
  const match = row.namaLabel.match(/^(\d{2})\s+(.+)$/);
  const absen = match ? match[1] : '00';
  const nama = match ? match[2].trim() : row.namaLabel.trim();
  const nisNoPeserta = buildStudentCode(row.sekolah, row.kelas, absen);

  return {
    id: nisNoPeserta,
    sekolah: row.sekolah,
    kelas: row.kelas,
    absen,
    nama,
    namaLabel: row.namaLabel,
    nisNoPeserta,
  };
});

export const SCHOOL_LIST: string[] = Array.from(
  new Set(STUDENTS_DB.map((s) => s.sekolah))
).sort((a, b) => a.localeCompare(b, 'id'));
