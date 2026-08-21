import React, { useState } from 'react';
import { Program, Person } from '../../types';
import { secretariatStore } from '../../lib/storage';
import { formatDate } from '../../lib/utils';
import {
  Trophy,
  CheckCircle2,
  AlertCircle,
  Clock,
  Printer,
  Copy,
  Check,
  X,
  Bus,
  Users,
  Calendar,
  Shield,
  FileText,
} from 'lucide-react';

interface SOARContingentReportModalProps {
  program: Program;
  people: Person[];
  onClose: () => void;
}

export const SOARContingentReportModal: React.FC<SOARContingentReportModalProps> = ({
  program,
  people,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  const units = program.units || [];
  const logistics = secretariatStore.getContingentLogistics(program.id);
  const contingent5D = secretariatStore.getContingentOverall5D(program.id);
  const allMemberships = secretariatStore.getEventMemberships();
  const allSessions = secretariatStore.getTrainingSessions();
  const allConfigs = secretariatStore.getCompetitionEventConfigs();

  const getPersonName = (personId?: string, fallback = 'Belum Ditetapkan') => {
    if (!personId) return fallback;
    const p = people.find((item) => item.id === personId);
    return p ? p.name : fallback;
  };

  const renderBadge = (level: string) => {
    if (level === 'READY') {
      return (
        <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold font-mono">
          🟢 READY
        </span>
      );
    }
    if (level === 'NEAR_READY') {
      return (
        <span className="px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 text-[10px] font-bold font-mono">
          🟡 NEAR READY
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded bg-red-100 dark:bg-red-950/70 text-red-800 dark:text-red-300 text-[10px] font-bold font-mono">
        🔴 NOT READY
      </span>
    );
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopyText = () => {
    let text = `========================================================\n`;
    text += `LAPORAN RASMI KESIAPSIAGAAN KONTINJEN SOAR 2026 KPMBP\n`;
    text += `Tarikh Cetakan: ${new Date().toLocaleDateString('ms-MY')}\n`;
    text += `Status Keseluruhan Kontinjen: ${contingent5D.overall}\n`;
    text += `========================================================\n\n`;

    text += `--- 1. KESEDIAAN 5 DIMENSI KONTINJEN ---\n`;
    text += `• Peserta: ${contingent5D.participants}\n`;
    text += `• Latihan: ${contingent5D.training}\n`;
    text += `• Prestasi / Repertoire: ${contingent5D.performance}\n`;
    text += `• Teknikal & Props: ${contingent5D.technical}\n`;
    text += `• Pematuhan & Syarat: ${contingent5D.compliance}\n\n`;

    text += `--- 2. STATUS 5 ACARA PERTANDINGAN ---\n`;
    units.forEach((u, i) => {
      const e5d = secretariatStore.get5DReadiness(u.id);
      const conf = allConfigs.find((c) => c.programUnitId === u.id);
      const pic = getPersonName(u.leaderId || conf?.picPersonId);
      const coach = getPersonName(conf?.coachPersonId);
      text += `${i + 1}. ${u.name}\n`;
      text += `   - Kesediaan: ${e5d.overall}\n`;
      text += `   - PIC: ${pic} | Jurulatih: ${coach}\n`;
      text += `   - Dimensi: [Peserta:${e5d.participants} | Latihan:${e5d.training} | Prestasi:${e5d.performance} | Teknikal:${e5d.technical} | Pematuhan:${e5d.compliance}]\n`;
    });

    text += `\n--- 3. LOGISTIK & PEGAWAI KONTINJEN ---\n`;
    text += `• Ketua Kontinjen: ${logistics.headOfContingent?.name || 'Belum ditetapkan'} (${logistics.headOfContingent?.phone || '-'})\n`;
    text += `• Timbalan Ketua: ${logistics.deputyHead?.name || 'Belum ditetapkan'} (${logistics.deputyHead?.phone || '-'})\n`;
    text += `• Kenderaan: ${logistics.vehicles?.length || 0} kenderaan berdaftar\n`;
    text += `• Penginapan: ${logistics.accommodation?.hotelName || 'Belum ditetapkan'}\n`;
    text += `• Perjalanan: Bertolak ${logistics.travel?.departureDate || '-'} dari ${logistics.travel?.departureLocation || '-'}\n`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col my-auto overflow-hidden">
        {/* Header Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-850">
          <div className="flex items-center gap-2.5">
            <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Laporan Kesiapsiagaan Kontinjen SOAR 2026 KPMBP
              </h2>
              <p className="text-xs text-slate-500">
                Pusat Kawalan Eksekutif & Ringkasan 5 Dimensi
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyText}
              className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition"
              title="Salin ringkasan ke papan keratan"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Disalin!' : 'Salin Teks'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 transition"
              title="Cetak Laporan Rasmi"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable / View Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-900 dark:text-slate-100 text-xs leading-relaxed printable-report">
          {/* Executive Overview Banner */}
          <div className="p-4 rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/50 dark:bg-indigo-950/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-widest text-indigo-600 dark:text-indigo-400 font-bold">
                Status Eksekutif
              </span>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Kesiapsiagaan Kontinjen KPM Bandar Penawar</span>
              </h3>
              <p className="text-slate-600 dark:text-slate-400 text-xs">
                Tarikh Acara: {program.startDate ? formatDate(program.startDate) : 'September 2026'} • Venue:{' '}
                {program.venue || 'Belum Ditetapkan'}
              </p>
            </div>

            <div className="flex flex-col items-start sm:items-end">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">
                Status Keseluruhan
              </span>
              <div className="mt-1">{renderBadge(contingent5D.overall)}</div>
            </div>
          </div>

          {/* 5-Dimension Summary Cards */}
          <div>
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 mb-2">
              1. Analisis Kesiapsiagaan 5 Dimensi Kontinjen
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850">
                <span className="text-[10px] text-slate-400 block mb-1">Dimensi 1</span>
                <span className="font-bold block text-slate-800 dark:text-slate-200 mb-1.5">
                  👥 Peserta
                </span>
                {renderBadge(contingent5D.participants)}
              </div>
              <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850">
                <span className="text-[10px] text-slate-400 block mb-1">Dimensi 2</span>
                <span className="font-bold block text-slate-800 dark:text-slate-200 mb-1.5">
                  📅 Latihan
                </span>
                {renderBadge(contingent5D.training)}
              </div>
              <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850">
                <span className="text-[10px] text-slate-400 block mb-1">Dimensi 3</span>
                <span className="font-bold block text-slate-800 dark:text-slate-200 mb-1.5">
                  🎭 Prestasi
                </span>
                {renderBadge(contingent5D.performance)}
              </div>
              <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850">
                <span className="text-[10px] text-slate-400 block mb-1">Dimensi 4</span>
                <span className="font-bold block text-slate-800 dark:text-slate-200 mb-1.5">
                  🛠️ Teknikal
                </span>
                {renderBadge(contingent5D.technical)}
              </div>
              <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850">
                <span className="text-[10px] text-slate-400 block mb-1">Dimensi 5</span>
                <span className="font-bold block text-slate-800 dark:text-slate-200 mb-1.5">
                  📋 Pematuhan
                </span>
                {renderBadge(contingent5D.compliance)}
              </div>
            </div>
          </div>

          {/* 5 Events Detail Table */}
          <div>
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 mb-2">
              2. Kesiapsiagaan 5 Acara SOAR 2026
            </h4>
            <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
                    <th className="p-2.5">Acara</th>
                    <th className="p-2.5">PIC / Jurulatih</th>
                    <th className="p-2.5 text-center">Peserta</th>
                    <th className="p-2.5 text-center">Latihan</th>
                    <th className="p-2.5 text-center">Prestasi</th>
                    <th className="p-2.5 text-center">Teknikal</th>
                    <th className="p-2.5 text-center">Pematuhan</th>
                    <th className="p-2.5 text-right">Kesediaan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {units.map((unit) => {
                    const e5d = secretariatStore.get5DReadiness(unit.id);
                    const config = allConfigs.find((c) => c.programUnitId === unit.id);
                    const picName = getPersonName(unit.leaderId || config?.picPersonId);
                    const coachName = getPersonName(config?.coachPersonId);
                    const mCount = allMemberships.filter((m) => m.eventId === unit.id).length;
                    const sCount = allSessions.filter((s) => s.eventId === unit.id).length;

                    return (
                      <tr key={unit.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/50">
                        <td className="p-2.5 font-bold text-slate-900 dark:text-white">
                          {unit.name}
                        </td>
                        <td className="p-2.5 text-slate-600 dark:text-slate-300">
                          <div>PIC: <span className="font-semibold">{picName}</span></div>
                          <div className="text-[11px] text-slate-400">Coach: {coachName}</div>
                        </td>
                        <td className="p-2.5 text-center">
                          {renderBadge(e5d.participants)}
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">{mCount} ahli</div>
                        </td>
                        <td className="p-2.5 text-center">
                          {renderBadge(e5d.training)}
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">{sCount} sesi</div>
                        </td>
                        <td className="p-2.5 text-center">
                          {renderBadge(e5d.performance)}
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">{unit.progress}%</div>
                        </td>
                        <td className="p-2.5 text-center">{renderBadge(e5d.technical)}</td>
                        <td className="p-2.5 text-center">{renderBadge(e5d.compliance)}</td>
                        <td className="p-2.5 text-right font-bold">{renderBadge(e5d.overall)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Logistik & Pegawai Summary */}
          <div>
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 mb-2">
              3. Maklumat Logistik, Pengangkutan & Penginapan
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 space-y-1.5">
                <span className="font-bold text-slate-800 dark:text-slate-200 block text-xs">
                  Kepimpinan & Pegawai
                </span>
                <div className="text-slate-600 dark:text-slate-300 text-xs space-y-1">
                  <div>Ketua Kontinjen: <span className="font-semibold">{logistics.headOfContingent?.name || 'Belum ditetapkan'}</span></div>
                  <div>Timbalan: <span className="font-semibold">{logistics.deputyHead?.name || 'Belum ditetapkan'}</span></div>
                  <div>Jumlah Pegawai Pengiring: <span className="font-semibold">{logistics.officers?.length || 0} orang</span></div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 space-y-1.5">
                <span className="font-bold text-slate-800 dark:text-slate-200 block text-xs">
                  Pengangkutan & Penginapan
                </span>
                <div className="text-slate-600 dark:text-slate-300 text-xs space-y-1">
                  <div>Kenderaan: <span className="font-semibold">{logistics.vehicles?.length || 0} kenderaan rasmi</span></div>
                  <div>Hotel: <span className="font-semibold">{logistics.accommodation?.hotelName || 'Belum ditetapkan'}</span></div>
                  <div>Perjalanan: <span className="font-semibold">{logistics.travel?.departureDate ? formatDate(logistics.travel.departureDate) : 'Belum ditetapkan'}</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex items-center justify-between text-[11px] text-slate-500">
          <span>Dihasilkan secara automatik oleh Sistem Pengurusan SOAR 2026 KPMBP</span>
          <span>Status: Sedia untuk Semakan Eksekutif</span>
        </div>
      </div>
    </div>
  );
};
