import { Person, Program, ProgramUnit } from '../types';

/**
 * Generates CSV string for people / students database
 */
export function exportPeopleToCSV(people: Person[]): string {
  const headers = [
    'Email Address',
    'Nama Penuh (seperti IC)',
    'Panggilan',
    'Jawatan',
    'No. Kad Pengenalan',
    '4 Digit Terakhir IC',
    'No. Telefon (WhatsApp)',
    'Alamat Emel @bpenawar.kpm.edu.my',
    'Jantina',
    'Program Pengajian',
    'Semester Semasa',
    'No. ID',
    'Peranan',
    'Unit / Jabatan',
  ];

  const escapeCSV = (str?: string) => {
    if (!str) return '';
    const clean = String(str).replace(/"/g, '""');
    return clean.includes(',') || clean.includes('\n') || clean.includes('"')
      ? `"${clean}"`
      : clean;
  };

  const rows = (people || []).map((p) => [
    escapeCSV(p.gmail || p.email),
    escapeCSV(p.fullName),
    escapeCSV(p.nickname || p.fullName.split(' ')[0]),
    escapeCSV(p.position || p.department || 'Ketua Unit'),
    escapeCSV(p.icNumber || `******-**-${p.icLast4}`),
    escapeCSV(p.icLast4),
    escapeCSV(p.phone),
    escapeCSV(p.email),
    escapeCSV(p.gender || '-'),
    escapeCSV(p.programStudy || p.department || '-'),
    escapeCSV(p.semester || '-'),
    escapeCSV(p.studentId),
    escapeCSV(p.role),
    escapeCSV(p.department || '-'),
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  return csvContent;
}

/**
 * Parses raw CSV text into Person array
 */
export function importPeopleFromCSV(csvText: string): {
  success: boolean;
  people: Person[];
  importedCount: number;
  errors: string[];
} {
  const errors: string[] = [];
  const parsedPeople: Person[] = [];

  if (!csvText || !csvText.trim()) {
    return { success: false, people: [], importedCount: 0, errors: ['Fail CSV kosong.'] };
  }

  // Handle standard line breaks
  const lines = csvText
    .split(/\r\n|\n|\r/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length < 2) {
    return { success: false, people: [], importedCount: 0, errors: ['Fail CSV memerlukan sekurang-kurangnya 1 baris tajuk dan 1 baris data.'] };
  }

  // Helper to parse CSV line respecting quotes
  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let cur = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          cur += '"';
          i++; // skip escaped quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(cur.trim());
        cur = '';
      } else {
        cur += char;
      }
    }
    result.push(cur.trim());
    return result;
  };

  const headerLine = parseCSVLine(lines[0]);
  const normalize = (h: string) => h.toLowerCase().replace(/[^a-z0-9]/g, '');

  const headers = headerLine.map(normalize);

  // Map header index
  const findCol = (...aliases: string[]): number => {
    for (const alias of aliases) {
      const cleanAlias = normalize(alias);
      const idx = headers.findIndex((h) => h.includes(cleanAlias) || cleanAlias.includes(h));
      if (idx !== -1) return idx;
    }
    return -1;
  };

  const gmailIdx = findCol('emailaddress', 'gmail', 'alamatgmailemel', 'email', 'emel');
  const nameIdx = findCol('namapenuh', 'nama', 'fullname', 'name');
  const nickIdx = findCol('panggilan', 'nickname', 'namapanggilan');
  const posIdx = findCol('jawatan', 'position', 'unitjawatan');
  const icIdx = findCol('nokadpengenalan', 'ic', 'nric', 'nokp', 'kadpengenalan');
  const icLast4Idx = findCol('4digitterakhiric', '4digit', 'last4ic', 'iclast4');
  const phoneIdx = findCol('notelefon', 'phone', 'whatsapp', 'notel', 'telefon');
  const collegeEmailIdx = findCol('bpenawarkpmedumy', 'emelrasmi', 'kolejemail', 'collegeemail');
  const genderIdx = findCol('jantina', 'gender', 'sex');
  const progIdx = findCol('programpengajian', 'program', 'kursus', 'dlm', 'dia');
  const semIdx = findCol('semestersemasa', 'semester', 'sem');
  const idIdx = findCol('noid', 'studentid', 'matric', 'matrik', 'id');

  for (let i = 1; i < lines.length; i++) {
    const rawLine = lines[i];
    const cols = parseCSVLine(rawLine);
    if (cols.length === 0 || cols.every((c) => !c)) continue;

    const fullName = nameIdx >= 0 ? cols[nameIdx] : cols[1] || '';
    if (!fullName) {
      errors.push(`Baris ${i + 1}: Nama Penuh tidak dijumpai, baris diabaikan.`);
      continue;
    }

    const gmail = gmailIdx >= 0 ? cols[gmailIdx] : cols[0] || '';
    const nickname = nickIdx >= 0 ? cols[nickIdx] : cols[2] || fullName.split(' ')[0];
    const position = posIdx >= 0 ? cols[posIdx] : cols[3] || 'Ketua Unit';
    const rawIC = icIdx >= 0 ? cols[icIdx] : '';
    const rawICLast4 = icLast4Idx >= 0 ? cols[icLast4Idx] : '';

    // Extract 4 digit IC
    let icLast4 = '1234';
    if (rawICLast4 && rawICLast4.trim().length >= 4) {
      icLast4 = rawICLast4.replace(/[^0-9]/g, '').slice(-4);
    } else if (rawIC) {
      const digits = rawIC.replace(/[^0-9]/g, '');
      if (digits.length >= 4) {
        icLast4 = digits.slice(-4);
      }
    }

    const phone = phoneIdx >= 0 ? cols[phoneIdx] : '012-3456789';
    const collegeEmail = collegeEmailIdx >= 0 ? cols[collegeEmailIdx] : '';
    const email = collegeEmail || gmail || `${fullName.toLowerCase().replace(/[^a-z0-9]/g, '')}@bpenawar.kpm.edu.my`;
    const gender = genderIdx >= 0 ? cols[genderIdx] : undefined;
    const programStudy = progIdx >= 0 ? cols[progIdx] : undefined;
    const semester = semIdx >= 0 ? cols[semIdx] : undefined;
    const studentId = idIdx >= 0 ? cols[idIdx] : `PDL-${Math.floor(1000 + Math.random() * 9000)}`;

    const person: Person = {
      id: `usr-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      fullName,
      nickname,
      position,
      studentId: studentId || `ID-${Math.floor(1000 + Math.random() * 9000)}`,
      icNumber: rawIC || undefined,
      icLast4: icLast4 || '1234',
      phone: phone || '-',
      gmail: gmail || undefined,
      email: email,
      gender,
      programStudy,
      semester,
      role: 'KETUA_UNIT',
      department: position || programStudy || 'Ketua Unit',
    };

    parsedPeople.push(person);
  }

  return {
    success: parsedPeople.length > 0,
    people: parsedPeople,
    importedCount: parsedPeople.length,
    errors,
  };
}

/**
 * Downloads a CSV string as a file in browser
 */
export function downloadCSV(content: string, filename: string) {
  // Prepend UTF-8 BOM so Excel and international tools open Malay characters cleanly
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Exports unit readiness report to CSV
 */
export function exportUnitsReadinessToCSV(program: Program): string {
  const headers = [
    'Nama Unit',
    'Ketua Unit',
    'No. ID Pelajar',
    'Gmail Ketua',
    'Telefon',
    'Keutamaan',
    'Kemajuan (%)',
    'Status Kesediaan',
    'Bilangan Checklist',
    'Checklist Selesai',
    'Status Eskalasi / Bantuan',
    'Sebab Eskalasi',
  ];

  const escapeCSV = (str?: string | number) => {
    if (str === undefined || str === null) return '';
    const clean = String(str).replace(/"/g, '""');
    return clean.includes(',') || clean.includes('\n') || clean.includes('"')
      ? `"${clean}"`
      : clean;
  };

  const rows = (program.units || []).map((u) => {
    const reqs = Array.isArray(u.requirements) ? u.requirements : [];
    const completed = reqs.filter((r) => r.status === 'COMPLETED').length;

    return [
      escapeCSV(u.name),
      escapeCSV(u.leader?.fullName || 'Belum Dilantik'),
      escapeCSV(u.leader?.studentId || '-'),
      escapeCSV(u.leader?.gmail || u.leader?.email || '-'),
      escapeCSV(u.leader?.phone || '-'),
      escapeCSV(u.priority),
      escapeCSV(u.progress),
      escapeCSV(u.status),
      escapeCSV(reqs.length),
      escapeCSV(completed),
      escapeCSV(u.assistanceStatus || 'NONE'),
      escapeCSV(u.assistanceReason || '-'),
    ];
  });

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
}

/**
 * Returns a ready-to-use sample CSV template string
 */
export function getSampleStudentCSVTemplate(): string {
  return `Email Address,Nama Penuh (seperti IC) ,Panggilan,Jawatan ,No. Kad Pengenalan  ,  No. Telefon (WhatsApp)  ,  Alamat Emel @bpenawar.kpm.edu.my,Jantina,  Program Pengajian  ,  Semester Semasa  ,  No. ID  
nurzara.sofea07@gmail.com,NURZARA SOFEA BT SAIFUL NIZAM ,Zara,Presiden,071012-14-0480,016-4976385,nurzara.sofea@bpenawar.kpm.edu.my,Perempuan,DLM,Semester 3,PDL-2502-078 
teleshop110919a@gmail.com,IDI ALWANULHAQ BIN ISMAIL,Idi,Timbalan Presiden,060909-01-1313,011-73805753,idi.ismail@bpenawar.kpm.edu.my,Lelaki,DLM,Semester 3,PDL-2502-146
zulaikhasaggaf@gmail.com,SHARIFAH ZULAIKHA BINTI SYED FARIS ,Sharifah,Setiausaha,070425-10-1768,019-2348499,sharifah.zulaikha@bpenawar.kpm.edu.my,Perempuan,DLM,Semester 3,PDL-2502-015
ekashie01@gmail.com,NUR ZULAIA BINTI MOHD ZULFADLI ,Zulaikha,Bendahari,070316-01-0656,019-3370848,zulaikha.mohd@bpenawar.kpm.edu.my,Perempuan,DLM,Semester 3,PDL-2502-005
dzulafifhakim203@gmail.com,DZUL AFIF HAKIM BIN ANNUAR,Dzul,Exco Bilik Muzik,070303-02-0919,011-11379767,hakim.annuar@bpenawar.kpm.edu.my,Lelaki,DLM,Semester 3,PDL-2502-019
adwyh2007@gmail.com,RABI ATUL ADAWIYAH BINTI ABU HASHIM,Rabi,Exco Multimedia dan Teknikal,070302-01-1172,013-8757626,rabi.adawiyah@bpenawar.kpm.edu.my,Perempuan,DLM,Semester 3,PDL-2502-122
nurairra094@gmail.com,NUR AIRRA NAFEESA BINTI ROSLIN ,Airra,Exco Muzik dan Tarian,071217-10-0036,011-18893308,airra.roslin@bpenawar.kpm.edu.my,Perempuan,DLM,Semester 3,PDL-2502-050
nrbellae@gmail.com,NUR ALYA NABILAH BINTI NOR ALI,Aya,Exco Kebudayaan,060222-01-0066,011-20833219,alya.ali@bpenawar.kpm.edu.my,Perempuan,DIA,Semester 5,PDA-2403-007
nurulfaqihah120@gmail.com,NURUL FAQIHAH BINTI MOHD SAHARDI,Faqihah,Exco Keusahawanan,071024-11-0078,016-6742371,faqihah.mohd@bpenawar.kpm.edu.my,Perempuan,DLM,Semester 3,PDL-2502-052`;
}
