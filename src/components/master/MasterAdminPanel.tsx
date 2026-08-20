import React, { useState, useRef } from 'react';
import { MainCategory, ProgramTemplate, Person, Program, PriorityLevel, TemplateUnit, TemplateRequirement } from '../../types';
import { secretariatStore } from '../../lib/storage';
import { IconRenderer } from '../common/IconRenderer';
import { PriorityBadge } from '../common/Badge';
import {
  exportPeopleToCSV,
  importPeopleFromCSV,
  downloadCSV,
  exportUnitsReadinessToCSV,
  getSampleStudentCSVTemplate,
} from '../../lib/csvHelper';
import {
  Lock,
  FolderTree,
  FileCode,
  Download,
  Upload,
  RotateCcw,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  Save,
  Sparkles,
  Users,
  FileSpreadsheet,
  FileDown,
  FileUp,
  Search,
  Mail,
  Phone,
  Shield,
  UserCheck,
  AlertCircle,
  AlertTriangle,
  X,
  FolderPlus,
  Layers,
  Copy,
  PlusCircle,
  MinusCircle,
  ListPlus,
  CheckSquare,
  Square,
  Settings,
  ChevronRight,
  Info,
  Smartphone,
  Cloud,
  Flame,
  RefreshCw,
} from 'lucide-react';

interface MasterAdminPanelProps {
  categories: MainCategory[];
  templates: ProgramTemplate[];
  people?: Person[];
  activeProgram?: Program;
  onLock: () => void;
}

