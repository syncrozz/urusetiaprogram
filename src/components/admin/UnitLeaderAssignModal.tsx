import React, { useState } from 'react';
import { secretariatStore } from '../../lib/storage';
import { ProgramUnit, Program, Person } from '../../types';
import { UserCheck, Search, Plus, Check, X, Phone, Mail, Shield, User } from 'lucide-react';

interface UnitLeaderAssignModalProps {
  isOpen: boolean;
  onClose: () => void;
  program: Program;
  unit: ProgramUnit;
  people: Person[];
}

export const UnitLeaderAssignModal: React.FC<UnitLeaderAssignModalProps> = ({
  isOpen,
  onClose,
  program,
  unit,
  people,
}) => {
  const [search, setSearch] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newFullName, setNewFullName] = useState('');
  const [newNickname, setNewNickname] = useState('');
  const [newPosition, setNewPosition] = useState('');
  const [newStudentId, setNewStudentId] = useState('');
  const [newIcLast4, setNewIcLast4] = useState('');
  const [newGmail, setNewGmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newDepartment, setNewDepartment] = useState('');

  if (!isOpen) return null;

  const handleSelectPerson = (personId?: string) => {
    secretariatStore.assignLeaderToUnit(program.id, unit.id, personId);
    onClose();
  };

  const handleCreateAndAssign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFullName.trim() || !newStudentId.trim()) return;

    const ic4 = newIcLast4.trim() || '1234';
    const emailPrefix = newFullName.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    const officialEmail = `${emailPrefix}@bpenawar.kpm.edu.my`;

    const created = secretariatStore.addNewPerson({
      fullName: newFullName.trim(),
      nickname: newNickname.trim() || newFullName.trim().split(' ')[0],
      position: newPosition.trim() || unit.name,
      studentId: newStudentId.trim(),
      icLast4: ic4,
      phone: newPhone.trim() || '012-3456789',
      gmail: newGmail.trim() || undefined,
      email: officialEmail,
      role: 'KETUA_UNIT',
      department: newDepartment.trim() || newPosition.trim() || unit.name,
    });

    secretariatStore.assignLeaderToUnit(program.id, unit.id, created.id);
    onClose();
  };

  const safePeople = (Array.isArray(people) ? people : []).filter(
    (p) => p && p.role !== 'ADMIN' && p.id !== 'usr-admin-khairi'
  );
  const filteredPeople = safePeople.filter(
    (p) =>
      p &&
      ((p.fullName || '').toLowerCase().includes(search.toLowerCase()) ||
        (p.nickname || '').toLowerCase().includes(search.toLowerCase()) ||
        (p.studentId || '').toLowerCase().includes(search.toLowerCase()) ||
        (p.gmail || '').toLowerCase().includes(search.toLowerCase()) ||
        (p.position || '').toLowerCase().includes(search.toLowerCase()) ||
        (p.department || '').toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 relative max-h-[90vh] flex flex-col">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          aria-label="Tutup"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4 shrink-0">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Lantikan Ketua Unit</h3>
            <p className="text-xs text-slate-500">
              {unit.name} • {program.name}
            </p>
          </div>
        </div>

        {unit.leader ? (
          <div className="mb-4 p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between shrink-0">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                  Ketua Unit Semasa:
                </span>
                {unit.leader.position && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-200 dark:bg-emerald-800 text-emerald-900 dark:text-emerald-100 font-semibold">
                    {unit.leader.position}
                  </span>
                )}
              </div>
              <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                {unit.leader.fullName} {unit.leader.nickname ? `(${unit.leader.nickname})` : ''}
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-300 font-mono mt-0.5">
                ID: <span className="font-bold">{unit.leader.studentId}</span> • 4 Digit IC: <span className="font-bold">{unit.leader.icLast4}</span>
              </p>
              {unit.leader.gmail && (
                <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                  <Mail className="w-3 h-3 text-red-500" />
                  <span>{unit.leader.gmail}</span>
                </p>
              )}
            </div>
            <button
              onClick={() => handleSelectPerson(undefined)}
              className="py-1 px-3 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-800 transition"
            >
              Keluarkan
            </button>
          </div>
        ) : (
          <div className="mb-4 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300 shrink-0">
            ⚠️ Unit ini belum mempunyai Ketua Unit. Sila pilih dari senarai atau daftarkan pelajar baru.
          </div>
        )}

        <div className="flex-1 overflow-y-auto pr-1">
          {!showCreateForm ? (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Cari nama, panggilan, ID pelajar, atau Gmail..."
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                  />
                </div>
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="py-2.5 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 shrink-0 shadow-xs transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Daftar Baru</span>
                </button>
              </div>

              <div className="space-y-2">
                {filteredPeople.map((person) => (
                  <button
                    key={person.id}
                    onClick={() => handleSelectPerson(person.id)}
                    className={`w-full text-left p-3 rounded-2xl border transition flex items-center justify-between text-xs ${
                      unit.leaderId === person.id
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-400 text-emerald-900 dark:text-emerald-200 font-bold'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/80 text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-1.5">
                        <p className="font-bold truncate text-slate-900 dark:text-white">{person.fullName}</p>
                        {person.nickname && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                            {person.nickname}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-2 text-[11px] text-slate-500 font-mono mt-0.5">
                        <span>ID: <strong className="text-slate-700 dark:text-slate-300">{person.studentId}</strong></span>
                        <span>•</span>
                        <span>4-Digit IC: <strong className="text-emerald-600 dark:text-emerald-400">{person.icLast4}</strong></span>
                        {person.position && (
                          <>
                            <span>•</span>
                            <span className="text-slate-500">{person.position}</span>
                          </>
                        )}
                      </div>
                      {person.gmail && (
                        <p className="text-[10px] text-slate-400 truncate mt-0.5">
                          Gmail: {person.gmail}
                        </p>
                      )}
                    </div>
                    {unit.leaderId === person.id ? (
                      <span className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                        <Check className="w-4 h-4" />
                      </span>
                    ) : (
                      <span className="py-1 px-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-xs font-semibold text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shrink-0">
                        Lantik
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <form onSubmit={handleCreateAndAssign} className="space-y-3.5 animate-fadeIn">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Daftar Profil Pelajar / Ketua Unit Baru
                </h4>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="text-xs text-emerald-600 hover:underline font-semibold"
                >
                  Kembali ke Carian
                </button>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Penuh (seperti dalam IC) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  placeholder="cth: NURZARA SOFEA BT SAIFUL NIZAM"
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nama Panggilan
                  </label>
                  <input
                    type="text"
                    value={newNickname}
                    onChange={(e) => setNewNickname(e.target.value)}
                    placeholder="cth: Zara"
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Jawatan / Portfolio
                  </label>
                  <input
                    type="text"
                    value={newPosition}
                    onChange={(e) => setNewPosition(e.target.value)}
                    placeholder="cth: Presiden / Ketua Unit"
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    No. ID Pelajar <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newStudentId}
                    onChange={(e) => setNewStudentId(e.target.value)}
                    placeholder="cth: PDL-2502-078"
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    4 Digit Terakhir No. IC <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    maxLength={4}
                    required
                    value={newIcLast4}
                    onChange={(e) => setNewIcLast4(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="cth: 0480"
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white font-mono text-center tracking-widest font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Alamat Gmail
                  </label>
                  <input
                    type="email"
                    value={newGmail}
                    onChange={(e) => setNewGmail(e.target.value)}
                    placeholder="nama@gmail.com"
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    No. Telefon (WhatsApp)
                  </label>
                  <input
                    type="text"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="016-4976385"
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="py-2.5 px-4 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-5 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-md hover:bg-emerald-700 transition"
                >
                  Simpan & Lantik
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
