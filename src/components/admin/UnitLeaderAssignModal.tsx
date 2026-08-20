import React, { useState } from 'react';
import { secretariatStore } from '../../lib/storage';
import { ProgramUnit, Program, Person } from '../../types';
import { UserCheck, Search, Plus, Check, X, Phone, Mail } from 'lucide-react';

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
  const [newStudentId, setNewStudentId] = useState('');
  const [newIcLast4, setNewIcLast4] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newDepartment, setNewDepartment] = useState('');

  if (!isOpen) return null;

  const handleSelectPerson = (personId?: string) => {
    secretariatStore.assignLeaderToUnit(program.id, unit.id, personId);
    onClose();
  };

  const handleCreateAndAssign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFullName.trim() || !newStudentId.trim()) return;

    const created = secretariatStore.addNewPerson({
      fullName: newFullName.trim(),
      studentId: newStudentId.trim(),
      icLast4: newIcLast4.trim() || '1234',
      phone: newPhone.trim() || '012-3456789',
      email: newEmail.trim() || `${newStudentId.trim().toLowerCase()}@student.edu.my`,
      role: 'KETUA_UNIT',
      department: newDepartment.trim() || unit.name,
    });

    secretariatStore.assignLeaderToUnit(program.id, unit.id, created.id);
    onClose();
  };

  const filteredPeople = people.filter(
    (p) =>
      p.fullName.toLowerCase().includes(search.toLowerCase()) ||
      p.studentId.toLowerCase().includes(search.toLowerCase()) ||
      p.department?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          aria-label="Tutup"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
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
          <div className="mb-4 p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                Ketua Unit Semasa:
              </p>
              <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                {unit.leader.fullName}
              </p>
              <p className="text-xs text-slate-500 font-mono">
                ID: {unit.leader.studentId} • IC: {unit.leader.icLast4} • Tel: {unit.leader.phone}
              </p>
            </div>
            <button
              onClick={() => handleSelectPerson(undefined)}
              className="py-1 px-3 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-800"
            >
              Keluarkan
            </button>
          </div>
        ) : (
          <div className="mb-4 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300">
            ⚠️ Unit ini belum mempunyai Ketua Unit. Sila pilih atau daftarkan individu yang bertanggungjawab.
          </div>
        )}

        {!showCreateForm ? (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari nama, ID pelajar, atau jabatan..."
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                />
              </div>
              <button
                onClick={() => setShowCreateForm(true)}
                className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 shrink-0 shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Daftar Baru</span>
              </button>
            </div>

            <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
              {filteredPeople.map((person) => (
                <button
                  key={person.id}
                  onClick={() => handleSelectPerson(person.id)}
                  className={`w-full text-left p-3 rounded-xl border transition flex items-center justify-between text-xs ${
                    unit.leaderId === person.id
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-400 text-emerald-900 dark:text-emerald-200 font-bold'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/80 text-slate-800 dark:text-slate-200'
                  }`}
                >
                  <div className="min-w-0 pr-2">
                    <p className="font-bold truncate">{person.fullName}</p>
                    <p className="text-[11px] text-slate-500 font-mono">
                      ID: {person.studentId} • IC: {person.icLast4}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate">{person.department || 'AJK Urusetia'}</p>
                  </div>
                  {unit.leaderId === person.id ? (
                    <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5" />
                    </span>
                  ) : (
                    <span className="text-xs font-semibold text-emerald-600 shrink-0">Lantik</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <form onSubmit={handleCreateAndAssign} className="space-y-3 animate-fadeIn">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Daftar Profil Ketua Unit Baru
              </h4>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="text-xs text-slate-400 hover:text-slate-600"
              >
                Kembali ke Carian
              </button>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                Nama Penuh <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={newFullName}
                onChange={(e) => setNewFullName(e.target.value)}
                placeholder="cth: Muhammad Hazim bin Ariffin"
                className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  No. ID Pelajar <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newStudentId}
                  onChange={(e) => setNewStudentId(e.target.value)}
                  placeholder="B032110999"
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
                  onChange={(e) => setNewIcLast4(e.target.value)}
                  placeholder="5313"
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white font-mono text-center"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  No. Telefon
                </label>
                <input
                  type="text"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="012-3456789"
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Jabatan / Fakulti
                </label>
                <input
                  type="text"
                  value={newDepartment}
                  onChange={(e) => setNewDepartment(e.target.value)}
                  placeholder="Fakulti Komputeran"
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="py-2 px-4 rounded-xl border border-slate-300 text-xs font-semibold"
              >
                Batal
              </button>
              <button
                type="submit"
                className="py-2 px-5 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-md hover:bg-emerald-700"
              >
                Simpan & Lantik
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