export const MasterAdminPanel: React.FC<MasterAdminPanelProps> = ({
  categories,
  templates,
  people = [],
  activeProgram,
  onLock,
}) => {
  const [activeTab, setActiveTab] = useState<'categories' | 'templates' | 'students_csv' | 'backup'>('students_csv');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(templates[0]?.id || '');
  const [feedback, setFeedback] = useState<string>('');
  const [feedbackType, setFeedbackType] = useState<'success' | 'error'>('success');

  // Search & Filter for Students
  const [studentSearch, setStudentSearch] = useState('');
  
  // CSV Import State
  const [isDragOver, setIsDragOver] = useState(false);
  const [importedPreview, setImportedPreview] = useState<{
    parsed: Person[];
    count: number;
    errors: string[];
    rawText: string;
  } | null>(null);
  const [importMode, setImportMode] = useState<'APPEND' | 'REPLACE'>('APPEND');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Manual Add Student Modal State
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [newFullName, setNewFullName] = useState('');
  const [newNickname, setNewNickname] = useState('');
  const [newPosition, setNewPosition] = useState('');
  const [newStudentId, setNewStudentId] = useState('');
  const [newIcNumber, setNewIcNumber] = useState('');
  const [newIcLast4, setNewIcLast4] = useState('');
  const [newGmail, setNewGmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newGender, setNewGender] = useState('Perempuan');
  const [newProgramStudy, setNewProgramStudy] = useState('DLM');
  const [newSemester, setNewSemester] = useState('Semester 3');

  // Category Management State
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [catName, setCatName] = useState('');
  const [catDescription, setCatDescription] = useState('');
  const [catIcon, setCatIcon] = useState('Drama');
  const [catColor, setCatColor] = useState('#d97706');
  const [catStatus, setCatStatus] = useState<'ACTIVE' | 'ARCHIVED'>('ACTIVE');

  // Popular Icon presets for categories
  const categoryIconOptions = [
    'Drama',
    'Store',
    'GraduationCap',
    'Sparkles',
    'Trophy',
    'HeartHandshake',
    'Award',
    'BookOpen',
    'Music',
    'Film',
    'Flame',
    'CalendarDays',
    'Megaphone',
    'Users',
    'ShieldCheck',
    'MapPin',
    'Zap',
    'Utensils',
    'Clock',
    'QrCode',
  ];

  // Popular Color presets
  const categoryColorOptions = [
    { label: 'Amber', value: '#d97706', bgClass: 'bg-amber-600' },
    { label: 'Emerald', value: '#059669', bgClass: 'bg-emerald-600' },
    { label: 'Indigo', value: '#4f46e5', bgClass: 'bg-indigo-600' },
    { label: 'Rose', value: '#e11d48', bgClass: 'bg-rose-600' },
    { label: 'Cyan', value: '#0891b2', bgClass: 'bg-cyan-600' },
    { label: 'Violet', value: '#7c3aed', bgClass: 'bg-violet-600' },
    { label: 'Blue', value: '#2563eb', bgClass: 'bg-blue-600' },
    { label: 'Orange', value: '#ea580c', bgClass: 'bg-orange-600' },
  ];

  const handleOpenAddCategory = () => {
    setEditingCategoryId(null);
    setCatName('');
    setCatDescription('');
    setCatIcon('Drama');
    setCatColor('#d97706');
    setCatStatus('ACTIVE');
    setIsCategoryModalOpen(true);
  };

  const handleOpenEditCategory = (c: MainCategory) => {
    setEditingCategoryId(c.id);
    setCatName(c.name);
    setCatDescription(c.description);
    setCatIcon(c.icon || 'Drama');
    setCatColor(c.color || '#d97706');
    setCatStatus(c.status || 'ACTIVE');
    setIsCategoryModalOpen(true);
  };

  const handleSaveCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) {
      showFeedback('Sila masukkan nama kategori.', 'error');
      return;
    }

    if (editingCategoryId) {
      const existing = categories.find((c) => c.id === editingCategoryId);
      const updatedCat: MainCategory = {
        id: editingCategoryId,
        name: catName.trim(),
        description: catDescription.trim(),
        icon: catIcon.trim() || 'Drama',
        color: catColor,
        status: catStatus,
        templatesCount: existing?.templatesCount ?? templates.filter((t) => t.categoryId === editingCategoryId).length,
        createdAt: existing?.createdAt || new Date().toISOString(),
      };
      secretariatStore.saveCategory(updatedCat);
      showFeedback(`Kategori utama [${catName.trim()}] berjaya dikemaskini!`);
    } else {
      const newId = `cat-${Date.now()}`;
      const newCat: MainCategory = {
        id: newId,
        name: catName.trim(),
        description: catDescription.trim(),
        icon: catIcon.trim() || 'Drama',
        color: catColor,
        status: catStatus,
        templatesCount: 0,
        createdAt: new Date().toISOString(),
      };
      secretariatStore.saveCategory(newCat);
      showFeedback(`Kategori utama baharu [${catName.trim()}] berjaya ditambah!`);
    }

    setIsCategoryModalOpen(false);
  };

  // --- Category Delete Confirmation Modal State ---
  const [categoryToDelete, setCategoryToDelete] = useState<MainCategory | null>(null);

  const handleRequestDeleteCategory = (c: MainCategory) => {
    setCategoryToDelete(c);
  };

  const handleConfirmDeleteCategory = () => {
    if (!categoryToDelete) return;
    const catName = categoryToDelete.name;
    const catId = categoryToDelete.id;
    const success = secretariatStore.deleteCategory(catId);
    if (success) {
      showFeedback(`Kategori utama [${catName}] telah berjaya dipadam.`);
    } else {
      showFeedback('Gagal memadam kategori utama.', 'error');
    }
    setCategoryToDelete(null);
  };

  // --- Template Management State ---
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [tplName, setTplName] = useState('');
  const [tplCategoryId, setTplCategoryId] = useState('');
  const [tplDescription, setTplDescription] = useState('');
  const [tplVersion, setTplVersion] = useState('v1.0');
  const [tplStatus, setTplStatus] = useState<'ACTIVE' | 'DRAFT' | 'ARCHIVED'>('ACTIVE');

  // --- Unit Management State (within Template) ---
  const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);
  const [editingUnitId, setEditingUnitId] = useState<string | null>(null);
  const [unitTargetTemplateId, setUnitTargetTemplateId] = useState<string | null>(null);
  const [unitName, setUnitName] = useState('');
  const [unitDescription, setUnitDescription] = useState('');
  const [unitIcon, setUnitIcon] = useState('ShieldCheck');
  const [unitPriority, setUnitPriority] = useState<PriorityLevel>('HIGH');
  const [unitRequirementsList, setUnitRequirementsList] = useState<
    { id: string; title: string; required: boolean; priority: PriorityLevel; sortOrder: number }[]
  >([]);
  const [newReqDraftTitle, setNewReqDraftTitle] = useState('');
  const [newReqDraftRequired, setNewReqDraftRequired] = useState(true);

  // Quick inline checklist add state per unit
  const [inlineReqTexts, setInlineReqTexts] = useState<{ [unitId: string]: string }>({});
  const [inlineReqRequired, setInlineReqRequired] = useState<{ [unitId: string]: boolean }>({});

  const handleOpenAddTemplate = () => {
    setEditingTemplateId(null);
    setTplName('');
    setTplCategoryId(categories[0]?.id || 'cat-theatre');
    setTplDescription('');
    setTplVersion('v1.0');
    setTplStatus('ACTIVE');
    setIsTemplateModalOpen(true);
  };

  const handleOpenEditTemplate = (t: ProgramTemplate) => {
    setEditingTemplateId(t.id);
    setTplName(t.name);
    setTplCategoryId(t.categoryId);
    setTplDescription(t.description);
    setTplVersion(t.version || 'v1.0');
    setTplStatus(t.status || 'ACTIVE');
    setIsTemplateModalOpen(true);
  };

  const handleSaveTemplateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tplName.trim()) {
      showFeedback('Sila masukkan nama blueprint template.', 'error');
      return;
    }
    if (!tplCategoryId) {
      showFeedback('Sila pilih kategori induk untuk template ini.', 'error');
      return;
    }

    if (editingTemplateId) {
      const existing = templates.find((t) => t.id === editingTemplateId);
      const updatedTpl: ProgramTemplate = {
        id: editingTemplateId,
        name: tplName.trim(),
        categoryId: tplCategoryId,
        description: tplDescription.trim(),
        version: tplVersion.trim() || 'v1.0',
        status: tplStatus,
        units: existing?.units || [],
        createdAt: existing?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      secretariatStore.saveTemplate(updatedTpl);
      showFeedback(`Blueprint Template [${tplName.trim()}] berjaya dikemaskini!`);
    } else {
      const newId = `tpl-${Date.now()}`;
      const defaultUnitId = `unit-${Date.now()}-1`;
      const newTpl: ProgramTemplate = {
        id: newId,
        name: tplName.trim(),
        categoryId: tplCategoryId,
        description: tplDescription.trim(),
        version: tplVersion.trim() || 'v1.0',
        status: tplStatus,
        units: [
          {
            id: defaultUnitId,
            templateId: newId,
            name: 'Unit Pengurusan & Urusetia Utama',
            description: 'Penyelarasan keseluruhan program dan taklimat gerak kerja.',
            icon: 'ShieldCheck',
            priority: 'CRITICAL',
            sortOrder: 1,
            requirements: [
              {
                id: `req-${Date.now()}-1`,
                unitId: defaultUnitId,
                title: 'Penyediaan Kertas Kerja & Kelulusan Pengurusan',
                description: 'Kertas kerja rasmi diluluskan.',
                priority: 'CRITICAL',
                required: true,
                sortOrder: 1,
              },
              {
                id: `req-${Date.now()}-2`,
                unitId: defaultUnitId,
                title: 'Pelantikan & Taklimat Jawatankuasa Pelaksana',
                description: 'Semua ketua unit menerima surat lantikan.',
                priority: 'HIGH',
                required: true,
                sortOrder: 2,
              },
            ],
          },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      secretariatStore.saveTemplate(newTpl);
      setSelectedTemplateId(newId);
      showFeedback(`Blueprint Template baharu [${tplName.trim()}] berjaya dicipta dengan unit asas!`);
    }

    setIsTemplateModalOpen(false);
  };

  const handleDeleteTemplate = (t: ProgramTemplate) => {
    if (
      window.confirm(
        `Adakah anda pasti mahu memadam Blueprint Template [${t.name}] (${t.units.length} unit)? Tindakan ini tidak boleh diundur.`
      )
    ) {
      secretariatStore.deleteTemplate(t.id);
      showFeedback(`Blueprint Template [${t.name}] telah dipadam.`);
      // Select another template if deleted was active
      const remaining = templates.filter((tpl) => tpl.id !== t.id);
      if (remaining.length > 0) {
        setSelectedTemplateId(remaining[0].id);
      }
    }
  };

  const handleDuplicateTemplate = (t: ProgramTemplate) => {
    const newId = `tpl-dup-${Date.now()}`;
    const duplicated: ProgramTemplate = {
      ...t,
      id: newId,
      name: `${t.name} (Salinan)`,
      version: 'v1.0',
      units: t.units.map((u, uIdx) => ({
        ...u,
        id: `unit-${Date.now()}-${uIdx}`,
        templateId: newId,
        requirements: u.requirements.map((r, rIdx) => ({
          ...r,
          id: `req-${Date.now()}-${uIdx}-${rIdx}`,
        })),
      })),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    secretariatStore.saveTemplate(duplicated);
    setSelectedTemplateId(newId);
    showFeedback(`Templat disalin sebagai [${duplicated.name}]!`);
  };

  // --- Unit Handlers (Add / Edit / Delete / Requirement Management) ---
  const handleOpenAddUnit = (templateId: string) => {
    setUnitTargetTemplateId(templateId);
    setEditingUnitId(null);
    setUnitName('');
    setUnitDescription('');
    setUnitIcon('ShieldCheck');
    setUnitPriority('HIGH');
    setUnitRequirementsList([
      {
        id: `req-${Date.now()}-1`,
        title: 'Checklist kesediaan awal unit',
        required: true,
        priority: 'HIGH',
        sortOrder: 1,
      },
    ]);
    setNewReqDraftTitle('');
    setNewReqDraftRequired(true);
    setIsUnitModalOpen(true);
  };

  const handleOpenEditUnit = (templateId: string, unit: TemplateUnit) => {
    setUnitTargetTemplateId(templateId);
    setEditingUnitId(unit.id);
    setUnitName(unit.name);
    setUnitDescription(unit.description);
    setUnitIcon(unit.icon || 'ShieldCheck');
    setUnitPriority(unit.priority);
    setUnitRequirementsList([...unit.requirements]);
    setNewReqDraftTitle('');
    setNewReqDraftRequired(true);
    setIsUnitModalOpen(true);
  };

  const handleSaveUnitSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!unitTargetTemplateId) return;
    if (!unitName.trim()) {
      showFeedback('Sila masukkan nama unit.', 'error');
      return;
    }

    const tpl = templates.find((t) => t.id === unitTargetTemplateId);
    if (!tpl) return;

    let updatedUnits: TemplateUnit[];
    if (editingUnitId) {
      updatedUnits = tpl.units.map((u) => {
        if (u.id === editingUnitId) {
          return {
            ...u,
            name: unitName.trim(),
            description: unitDescription.trim(),
            icon: unitIcon.trim() || 'ShieldCheck',
            priority: unitPriority,
            requirements: unitRequirementsList.map((r, i) => ({
              id: r.id || `req-${Date.now()}-${i}`,
              unitId: editingUnitId,
              title: r.title,
              description: (r as any).description || r.title,
              priority: r.priority || unitPriority,
              required: r.required,
              sortOrder: i + 1,
            })),
          };
        }
        return u;
      });
      showFeedback(`Unit [${unitName.trim()}] berjaya dikemaskini!`);
    } else {
      const newUnitId = `unit-${Date.now()}`;
      const newUnit: TemplateUnit = {
        id: newUnitId,
        templateId: unitTargetTemplateId,
        name: unitName.trim(),
        description: unitDescription.trim(),
        icon: unitIcon.trim() || 'ShieldCheck',
        priority: unitPriority,
        sortOrder: tpl.units.length + 1,
        requirements:
          unitRequirementsList.length > 0
            ? unitRequirementsList.map((r, i) => ({
                id: r.id || `req-${Date.now()}-${i}`,
                unitId: newUnitId,
                title: r.title,
                description: (r as any).description || r.title,
                priority: r.priority || unitPriority,
                required: r.required,
                sortOrder: i + 1,
              }))
            : [
                {
                  id: `req-${Date.now()}-1`,
                  unitId: newUnitId,
                  title: 'Semakan kesediaan unit',
                  description: 'Semakan kesediaan unit',
                  required: true,
                  priority: unitPriority,
                  sortOrder: 1,
                },
              ],
      };
      updatedUnits = [...tpl.units, newUnit];
      showFeedback(`Unit baharu [${unitName.trim()}] berjaya ditambah ke blueprint!`);
    }

    const updatedTpl: ProgramTemplate = {
      ...tpl,
      units: updatedUnits,
      updatedAt: new Date().toISOString(),
    };
    secretariatStore.saveTemplate(updatedTpl);
    setIsUnitModalOpen(false);
  };

  const handleDeleteUnit = (templateId: string, unitId: string) => {
    const tpl = templates.find((t) => t.id === templateId);
    if (!tpl) return;
    const unitToDelete = tpl.units.find((u) => u.id === unitId);
    if (!unitToDelete) return;

    if (window.confirm(`Adakah anda pasti mahu memadam Unit [${unitToDelete.name}] daripada template ini?`)) {
      const updatedUnits = tpl.units.filter((u) => u.id !== unitId);
      const updatedTpl: ProgramTemplate = {
        ...tpl,
        units: updatedUnits,
        updatedAt: new Date().toISOString(),
      };
      secretariatStore.saveTemplate(updatedTpl);
      showFeedback(`Unit [${unitToDelete.name}] telah dipadam.`);
    }
  };

  // Inline Quick Add Requirement
  const handleQuickAddRequirement = (templateId: string, unitId: string) => {
    const title = (inlineReqTexts[unitId] || '').trim();
    if (!title) return;
    const isReq = inlineReqRequired[unitId] !== false; // default true

    const tpl = templates.find((t) => t.id === templateId);
    if (!tpl) return;

    const updatedUnits = tpl.units.map((u) => {
      if (u.id === unitId) {
        const newReq: TemplateRequirement = {
          id: `req-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          unitId: unitId,
          title,
          description: title,
          priority: u.priority,
          required: isReq,
          sortOrder: u.requirements.length + 1,
        };
        return {
          ...u,
          requirements: [...u.requirements, newReq],
        };
      }
      return u;
    });

    secretariatStore.saveTemplate({
      ...tpl,
      units: updatedUnits,
      updatedAt: new Date().toISOString(),
    });

    setInlineReqTexts((prev) => ({ ...prev, [unitId]: '' }));
    showFeedback(`Checklist [${title}] ditambah ke unit!`);
  };

  // Delete Requirement
  const handleDeleteRequirement = (templateId: string, unitId: string, reqId: string) => {
    const tpl = templates.find((t) => t.id === templateId);
    if (!tpl) return;

    const updatedUnits = tpl.units.map((u) => {
      if (u.id === unitId) {
        return {
          ...u,
          requirements: u.requirements.filter((r) => r.id !== reqId),
        };
      }
      return u;
    });

    secretariatStore.saveTemplate({
      ...tpl,
      units: updatedUnits,
      updatedAt: new Date().toISOString(),
    });
    showFeedback('Checklist dipadam daripada unit.');
  };

  // Toggle Requirement Required status
  const handleToggleRequirementRequired = (templateId: string, unitId: string, reqId: string) => {
    const tpl = templates.find((t) => t.id === templateId);
    if (!tpl) return;

    const updatedUnits = tpl.units.map((u) => {
      if (u.id === unitId) {
        return {
          ...u,
          requirements: u.requirements.map((r) => {
            if (r.id === reqId) {
              return { ...r, required: !r.required };
            }
            return r;
          }),
        };
      }
      return u;
    });

    secretariatStore.saveTemplate({
      ...tpl,
      units: updatedUnits,
      updatedAt: new Date().toISOString(),
    });
  };

  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId) || templates[0];
  const safePeople = Array.isArray(people) ? people : secretariatStore.getState().people || [];

  const showFeedback = (msg: string, type: 'success' | 'error' = 'success') => {
    setFeedback(msg);
    setFeedbackType(type);
    setTimeout(() => setFeedback(''), 4500);
  };

  // --- CSV Export Handlers ---
  const handleExportStudentsCSV = () => {
    const csvData = exportPeopleToCSV(safePeople);
    const dateStr = new Date().toISOString().split('T')[0];
    downloadCSV(csvData, `senarai-pelajar-ketua-unit-${dateStr}.csv`);
    showFeedback(`Berjaya mengeksport ${safePeople.length} rekod pelajar ke CSV!`);
  };

  const handleExportReadinessCSV = () => {
    if (!activeProgram) {
      showFeedback('Tiada program aktif dipilih.', 'error');
      return;
    }
    const csvData = exportUnitsReadinessToCSV(activeProgram);
    const dateStr = new Date().toISOString().split('T')[0];
    downloadCSV(csvData, `laporan-kesediaan-unit-${activeProgram.name.replace(/\s+/g, '-').toLowerCase()}-${dateStr}.csv`);
    showFeedback(`Laporan Kesediaan Unit untuk ${activeProgram.name} berjaya dieksport ke CSV!`);
  };

  const handleDownloadSampleTemplate = () => {
    const templateData = getSampleStudentCSVTemplate();
    downloadCSV(templateData, 'templat-contoh-import-pelajar.csv');
    showFeedback('Templat contoh CSV berjaya dimuat turun!');
  };

  // --- CSV Import Handlers ---
  const processCSVFile = (file: File) => {
    if (!file.name.endsWith('.csv') && file.type !== 'text/csv') {
      showFeedback('Sila pilih fail berformat .CSV sahaja.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const result = importPeopleFromCSV(text);
      if (result.success) {
        setImportedPreview({
          parsed: result.people,
          count: result.importedCount,
          errors: result.errors,
          rawText: text,
        });
        showFeedback(`Pratonton fail CSV dimuatkan (${result.importedCount} rekod dikesan). Sila sahkan untuk import.`);
      } else {
        showFeedback(result.errors.join(', ') || 'Gagal membaca fail CSV.', 'error');
      }
    };
    reader.readAsText(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processCSVFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processCSVFile(file);
    }
  };

  const handleConfirmImport = () => {
    if (!importedPreview || importedPreview.parsed.length === 0) return;

    const finalCount = secretariatStore.importPeople(importedPreview.parsed, importMode);
    showFeedback(`Berjaya mengimport ${importedPreview.parsed.length} rekod pelajar! Jumlah rekod terkini: ${finalCount}`);
    setImportedPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // --- Manual Add Student ---
  const handleAddStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFullName.trim() || !newStudentId.trim()) {
      showFeedback('Sila lengkapkan Nama Penuh dan No. ID Pelajar.', 'error');
      return;
    }

    let calculatedIcLast4 = newIcLast4.trim();
    if (!calculatedIcLast4 && newIcNumber.trim()) {
      const digits = newIcNumber.replace(/[^0-9]/g, '');
      if (digits.length >= 4) {
        calculatedIcLast4 = digits.slice(-4);
      }
    }
    if (!calculatedIcLast4) {
      calculatedIcLast4 = '1234';
    }

    const emailPrefix = newFullName.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    const officialEmail = `${emailPrefix}@bpenawar.kpm.edu.my`;

    secretariatStore.addNewPerson({
      fullName: newFullName.trim(),
      nickname: newNickname.trim() || newFullName.trim().split(' ')[0],
      position: newPosition.trim() || 'Ketua Unit',
      studentId: newStudentId.trim(),
      icNumber: newIcNumber.trim() || undefined,
      icLast4: calculatedIcLast4,
      phone: newPhone.trim() || '-',
      gmail: newGmail.trim() || undefined,
      email: officialEmail,
      gender: newGender,
      programStudy: newProgramStudy,
      semester: newSemester,
      role: 'KETUA_UNIT',
      department: newPosition.trim() || newProgramStudy || 'Ketua Unit',
    });

    showFeedback(`Pelajar ${newFullName.trim()} berjaya ditambah ke pangkalan data!`);
    setIsAddStudentOpen(false);
    // Reset form
    setNewFullName('');
    setNewNickname('');
    setNewPosition('');
    setNewStudentId('');
    setNewIcNumber('');
    setNewIcLast4('');
    setNewGmail('');
    setNewPhone('');
  };

  const handleDeleteStudent = (p: Person) => {
    if (window.confirm(`Adakah anda pasti mahu memadam rekod [${p.fullName}] (${p.studentId})?`)) {
      secretariatStore.deletePerson(p.id);
      showFeedback(`Rekod ${p.fullName} telah dipadam.`);
    }
  };

  const handleClearAllStudents = () => {
    const studentCount = safePeople.filter((p) => p.role !== 'ADMIN').length;
    if (studentCount === 0) {
      showFeedback('Tiada rekod pelajar untuk dikosongkan.', 'error');
      return;
    }

    if (
      window.confirm(
        `Adakah anda pasti mahu memadam SEMUA ${studentCount} rekod pelajar? Pangkalan data pelajar akan dikosongkan untuk sedia menerima kemasukan data baru.`
      )
    ) {
      secretariatStore.clearAllStudents();
      showFeedback('Semua rekod pelajar telah dikosongkan. Sedia menerima data baharu.');
    }
  };

  // --- JSON Backup Handlers ---
  const handleExportBackup = () => {
    const jsonStr = secretariatStore.exportJSONBackup();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `syncrozz-secretariat-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showFeedback('Pangkalan data JSON berjaya dieksport!');
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = secretariatStore.importJSONBackup(content);
      if (success) {
        showFeedback('Pangkalan data JSON berjaya diimport dan dimuat semula!');
      } else {
        showFeedback('Format fail JSON tidak sah.', 'error');
      }
    };
    reader.readAsText(file);
  };

  const handleResetData = () => {
    if (
      window.confirm(
        'Adakah anda pasti mahu set semula pangkalan data ke contoh asal (Seed Data)? Semua rekod pelajar dan perubahan manual akan dikembalikan ke tetapan awal.'
      )
    ) {
      secretariatStore.resetToInitialSeed();
      showFeedback('Sistem berjaya diset semula kepada Seed Data asal.');
    }
  };

  // Filtered students (only real students, strictly excluding administrators and mock data)
  const filteredStudents = safePeople.filter((p) => {
    if (!p || p.role === 'ADMIN' || p.id === 'usr-admin-khairi') return false;
    const q = studentSearch.toLowerCase().trim();
    if (!q) return true;
    return (
      (p.fullName || '').toLowerCase().includes(q) ||
      (p.nickname || '').toLowerCase().includes(q) ||
      (p.studentId || '').toLowerCase().includes(q) ||
      (p.icLast4 || '').toLowerCase().includes(q) ||
      (p.icNumber || '').toLowerCase().includes(q) ||
      (p.gmail || '').toLowerCase().includes(q) ||
      (p.email || '').toLowerCase().includes(q) ||
      (p.position || '').toLowerCase().includes(q) ||
      (p.programStudy || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Master Admin Header */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-900 rounded-3xl p-6 text-white border border-emerald-800/50 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0 shadow-inner">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight">Pusat Kawalan Master Admin</h2>
              <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-bold uppercase tracking-wider border border-emerald-500/40 flex items-center gap-1.5 shadow-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Master Admin Aktif
              </span>
            </div>
            <p className="text-xs text-emerald-200/80 mt-0.5">
              Hab Pengurusan Data Pelajar (CSV Ready), Kategori Induk, Blueprint Template & Sandaran Sistem.
            </p>
          </div>
        </div>

        <button
          onClick={onLock}
          className="py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold backdrop-blur-xs transition self-start sm:self-auto border border-white/10"
        >
          Kunci Mod Master
        </button>
      </div>

      {feedback && (
        <div
          className={`p-3.5 rounded-2xl border text-xs font-bold flex items-center gap-2 animate-fadeIn ${
            feedbackType === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200'
              : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-700 text-rose-800 dark:text-rose-200'
          }`}
        >
          {feedbackType === 'success' ? (
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{feedback}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('students_csv')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'students_csv'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Pengurusan Pelajar & Hab CSV ({safePeople.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('categories')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'categories'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <FolderTree className="w-4 h-4" />
          <span>Kategori Utama ({categories.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('templates')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'templates'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <FileCode className="w-4 h-4" />
          <span>Master Template Program ({templates.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('backup')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'backup'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Download className="w-4 h-4" />
          <span>Sandaran JSON & Reset</span>
        </button>
      </div>

      {/* TAB: Pengurusan Pelajar & CSV Hub */}
      {activeTab === 'students_csv' && (
        <div className="space-y-6">
          {/* Quick Action CSV Banner */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Export Card */}
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center mb-3">
                  <FileDown className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Eksport CSV Sedia Ada</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Muat turun senarai lengkap semua pelajar & Ketua Unit mengandungi Gmail, 4 Digit No. IC, Jawatan, ID dan Kursus.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <button
                  onClick={handleExportStudentsCSV}
                  className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition"
                >
                  <Download className="w-4 h-4" />
                  <span>Eksport Data Pelajar (.CSV)</span>
                </button>
                {activeProgram && (
                  <button
                    onClick={handleExportReadinessCSV}
                    className="w-full py-2 px-3 rounded-xl border border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 font-semibold text-xs flex items-center justify-center gap-2 transition"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>Eksport Kesediaan Unit (.CSV)</span>
                  </button>
                )}
              </div>
            </div>

            {/* Import Card */}
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-2xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center mb-3">
                  <FileUp className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Import Fail CSV Pelajar</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Muat naik fail CSV untuk mendaftar atau mengemaskini maklumat pelajar secara pukal dengan pengesahan segera.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                <label className="w-full py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition cursor-pointer">
                  <Upload className="w-4 h-4" />
                  <span>Pilih & Muat Naik Fail .CSV</span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,text/csv"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Sample Template Download & Manual Add */}
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center mb-3">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Templat & Daftar Manual</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Dapatkan contoh templat CSV yang telah diformatkan mengikut susunan lajur sistem atau daftar pelajar secara individu.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <button
                  onClick={handleDownloadSampleTemplate}
                  className="w-full py-2.5 px-3 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-2 transition"
                >
                  <Download className="w-4 h-4 text-amber-600" />
                  <span>Muat Turun Templat Contoh CSV</span>
                </button>
                <button
                  onClick={() => setIsAddStudentOpen(true)}
                  className="w-full py-2 px-3 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white font-semibold text-xs flex items-center justify-center gap-2 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Pelajar Manual</span>
                </button>
              </div>
            </div>
          </div>

          {/* Drag & Drop Import Dropzone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            className={`p-6 rounded-3xl border-2 border-dashed transition text-center flex flex-col items-center justify-center ${
              isDragOver
                ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 scale-[1.01]'
                : 'border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/40 hover:border-slate-400'
            }`}
          >
            <FileSpreadsheet className="w-10 h-10 text-slate-400 mb-2" />
            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
              Seret dan lepaskan fail CSV ke sini
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Menyokong format CSV UTF-8 dengan lajur Gmail, Nama, No. Kad Pengenalan, 4 Digit IC, No. ID, Jawatan & Program
            </p>
            <label className="mt-3 px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 shadow-xs cursor-pointer transition">
              Cari Fail Komputer
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={handleFileSelect}
                className="hidden"
              />
            </label>
          </div>

          {/* CSV Import Preview Modal / Section */}
          {importedPreview && (
            <div className="p-6 rounded-3xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 space-y-4 animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span>Pratonton Fail CSV: {importedPreview.count} Rekod Dijumpai</span>
                  </h3>
                  <p className="text-xs text-indigo-700 dark:text-indigo-300 mt-0.5">
                    Sila pilih mod import di bawah sebelum menyimpan ke pangkalan data.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setImportedPreview(null)}
                    className="py-1.5 px-3 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleConfirmImport}
                    className="py-1.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Sahkan & Import Sekarang</span>
                  </button>
                </div>
              </div>

              {/* Mode Selection */}
              <div className="flex items-center gap-4 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-indigo-100 dark:border-indigo-900 text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-300">Mod Import:</span>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="importMode"
                    value="APPEND"
                    checked={importMode === 'APPEND'}
                    onChange={() => setImportMode('APPEND')}
                    className="text-emerald-600"
                  />
                  <span>Gabung & Kemaskini (Kekalkan Data Sedia Ada)</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="importMode"
                    value="REPLACE"
                    checked={importMode === 'REPLACE'}
                    onChange={() => setImportMode('REPLACE')}
                    className="text-emerald-600"
                  />
                  <span>Gantian Penuh (Gantikan Seluruh Senarai)</span>
                </label>
              </div>

              {/* Preview Table (First 5) */}
              <div className="overflow-x-auto rounded-2xl border border-indigo-200 dark:border-indigo-800 bg-white dark:bg-slate-900">
                <table className="w-full text-left text-xs">
                  <thead className="bg-indigo-100/50 dark:bg-indigo-950/60 text-[11px] font-bold uppercase text-indigo-900 dark:text-indigo-200 border-b border-indigo-200 dark:border-indigo-800">
                    <tr>
                      <th className="p-2.5">Nama Penuh</th>
                      <th className="p-2.5">Panggilan</th>
                      <th className="p-2.5">Jawatan</th>
                      <th className="p-2.5">No. ID</th>
                      <th className="p-2.5">4 Digit IC</th>
                      <th className="p-2.5">Gmail</th>
                      <th className="p-2.5">Telefon</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {importedPreview.parsed.slice(0, 5).map((p, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="p-2.5 font-bold text-slate-900 dark:text-white">{p.fullName}</td>
                        <td className="p-2.5 text-slate-600 dark:text-slate-300">{p.nickname || '-'}</td>
                        <td className="p-2.5 text-emerald-600 font-semibold">{p.position || '-'}</td>
                        <td className="p-2.5 font-mono text-slate-700 dark:text-slate-300">{p.studentId}</td>
                        <td className="p-2.5 font-mono font-bold text-emerald-600">{p.icLast4}</td>
                        <td className="p-2.5 text-slate-500 font-mono">{p.gmail || '-'}</td>
                        <td className="p-2.5 text-slate-500 font-mono">{p.phone}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {importedPreview.parsed.length > 5 && (
                  <div className="p-2 text-center text-[11px] text-slate-400 bg-slate-50 dark:bg-slate-800/40">
                    + {importedPreview.parsed.length - 5} rekod lagi sedia diimport
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Directory of People / Students in Database */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-emerald-600" />
                  <span>Direktori Pelajar & Kredensial Log Masuk ({filteredStudents.length})</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Pelajar boleh log masuk ke Portal Ketua Unit menggunakan <strong>No. ID Pelajar</strong>, <strong>4 Digit No. IC</strong>, atau <strong>Gmail</strong>.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="relative w-64">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    placeholder="Cari nama, ID, IC, Gmail..."
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                  />
                </div>
                {safePeople.filter((p) => p.role !== 'ADMIN').length > 0 && (
                  <button
                    onClick={handleClearAllStudents}
                    className="py-2 px-3 rounded-xl border border-rose-200 dark:border-rose-900/60 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs font-bold flex items-center gap-1.5 transition shrink-0"
                    title="Padam semua data pelajar semasa"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Kosongkan Senarai</span>
                  </button>
                )}
              </div>
            </div>

            {/* Students Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/70 text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-3">Nama & Panggilan</th>
                    <th className="p-3">Jawatan / Portfolio</th>
                    <th className="p-3">No. ID Pelajar</th>
                    <th className="p-3">4 Digit No. IC</th>
                    <th className="p-3">Gmail Pelajar</th>
                    <th className="p-3">No. Telefon</th>
                    <th className="p-3">Program & Sem</th>
                    <th className="p-3 text-right">Tindakan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredStudents.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                      <td className="p-3">
                        <div className="font-bold text-slate-900 dark:text-white">{p.fullName}</div>
                        {p.nickname && (
                          <span className="text-[10px] text-slate-500">Panggilan: {p.nickname}</span>
                        )}
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-200 dark:border-emerald-800">
                          {p.position || p.department || (p.role === 'ADMIN' ? 'Pentadbir' : 'Ketua Unit')}
                        </span>
                      </td>
                      <td className="p-3 font-mono font-bold text-slate-800 dark:text-slate-200">
                        {p.studentId}
                      </td>
                      <td className="p-3 font-mono">
                        <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-bold text-emerald-600 dark:text-emerald-400">
                          {p.icLast4}
                        </span>
                      </td>
                      <td className="p-3">
                        {p.gmail ? (
                          <span className="text-slate-700 dark:text-slate-300 font-mono text-[11px] flex items-center gap-1">
                            <Mail className="w-3 h-3 text-rose-500 shrink-0" />
                            <span>{p.gmail}</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">-</span>
                        )}
                      </td>
                      <td className="p-3 font-mono text-slate-600 dark:text-slate-400">
                        {p.phone || '-'}
                      </td>
                      <td className="p-3 text-slate-500">
                        <div>{p.programStudy || 'DLM'}</div>
                        <div className="text-[10px] text-slate-400">{p.semester || 'Sem 3'}</div>
                      </td>
                      <td className="p-3 text-right">
                        {p.role !== 'ADMIN' && (
                          <button
                            onClick={() => handleDeleteStudent(p)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                            title="Padam Rekod"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredStudents.length === 0 && (
                <div className="p-10 text-center text-slate-400 text-xs bg-slate-50/50 dark:bg-slate-800/30 space-y-2">
                  <Users className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
                  <p className="font-semibold text-slate-600 dark:text-slate-300">
                    {studentSearch
                      ? `Tiada rekod pelajar dijumpai untuk carian "${studentSearch}".`
                      : 'Pangkalan data kosong (Tiada data pelajar semasa).'}
                  </p>
                  <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                    {studentSearch
                      ? 'Sila bersihkan kotak carian untuk melihat semua rekod.'
                      : 'Sila muat naik fail .CSV atau gunakan butang "Tambah Pelajar Manual" di atas untuk mendaftarkan pelajar baharu.'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Manual Add Student Modal */}
      {isAddStudentOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsAddStudentOpen(false)}
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
                <Plus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Daftar Pelajar / Ketua Unit Baru
                </h3>
                <p className="text-xs text-slate-500">
                  Maklumat disimpan terus ke pangkalan data dan tersedia untuk lantikan.
                </p>
              </div>
            </div>

            <form onSubmit={handleAddStudentSubmit} className="space-y-3.5">
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
                    placeholder="PDL-2502-078"
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    4 Digit Terakhir IC <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    maxLength={4}
                    required
                    value={newIcLast4}
                    onChange={(e) => setNewIcLast4(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="0480"
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white font-mono text-center tracking-widest font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    No. Kad Pengenalan Penuh
                  </label>
                  <input
                    type="text"
                    value={newIcNumber}
                    onChange={(e) => setNewIcNumber(e.target.value)}
                    placeholder="071012-14-0480"
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white font-mono"
                  />
                </div>

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
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Telefon (WhatsApp)
                  </label>
                  <input
                    type="text"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="016-4976385"
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Program Pengajian
                  </label>
                  <input
                    type="text"
                    value={newProgramStudy}
                    onChange={(e) => setNewProgramStudy(e.target.value)}
                    placeholder="DLM / DIA"
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Semester
                  </label>
                  <input
                    type="text"
                    value={newSemester}
                    onChange={(e) => setNewSemester(e.target.value)}
                    placeholder="Semester 3"
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddStudentOpen(false)}
                  className="py-2.5 px-4 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-5 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-md hover:bg-emerald-700 transition"
                >
                  Simpan Pelajar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB 1: Categories */}
      {activeTab === 'categories' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Header Action Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center shrink-0">
                <FolderTree className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Pengurusan Kategori Utama ({categories.length})</span>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold border border-emerald-200 dark:border-emerald-800">
                    Boleh Ditambah, Diedit & Dipadam
                  </span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Kategori induk digunakan semasa penciptaan program baharu dan menstrukturkan templat blueprint urusetia.
                </p>
              </div>
            </div>

            <button
              onClick={handleOpenAddCategory}
              className="py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Kategori Baru</span>
            </button>
          </div>

          {/* Categories Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((c) => {
              const matchingTemplatesCount = templates.filter((t) => t.categoryId === c.id).length;
              return (
                <div
                  key={c.id}
                  className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between group hover:border-amber-400 dark:hover:border-amber-600 transition"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div
                        className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-inner"
                        style={{
                          backgroundColor: `${c.color || '#d97706'}18`,
                          color: c.color || '#d97706',
                          borderColor: `${c.color || '#d97706'}35`,
                          borderWidth: 1,
                        }}
                      >
                        <IconRenderer name={c.icon} className="w-5 h-5" />
                      </div>

                      {/* Action Buttons: Edit & Delete */}
                      <div className="flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition">
                        <button
                          onClick={() => handleOpenEditCategory(c)}
                          className="p-2 rounded-xl text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 border border-slate-200 dark:border-slate-700 transition"
                          title={`Edit Kategori: ${c.name}`}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleRequestDeleteCategory(c)}
                          className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-slate-200 dark:border-slate-700 transition"
                          title={`Padam Kategori: ${c.name}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                      <span>{c.name}</span>
                    </h4>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed line-clamp-3">
                      {c.description || 'Tiada penerangan.'}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                    <span className="font-mono text-[10px] text-slate-400">ID: {c.id}</span>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                        {matchingTemplatesCount} Templat
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                          c.status === 'ACTIVE'
                            ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {c.status === 'ACTIVE' ? 'Aktif' : 'Arkib'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {categories.length === 0 && (
            <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700 space-y-3">
              <FolderTree className="w-12 h-12 text-slate-400 mx-auto" />
              <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">
                Tiada Kategori Utama Ditemui
              </h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Kategori utama diperlukan untuk menjana templat program. Sila klik butang di bawah untuk menambah kategori pertama anda.
              </p>
              <button
                onClick={handleOpenAddCategory}
                className="py-2.5 px-5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs inline-flex items-center gap-2 shadow-xs transition"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Kategori Sekarang</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Category Modal (Add / Edit) */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsCategoryModalOpen(false)}
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div
                className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-inner"
                style={{
                  backgroundColor: `${catColor}20`,
                  color: catColor,
                  borderColor: `${catColor}40`,
                  borderWidth: 1,
                }}
              >
                <IconRenderer name={catIcon} className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {editingCategoryId ? 'Kemaskini Kategori Utama' : 'Tambah Kategori Utama Baharu'}
                </h3>
                <p className="text-xs text-slate-500">
                  {editingCategoryId
                    ? 'Ubah suai nama, ikon, warna tema atau huraian kategori.'
                    : 'Daftar kategori induk baharu bagi pengelasan blueprint program.'}
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveCategorySubmit} className="space-y-4">
              {/* Category Name */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Kategori <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  placeholder="cth: Program Teater & Kebudayaan"
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white font-semibold"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Keterangan Kategori
                </label>
                <textarea
                  rows={2}
                  value={catDescription}
                  onChange={(e) => setCatDescription(e.target.value)}
                  placeholder="cth: Pengurusan persembahan pentas, set & props, audio visual, busana, tiket dan publisiti."
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white resize-none"
                />
              </div>

              {/* Icon Selector */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>Pilih Ikon Simbol</span>
                  <span className="text-[10px] text-slate-400 font-mono">Ikon Terpilih: {catIcon}</span>
                </label>
                <div className="grid grid-cols-10 gap-1.5 p-2 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 max-h-36 overflow-y-auto">
                  {categoryIconOptions.map((iconName) => (
                    <button
                      key={iconName}
                      type="button"
                      onClick={() => setCatIcon(iconName)}
                      className={`p-2 rounded-xl flex items-center justify-center transition ${
                        catIcon === iconName
                          ? 'bg-amber-600 text-white shadow-xs scale-105'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                      title={iconName}
                    >
                      <IconRenderer name={iconName} className="w-4 h-4" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Theme Color Selector */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>Warna Tema Kategori</span>
                  <span className="text-[10px] text-slate-400 font-mono">{catColor}</span>
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  {categoryColorOptions.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setCatColor(c.value)}
                      className={`h-8 px-3 rounded-xl text-xs font-semibold flex items-center gap-2 border transition ${
                        catColor === c.value
                          ? 'border-slate-900 dark:border-white shadow-xs font-bold scale-105'
                          : 'border-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span className={`w-3.5 h-3.5 rounded-full ${c.bgClass}`} />
                      <span>{c.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Status Selector */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <div>
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200">Status Kategori</div>
                  <div className="text-[10px] text-slate-400">
                    Kategori aktif akan muncul dalam senarai pilihan semasa mencipta program baharu.
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCatStatus('ACTIVE')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                      catStatus === 'ACTIVE'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Aktif
                  </button>
                  <button
                    type="button"
                    onClick={() => setCatStatus('ARCHIVED')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                      catStatus === 'ARCHIVED'
                        ? 'bg-slate-700 text-white shadow-xs'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Arkib
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="py-2.5 px-4 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md transition flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>{editingCategoryId ? 'Simpan Perubahan' : 'Tambah Kategori'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Delete Confirmation Popup Modal ("Adakah Anda Pasti?") */}
      {categoryToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 relative animate-scaleUp">
            <button
              onClick={() => setCategoryToDelete(null)}
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title="Tutup"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Warning Icon Badge */}
            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-7 h-7" />
            </div>

            {/* Modal Heading */}
            <div className="text-center mb-5">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Adakah Anda Pasti?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Tindakan ini akan memadam kategori utama secara kekal daripada sistem urusetia.
              </p>
            </div>

            {/* Category Card Preview */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 mb-5 space-y-2.5">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shadow-xs shrink-0"
                  style={{
                    backgroundColor: `${categoryToDelete.color || '#e11d48'}20`,
                    color: categoryToDelete.color || '#e11d48',
                    borderColor: `${categoryToDelete.color || '#e11d48'}40`,
                    borderWidth: 1,
                  }}
                >
                  <IconRenderer name={categoryToDelete.icon || 'FolderTree'} className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                    {categoryToDelete.name}
                  </h4>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="font-mono text-[10px] text-slate-400">ID: {categoryToDelete.id}</span>
                    <span
                      className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                        categoryToDelete.status === 'ACTIVE'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {categoryToDelete.status === 'ACTIVE' ? 'Aktif' : 'Arkib'}
                    </span>
                  </div>
                </div>
              </div>

              {categoryToDelete.description && (
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-200 dark:border-slate-700/60 pt-2">
                  {categoryToDelete.description}
                </p>
              )}

              {/* Associated Templates Alert */}
              {(() => {
                const linkedTemplates = templates.filter((t) => t.categoryId === categoryToDelete.id);
                if (linkedTemplates.length > 0) {
                  return (
                    <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-[11px] space-y-1">
                      <div className="font-bold flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>Amaran: {linkedTemplates.length} Templat Terlibat</span>
                      </div>
                      <p className="text-[10px] text-amber-700 dark:text-amber-400 leading-tight">
                        Kategori ini dihubungkan dengan templat:{' '}
                        <strong>{linkedTemplates.map((t) => t.name).join(', ')}</strong>.
                      </p>
                    </div>
                  );
                }
                return null;
              })()}
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setCategoryToDelete(null)}
                className="py-2.5 px-4 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition text-center"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteCategory}
                className="py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Ya, Padam Kategori</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Program Templates */}
      {activeTab === 'templates' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Top Banner Action */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center shrink-0">
                <FileCode className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Pengurusan Blueprint Template ({templates.length})</span>
                  <span className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold border border-indigo-200 dark:border-indigo-800">
                    Boleh Ditambah, Diubah & Dipadam
                  </span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Setiap templat mengandungi unit-unit kerja piawai berserta senarai semak wajib untuk diwarisi oleh program baharu.
                </p>
              </div>
            </div>

            <button
              onClick={handleOpenAddTemplate}
              className="py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Template Baru</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Template Selector List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Senarai Blueprint
                </h3>
                <span className="text-[10px] text-slate-400 font-mono">{templates.length} templat</span>
              </div>

              <div className="space-y-2 max-h-[620px] overflow-y-auto pr-1">
                {templates.map((t) => {
                  const parentCat = categories.find((c) => c.id === t.categoryId);
                  const isSelected = selectedTemplate?.id === t.id;
                  return (
                    <div
                      key={t.id}
                      onClick={() => setSelectedTemplateId(t.id)}
                      className={`w-full text-left p-4 rounded-2xl border transition cursor-pointer relative group ${
                        isSelected
                          ? 'bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-500 shadow-xs'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-snug">
                          {t.name}
                        </p>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition shrink-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEditTemplate(t);
                            }}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition"
                            title="Edit Templat"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDuplicateTemplate(t);
                            }}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 transition"
                            title="Salin Templat"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteTemplate(t);
                            }}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition"
                            title="Padam Templat"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <span
                          className="px-2 py-0.5 rounded-md text-[10px] font-bold"
                          style={{
                            backgroundColor: `${parentCat?.color || '#4f46e5'}18`,
                            color: parentCat?.color || '#4f46e5',
                          }}
                        >
                          {parentCat?.name || t.categoryId}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {t.units.length} Unit
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {t.version || 'v1.0'}
                        </span>
                        <span
                          className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                            t.status === 'ACTIVE'
                              ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                          }`}
                        >
                          {t.status}
                        </span>
                      </div>
                    </div>
                  );
                })}

                {templates.length === 0 && (
                  <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
                    <p className="text-xs text-slate-500">Tiada templat ditemui.</p>
                    <button
                      onClick={handleOpenAddTemplate}
                      className="mt-2 text-xs font-bold text-indigo-600 hover:underline"
                    >
                      + Tambah templat pertama
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Template Units Inspection & Detailed Editor */}
            <div className="lg:col-span-2 space-y-4">
              {selectedTemplate ? (
                <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
                  {/* Selected Template Header & Actions */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                    <div>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="px-2.5 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-xs font-bold border border-indigo-200 dark:border-indigo-800">
                          {selectedTemplate.version || 'v1.0'}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            selectedTemplate.status === 'ACTIVE'
                              ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                          }`}
                        >
                          {selectedTemplate.status}
                        </span>
                        <span className="text-xs text-slate-400 font-mono">
                          ID: {selectedTemplate.id}
                        </span>
                      </div>
                      <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                        {selectedTemplate.name}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        {selectedTemplate.description || 'Tiada keterangan disediakan bagi blueprint ini.'}
                      </p>
                    </div>

                    {/* Actions on this Template */}
                    <div className="flex items-center gap-2 flex-wrap shrink-0">
                      <button
                        onClick={() => handleOpenEditTemplate(selectedTemplate)}
                        className="py-2 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 transition"
                        title="Edit Maklumat Template"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Edit Info</span>
                      </button>
                      <button
                        onClick={() => handleDuplicateTemplate(selectedTemplate)}
                        className="py-2 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 transition"
                        title="Salin Blueprint Template Ini"
                      >
                        <Copy className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Salin</span>
                      </button>
                      <button
                        onClick={() => handleDeleteTemplate(selectedTemplate)}
                        className="py-2 px-3 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-xs font-bold text-rose-700 dark:text-rose-300 flex items-center gap-1.5 transition"
                        title="Padam Template Ini"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Padam</span>
                      </button>
                    </div>
                  </div>

                  {/* Units Section Header & Add Unit Button */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <span>Unit-Unit Kerja Piawai ({selectedTemplate.units.length})</span>
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Unit-unit ini akan diwujudkan secara automatik apabila pengguna mencipta program menggunakan templat ini.
                      </p>
                    </div>
                    <button
                      onClick={() => handleOpenAddUnit(selectedTemplate.id)}
                      className="py-2 px-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Tambah Unit</span>
                    </button>
                  </div>

                  {/* Units List */}
                  <div className="space-y-4 max-h-[580px] overflow-y-auto pr-1">
                    {selectedTemplate.units.map((u) => (
                      <div
                        key={u.id}
                        className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 text-xs space-y-3 hover:border-slate-300 dark:hover:border-slate-600 transition"
                      >
                        {/* Unit Title & Controls */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2.5 flex-wrap">
                            <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center shrink-0">
                              <IconRenderer name={u.icon} className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                                  {u.name}
                                </span>
                                <PriorityBadge priority={u.priority} />
                              </div>
                              {u.description && (
                                <p className="text-[11px] text-slate-500 mt-0.5">{u.description}</p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => handleOpenEditUnit(selectedTemplate.id, u)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-white dark:hover:bg-slate-700 border border-transparent hover:border-slate-200 dark:hover:border-slate-600 transition"
                              title="Edit Unit"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteUnit(selectedTemplate.id, u.id)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-transparent hover:border-rose-200 dark:hover:border-rose-800 transition"
                              title="Padam Unit"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Requirements / Checklist Sub-Section */}
                        <div className="bg-white dark:bg-slate-900/80 p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                          <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 dark:text-slate-300 pb-1.5 border-b border-slate-100 dark:border-slate-800">
                            <span>Checklist & Syarat Kesediaan ({u.requirements.length})</span>
                            <span className="text-[10px] text-slate-400 font-normal">
                              Klik tag untuk tukar status wajib
                            </span>
                          </div>

                          <div className="space-y-1.5">
                            {u.requirements.map((req) => (
                              <div
                                key={req.id}
                                className="flex items-center justify-between gap-2 p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/70 transition group text-[11px]"
                              >
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  <CheckSquare className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                  <span className="text-slate-800 dark:text-slate-200 truncate">
                                    {req.title}
                                  </span>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleToggleRequirementRequired(
                                        selectedTemplate.id,
                                        u.id,
                                        req.id
                                      )
                                    }
                                    className={`px-2 py-0.5 rounded text-[9px] font-bold transition cursor-pointer ${
                                      req.required
                                        ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-300 border border-rose-200 dark:border-rose-800 hover:bg-rose-100'
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'
                                    }`}
                                    title="Klik untuk ubah Wajib / Pilihan"
                                  >
                                    {req.required ? 'Wajib' : 'Pilihan'}
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleDeleteRequirement(selectedTemplate.id, u.id, req.id)
                                    }
                                    className="text-slate-400 hover:text-rose-500 p-1 opacity-0 group-hover:opacity-100 transition"
                                    title="Padam checklist ini"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            ))}

                            {u.requirements.length === 0 && (
                              <p className="text-[11px] text-slate-400 italic py-1">
                                Tiada senarai semak. Sila tambah di bawah.
                              </p>
                            )}
                          </div>

                          {/* Quick Add Requirement input */}
                          <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-2">
                            <input
                              type="text"
                              placeholder="Tambah checklist baru cth: Laporan kewangan akhir..."
                              value={inlineReqTexts[u.id] || ''}
                              onChange={(e) =>
                                setInlineReqTexts((prev) => ({ ...prev, [u.id]: e.target.value }))
                              }
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleQuickAddRequirement(selectedTemplate.id, u.id);
                                }
                              }}
                              className="flex-1 p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                            />

                            <label className="flex items-center gap-1 text-[11px] text-slate-600 dark:text-slate-400 cursor-pointer shrink-0">
                              <input
                                type="checkbox"
                                checked={inlineReqRequired[u.id] !== false}
                                onChange={(e) =>
                                  setInlineReqRequired((prev) => ({
                                    ...prev,
                                    [u.id]: e.target.checked,
                                  }))
                                }
                                className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                              />
                              <span>Wajib</span>
                            </label>

                            <button
                              type="button"
                              onClick={() => handleQuickAddRequirement(selectedTemplate.id, u.id)}
                              className="py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white font-bold text-xs flex items-center gap-1 shrink-0 transition"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Tambah</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}

                    {selectedTemplate.units.length === 0 && (
                      <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 space-y-2">
                        <p className="text-xs text-slate-500">
                          Templat ini belum mempunyai sebarang unit kerja piawai.
                        </p>
                        <button
                          onClick={() => handleOpenAddUnit(selectedTemplate.id)}
                          className="py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs inline-flex items-center gap-1.5"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Tambah Unit Pertama</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-white dark:bg-slate-900 p-12 text-center rounded-3xl border border-slate-200 dark:border-slate-800">
                  <FileCode className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                  <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">
                    Pilih atau Tambah Blueprint Template
                  </h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                    Sila pilih templat daripada senarai di sebelah kiri atau bina templat baharu.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Blueprint Template Modal (Add / Edit Header) */}
      {isTemplateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsTemplateModalOpen(false)}
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-11 h-11 rounded-2xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 flex items-center justify-center shadow-inner">
                <FileCode className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {editingTemplateId ? 'Kemaskini Blueprint Template' : 'Tambah Blueprint Template Baharu'}
                </h3>
                <p className="text-xs text-slate-500">
                  {editingTemplateId
                    ? 'Ubah suai nama, kategori atau status blueprint program.'
                    : 'Bina blueprint templat program baharu untuk urusetia.'}
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveTemplateSubmit} className="space-y-4">
              {/* Template Name */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Blueprint Template <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={tplName}
                  onChange={(e) => setTplName(e.target.value)}
                  placeholder="cth: Pengurusan Karnival & Festival Kampus"
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white font-semibold"
                />
              </div>

              {/* Category Selection */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Kategori Induk <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={tplCategoryId}
                  onChange={(e) => setTplCategoryId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white font-semibold"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.id})
                    </option>
                  ))}
                </select>
              </div>

              {/* Version & Status */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Versi Blueprint
                  </label>
                  <input
                    type="text"
                    value={tplVersion}
                    onChange={(e) => setTplVersion(e.target.value)}
                    placeholder="v1.0"
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Status Templat
                  </label>
                  <select
                    value={tplStatus}
                    onChange={(e) => setTplStatus(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white font-semibold"
                  >
                    <option value="ACTIVE">Aktif (ACTIVE)</option>
                    <option value="DRAFT">Draf (DRAFT)</option>
                    <option value="ARCHIVED">Arkib (ARCHIVED)</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Penerangan Ringkas
                </label>
                <textarea
                  rows={3}
                  value={tplDescription}
                  onChange={(e) => setTplDescription(e.target.value)}
                  placeholder="cth: Mengandungi struktur unit pengurusan, teknikal, keselamatan, tajaan dan checklist gerak kerja lengkap."
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white resize-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsTemplateModalOpen(false)}
                  className="py-2.5 px-4 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>{editingTemplateId ? 'Simpan Perubahan' : 'Bina Template'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Unit Modal (Add / Edit Unit in Blueprint) */}
      {isUnitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsUnitModalOpen(false)}
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-11 h-11 rounded-2xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 flex items-center justify-center shadow-inner">
                <IconRenderer name={unitIcon} className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {editingUnitId ? 'Kemaskini Unit Blueprint' : 'Tambah Unit Baharu ke Blueprint'}
                </h3>
                <p className="text-xs text-slate-500">
                  Tetapkan nama unit kerja, tahap keutamaan dan ikon simbol.
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveUnitSubmit} className="space-y-4">
              {/* Unit Name */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Unit <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={unitName}
                  onChange={(e) => setUnitName(e.target.value)}
                  placeholder="cth: Unit Logistik & Keselamatan"
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white font-semibold"
                />
              </div>

              {/* Priority */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Tahap Keutamaan Unit
                </label>
                <select
                  value={unitPriority}
                  onChange={(e) => setUnitPriority(e.target.value as PriorityLevel)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white font-semibold"
                >
                  <option value="CRITICAL">Kritikal (CRITICAL)</option>
                  <option value="HIGH">Tinggi (HIGH)</option>
                  <option value="MEDIUM">Sederhana (MEDIUM)</option>
                  <option value="LOW">Rendah (LOW)</option>
                </select>
              </div>

              {/* Icon Selector */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>Pilih Ikon Simbol Unit</span>
                  <span className="text-[10px] text-slate-400 font-mono">Ikon: {unitIcon}</span>
                </label>
                <div className="grid grid-cols-10 gap-1.5 p-2 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 max-h-32 overflow-y-auto">
                  {categoryIconOptions.map((iconName) => (
                    <button
                      key={iconName}
                      type="button"
                      onClick={() => setUnitIcon(iconName)}
                      className={`p-2 rounded-xl flex items-center justify-center transition ${
                        unitIcon === iconName
                          ? 'bg-indigo-600 text-white shadow-xs scale-105'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                      title={iconName}
                    >
                      <IconRenderer name={iconName} className="w-4 h-4" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Unit Description */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Keterangan / Skop Tugas Unit
                </label>
                <textarea
                  rows={2}
                  value={unitDescription}
                  onChange={(e) => setUnitDescription(e.target.value)}
                  placeholder="cth: Bertanggungjawab mengurus susun atur ruang, peralatan teknikal dan kawalan keselamatan."
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white resize-none"
                />
              </div>

              {/* Initial Requirements Builder (When creating unit) */}
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2">
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  Senarai Checklist Syarat ({unitRequirementsList.length})
                </label>

                <div className="space-y-1.5 max-h-32 overflow-y-auto">
                  {unitRequirementsList.map((req, idx) => (
                    <div
                      key={req.id || idx}
                      className="flex items-center justify-between gap-2 p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs"
                    >
                      <span className="truncate text-[11px] text-slate-800 dark:text-slate-200">
                        {req.title}
                      </span>
                      <div className="flex items-center gap-1 shrink-0">
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                            req.required
                              ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-300'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {req.required ? 'Wajib' : 'Pilihan'}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setUnitRequirementsList((prev) => prev.filter((_, i) => i !== idx))
                          }
                          className="text-slate-400 hover:text-rose-500 p-1"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add new requirement draft */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    placeholder="Checklist baru..."
                    value={newReqDraftTitle}
                    onChange={(e) => setNewReqDraftTitle(e.target.value)}
                    className="flex-1 p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                  />
                  <label className="flex items-center gap-1 text-[11px] text-slate-600 dark:text-slate-400">
                    <input
                      type="checkbox"
                      checked={newReqDraftRequired}
                      onChange={(e) => setNewReqDraftRequired(e.target.checked)}
                      className="rounded text-indigo-600 w-3.5 h-3.5"
                    />
                    <span>Wajib</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      if (newReqDraftTitle.trim()) {
                        setUnitRequirementsList((prev) => [
                          ...prev,
                          {
                            id: `req-${Date.now()}-${prev.length + 1}`,
                            title: newReqDraftTitle.trim(),
                            required: newReqDraftRequired,
                            priority: unitPriority,
                            sortOrder: prev.length + 1,
                          },
                        ]);
                        setNewReqDraftTitle('');
                      }
                    }}
                    className="py-1.5 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shrink-0"
                  >
                    Tambah
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsUnitModalOpen(false)}
                  className="py-2.5 px-4 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>{editingUnitId ? 'Simpan Perubahan' : 'Tambah Unit'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB 3: Backup & Data Reset & PWA System Status */}
      {activeTab === 'backup' && (
        <div className="space-y-6">
          {/* Cloud Database & PWA System Capabilities Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Firebase Cloud Firestore Card */}
            <div className="p-6 rounded-3xl bg-linear-to-r from-slate-900 via-amber-950 to-slate-900 text-white border border-amber-500/30 shadow-lg flex flex-col justify-between">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0">
                  <Flame className="w-6 h-6 text-amber-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-base font-bold text-white">Firebase Cloud Firestore</h4>
                    <span className="px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-extrabold uppercase tracking-widest animate-pulse">
                      Tersambung
                    </span>
                  </div>
                  <p className="text-xs text-amber-200/80 mt-1">
                    Penyelarasan awan automatik masa-nyata (Realtime Sync). Sebarang perubahan data pelajar, kemas kini kesiapsiagaan unit, dan templat diselaraskan serta-merta merentas peranti.
                  </p>
                  <div className="flex flex-wrap gap-2 mt-3 text-[11px] font-mono text-amber-300">
                    <span className="px-2 py-0.5 rounded-md bg-amber-900/60 border border-amber-700/50">🔥 Firestore Live Sync</span>
                    <span className="px-2 py-0.5 rounded-md bg-amber-900/60 border border-amber-700/50">☁️ Multi-Device Auto-Backup</span>
                    <span className="px-2 py-0.5 rounded-md bg-amber-900/60 border border-amber-700/50">🛡️ Cloud Security Rules</span>
                  </div>
                </div>
              </div>
            </div>

            {/* PWA & System Capabilities Card */}
            <div className="p-6 rounded-3xl bg-linear-to-r from-slate-900 via-emerald-950 to-slate-900 text-white border border-emerald-500/30 shadow-lg flex flex-col justify-between">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0">
                  <Smartphone className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-base font-bold text-white">PWA &amp; OGI Visual Ready</h4>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-extrabold uppercase tracking-widest">
                      Aktif
                    </span>
                  </div>
                  <p className="text-xs text-emerald-200/80 mt-1">
                    Service Worker (Luar Talian), Web App Manifest (`standalone`), ikon iOS, dan banner Open Graph Image (1200x630) untuk perkongsian sosial.
                  </p>
                  <div className="flex flex-wrap gap-2 mt-3 text-[11px] font-mono text-emerald-300">
                    <span className="px-2 py-0.5 rounded-md bg-emerald-900/60 border border-emerald-700/50">⚡ manifest.webmanifest</span>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-900/60 border border-emerald-700/50">🛡️ sw.js (Offline)</span>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-900/60 border border-emerald-700/50">🖼️ og:image (1200x630)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
              <div>
                <Download className="w-8 h-8 text-emerald-600 mb-3" />
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">Eksport Sandaran JSON</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Muat turun fail sandaran lengkap mengandungi semua program, template, unit, ketua dan log aktiviti.
                </p>
              </div>
              <button
                onClick={handleExportBackup}
                className="mt-4 w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md"
              >
                <Download className="w-4 h-4" />
                <span>Muat Turun Fail .JSON</span>
              </button>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
              <div>
                <Upload className="w-8 h-8 text-indigo-600 mb-3" />
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">Import Sandaran JSON</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Muat naik fail sandaran JSON untuk memulihkan keseluruhan pangkalan data sistem.
                </p>
              </div>
              <label className="mt-4 w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md cursor-pointer">
                <Upload className="w-4 h-4" />
                <span>Pilih Fail JSON</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportBackup}
                  className="hidden"
                />
              </label>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
              <div>
                <RotateCcw className="w-8 h-8 text-rose-600 mb-3" />
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">Set Semula ke Seed Data</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Padam semua data ujian dan kembalikan kepada data demo asal (Pertandingan Teater &amp; Pasar Malam).
                </p>
              </div>
              <button
                onClick={handleResetData}
                className="mt-4 w-full py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Set Semula Sekarang</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
