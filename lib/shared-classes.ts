import fs from "fs";
import path from "path";

export interface SharedClassRecord {
  id: string;
  name: string;
  nama_kelas?: string;
  mapel: string;
  mata_pelajaran?: string;
  section?: string;
  room?: string;
  ruang?: string;
  subjectCode: string;
  kode_kelas?: string;
  themeColor: string;
  banner_color?: string;
  bgGradient: string;
  bannerType: "illustration" | "photo";
  bannerIllustration: string;
  banner_pattern?: string;
  bannerPhotoUrl?: string;
  teacherName?: string;
  nama_guru?: string;
  studentCount?: number;
  description?: string;
}

const DATA_DIR = path.join(process.cwd(), "data");
const CLASSES_FILE = path.join(DATA_DIR, "classes_registry.json");
const DELETED_CLASSES_FILE = path.join(DATA_DIR, "deleted_classes.json");
const ARCHIVED_CLASSES_FILE = path.join(DATA_DIR, "archived_classes.json");

export interface ArchivedClassRecord {
  id: string;
  name?: string;
  subjectCode?: string;
  kode_kelas?: string;
  archivedAt: string;
}

export function getArchivedClassRecords(): ArchivedClassRecord[] {
  try {
    if (fs.existsSync(ARCHIVED_CLASSES_FILE)) {
      const content = fs.readFileSync(ARCHIVED_CLASSES_FILE, "utf8");
      const list = JSON.parse(content);
      if (Array.isArray(list)) return list;
    }
  } catch (err) {
    console.warn("[SHARED CLASSES] Gagal membaca archived_classes.json:", err);
  }
  return [];
}

export function getArchivedClassIds(): string[] {
  const records = getArchivedClassRecords();
  const ids: string[] = [];
  for (const r of records) {
    if (r.id) ids.push(r.id.toLowerCase());
    if (r.subjectCode) ids.push(r.subjectCode.toLowerCase());
    if (r.kode_kelas) ids.push(r.kode_kelas.toLowerCase());
    if (r.name) ids.push(r.name.toLowerCase());
  }
  return Array.from(new Set(ids));
}

export function isClassArchived(identifier: string): boolean {
  if (!identifier) return false;
  const clean = identifier.toLowerCase().trim();
  const archived = getArchivedClassIds();
  return archived.some((a) => a === clean || (a.length > 3 && clean.includes(a)));
}

export function archiveSharedClass(classIdOrCode: string): boolean {
  ensureDataFile();
  if (!classIdOrCode) return false;
  const clean = classIdOrCode.toLowerCase().trim();
  const current = getAllSharedClasses();

  const target = current.find(
    (c) =>
      c.id.toLowerCase() === clean ||
      (c.subjectCode && c.subjectCode.toLowerCase() === clean) ||
      (c.kode_kelas && c.kode_kelas.toLowerCase() === clean) ||
      (c.name && c.name.toLowerCase() === clean) ||
      (clean.includes("ipa") && (c.id.includes("ipa") || c.mapel.toLowerCase().includes("ipa"))) ||
      (clean.includes("mat") && (c.id.includes("mat") || c.mapel.toLowerCase().includes("mat")))
  );

  const matchedId = target ? target.id : classIdOrCode;
  const targetCode = target?.subjectCode || target?.kode_kelas;
  const targetName = target?.name || target?.nama_kelas;

  try {
    const existing = getArchivedClassRecords();
    const newRecord: ArchivedClassRecord = {
      id: matchedId,
      name: targetName,
      subjectCode: targetCode || (clean.length < 15 ? clean : undefined),
      kode_kelas: targetCode || (clean.length < 15 ? clean : undefined),
      archivedAt: new Date().toISOString(),
    };
    const nextList = [
      newRecord,
      ...existing.filter(
        (a) => a.id.toLowerCase() !== matchedId.toLowerCase() && a.id.toLowerCase() !== clean
      ),
    ];
    fs.writeFileSync(ARCHIVED_CLASSES_FILE, JSON.stringify(nextList, null, 2), "utf8");
    return true;
  } catch (err) {
    console.warn("[SHARED CLASSES] Gagal menyimpan archived class:", err);
    return false;
  }
}

export function restoreSharedClass(classIdOrCode: string): boolean {
  ensureDataFile();
  if (!classIdOrCode) return false;
  const clean = classIdOrCode.toLowerCase().trim();
  try {
    const existing = getArchivedClassRecords();
    const nextList = existing.filter((a) => {
      const aId = a.id.toLowerCase();
      const aCode = (a.subjectCode || "").toLowerCase();
      const aKode = (a.kode_kelas || "").toLowerCase();
      const aName = (a.name || "").toLowerCase();
      if (aId === clean || aId.includes(clean) || clean.includes(aId)) return false;
      if (aCode && (aCode === clean || aCode.includes(clean) || clean.includes(aCode))) return false;
      if (aKode && (aKode === clean || aKode.includes(clean) || clean.includes(aKode))) return false;
      if (aName && (aName === clean || clean.includes(aName))) return false;
      if (clean.includes("ipa") && (aId.includes("ipa") || aName.includes("ipa"))) return false;
      if (clean.includes("mat") && (aId.includes("mat") || aName.includes("mat"))) return false;
      return true;
    });
    fs.writeFileSync(ARCHIVED_CLASSES_FILE, JSON.stringify(nextList, null, 2), "utf8");
    return true;
  } catch (err) {
    console.warn("[SHARED CLASSES] Gagal restore archived class:", err);
    return false;
  }
}

export interface DeletedClassRecord {
  id: string;
  name?: string;
  subjectCode?: string;
  kode_kelas?: string;
  deletedAt: string;
}

export function getDeletedClassRecords(): DeletedClassRecord[] {
  try {
    if (fs.existsSync(DELETED_CLASSES_FILE)) {
      const content = fs.readFileSync(DELETED_CLASSES_FILE, "utf8");
      const list = JSON.parse(content);
      if (Array.isArray(list)) return list;
    }
  } catch (err) {
    console.warn("[SHARED CLASSES] Gagal membaca deleted_classes.json:", err);
  }
  return [];
}

export function getDeletedClassIds(): string[] {
  const records = getDeletedClassRecords();
  const ids: string[] = [];
  for (const r of records) {
    if (r.id) ids.push(r.id.toLowerCase());
    if (r.subjectCode) ids.push(r.subjectCode.toLowerCase());
    if (r.kode_kelas) ids.push(r.kode_kelas.toLowerCase());
    if (r.name) ids.push(r.name.toLowerCase());
  }
  return Array.from(new Set(ids));
}

export function isClassDeleted(identifier: string): boolean {
  if (!identifier) return false;
  const clean = identifier.toLowerCase().trim();
  const deleted = getDeletedClassIds();
  return deleted.some((d) => d === clean || (d.length > 3 && clean.includes(d)));
}

export const DEFAULT_CLASSES: SharedClassRecord[] = [
  {
    id: "mat-8",
    name: "Matematika (Kelas 8)",
    nama_kelas: "Matematika (Kelas 8)",
    mapel: "Matematika",
    mata_pelajaran: "Matematika",
    section: "Fase D • Kurikulum Merdeka",
    room: "Ruang 8-A",
    ruang: "Ruang 8-A",
    subjectCode: "mtk8xpk",
    kode_kelas: "mtk8xpk",
    themeColor: "#1967D2",
    banner_color: "#1967D2",
    bgGradient: "from-blue-700 via-indigo-700 to-slate-900",
    bannerType: "illustration",
    bannerIllustration: "math",
    banner_pattern: "matematika",
    bannerPhotoUrl: "",
    teacherName: "Ibu Siti Rahmawati, M.Pd.",
    nama_guru: "Ibu Siti Rahmawati, M.Pd.",
    studentCount: 32,
    description: "Aljabar, Teorema Pythagoras, Persamaan Linear, Statistika, Peluang & Penalaran Matematika.",
  },
  {
    id: "ipa-8",
    name: "IPA (Ilmu Pengetahuan Alam)",
    nama_kelas: "IPA (Ilmu Pengetahuan Alam)",
    mapel: "IPA",
    mata_pelajaran: "IPA",
    section: "Kelas 8 • Laboratorium Sains",
    room: "Lab IPA",
    ruang: "Lab IPA",
    subjectCode: "ipa8xpk",
    kode_kelas: "ipa8xpk",
    themeColor: "#0F9D58",
    banner_color: "#0F9D58",
    bgGradient: "from-emerald-600 via-teal-600 to-slate-950",
    bannerType: "illustration",
    bannerIllustration: "science",
    banner_pattern: "science",
    bannerPhotoUrl: "",
    teacherName: "Ibu Siti Rahmawati, M.Pd.",
    nama_guru: "Ibu Siti Rahmawati, M.Pd.",
    studentCount: 32,
    description: "Sistem Organisasi Kehidupan, Gerak dan Gaya, Usaha dan Energi, Struktur Bumi & Tata Surya.",
  },
];

let inMemoryClasses: SharedClassRecord[] = [...DEFAULT_CLASSES];

function ensureDataFile() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const deletedIds = new Set(getDeletedClassIds());
    if (!fs.existsSync(CLASSES_FILE)) {
      const activeDefaults = DEFAULT_CLASSES.filter(
        (c) =>
          !deletedIds.has(c.id.toLowerCase()) &&
          (!c.subjectCode || !deletedIds.has(c.subjectCode.toLowerCase()))
      );
      fs.writeFileSync(CLASSES_FILE, JSON.stringify(activeDefaults, null, 2), "utf8");
    }
    if (!fs.existsSync(DELETED_CLASSES_FILE)) {
      fs.writeFileSync(DELETED_CLASSES_FILE, JSON.stringify([], null, 2), "utf8");
    }
    if (!fs.existsSync(ARCHIVED_CLASSES_FILE)) {
      fs.writeFileSync(ARCHIVED_CLASSES_FILE, JSON.stringify([], null, 2), "utf8");
    }
  } catch (err) {
    console.warn("[SHARED CLASSES] Gagal inisialisasi file data:", err);
  }
}

export function getAllSharedClasses(): SharedClassRecord[] {
  try {
    ensureDataFile();
    const deletedIds = new Set(getDeletedClassIds());
    if (fs.existsSync(CLASSES_FILE)) {
      const content = fs.readFileSync(CLASSES_FILE, "utf8");
      const list = JSON.parse(content);
      if (Array.isArray(list)) {
        const filtered = list.filter((c: SharedClassRecord) => {
          if (deletedIds.has(c.id.toLowerCase())) return false;
          if (c.subjectCode && deletedIds.has(c.subjectCode.toLowerCase())) return false;
          if (c.kode_kelas && deletedIds.has(c.kode_kelas.toLowerCase())) return false;
          return true;
        });
        inMemoryClasses = filtered;
        return filtered;
      }
    }
  } catch (err) {
    console.warn("[SHARED CLASSES] Gagal membaca data kelas:", err);
  }
  return inMemoryClasses.filter((c) => !isClassDeleted(c.id));
}

export function deleteSharedClass(classIdOrToken: string): boolean {
  ensureDataFile();
  if (!classIdOrToken) return false;
  const clean = classIdOrToken.toLowerCase().trim();

  // 1. Ambil data saat ini
  let current: SharedClassRecord[] = [];
  try {
    if (fs.existsSync(CLASSES_FILE)) {
      current = JSON.parse(fs.readFileSync(CLASSES_FILE, "utf8"));
    }
  } catch {
    current = [...inMemoryClasses];
  }

  const target = current.find(
    (c) =>
      c.id.toLowerCase() === clean ||
      (c.subjectCode && c.subjectCode.toLowerCase() === clean) ||
      (c.kode_kelas && c.kode_kelas.toLowerCase() === clean) ||
      (c.name && c.name.toLowerCase() === clean) ||
      (clean.includes("ipa") && (c.id.includes("ipa") || c.mapel.toLowerCase().includes("ipa"))) ||
      (clean.includes("mat") && (c.id.includes("mat") || c.mapel.toLowerCase().includes("mat")))
  );

  const matchedId = target ? target.id : classIdOrToken;
  const targetCode = target?.subjectCode || target?.kode_kelas;
  const targetName = target?.name || target?.nama_kelas;

  // 2. Filter keluar kelas yang dihapus
  const updatedList = current.filter((c) => {
    if (c.id.toLowerCase() === clean || c.id.toLowerCase() === matchedId.toLowerCase()) return false;
    if (targetCode && (c.subjectCode?.toLowerCase() === targetCode.toLowerCase() || c.kode_kelas?.toLowerCase() === targetCode.toLowerCase())) return false;
    return true;
  });

  inMemoryClasses = updatedList;

  try {
    fs.writeFileSync(CLASSES_FILE, JSON.stringify(updatedList, null, 2), "utf8");
  } catch (err) {
    console.warn("[SHARED CLASSES] Gagal menulis ke CLASSES_FILE pasca delete:", err);
  }

  // 3. Rekam ke data/deleted_classes.json
  try {
    const existingDeleted = getDeletedClassRecords();
    const newRecord: DeletedClassRecord = {
      id: matchedId,
      name: targetName,
      subjectCode: targetCode || (clean.length < 15 ? clean : undefined),
      kode_kelas: targetCode || (clean.length < 15 ? clean : undefined),
      deletedAt: new Date().toISOString(),
    };

    const nextDeleted = [
      newRecord,
      ...existingDeleted.filter(
        (d) => d.id.toLowerCase() !== matchedId.toLowerCase() && d.id.toLowerCase() !== clean
      ),
    ];
    fs.writeFileSync(DELETED_CLASSES_FILE, JSON.stringify(nextDeleted, null, 2), "utf8");
  } catch (err) {
    console.warn("[SHARED CLASSES] Gagal update deleted_classes.json:", err);
  }

  // 3b. Hapus dari data/archived_classes.json jika ada
  try {
    const existingArchived = getArchivedClassRecords();
    const nextArchived = existingArchived.filter(
      (a) => a.id.toLowerCase() !== matchedId.toLowerCase() && a.id.toLowerCase() !== clean
    );
    fs.writeFileSync(ARCHIVED_CLASSES_FILE, JSON.stringify(nextArchived, null, 2), "utf8");
  } catch {}

  // 4. Update data/unenroll_requests.json: tandai semua request kelas ini sebagai approved
  try {
    const unenrollFile = path.join(DATA_DIR, "unenroll_requests.json");
    if (fs.existsSync(unenrollFile)) {
      const content = fs.readFileSync(unenrollFile, "utf8");
      const list = JSON.parse(content);
      if (Array.isArray(list)) {
        const updatedRequests = list.map((r: any) => {
          if (
            r.classId?.toLowerCase() === clean ||
            r.classId?.toLowerCase() === matchedId.toLowerCase() ||
            (targetName && r.className?.toLowerCase() === targetName.toLowerCase()) ||
            (targetCode && r.classId?.toLowerCase().includes(targetCode.toLowerCase()))
          ) {
            return {
              ...r,
              status: "approved",
              processedAt: new Date().toISOString(),
              autoDeleted: true,
            };
          }
          return r;
        });
        fs.writeFileSync(unenrollFile, JSON.stringify(updatedRequests, null, 2), "utf8");
      }
    }
  } catch (err) {
    console.warn("[SHARED CLASSES] Gagal update unenroll requests pasca delete:", err);
  }

  return true;
}

export function saveSharedClass(newClass: Partial<SharedClassRecord>): SharedClassRecord {
  ensureDataFile();
  const current = getAllSharedClasses();

  const code = (newClass.subjectCode || newClass.kode_kelas || "").toLowerCase().trim();
  const id = newClass.id || `cls-${Date.now()}`;
  const mapel = newClass.mapel || newClass.mata_pelajaran || "IPA";
  const name = newClass.name || newClass.nama_kelas || `${mapel} (Kelas 8)`;

  const completeRecord: SharedClassRecord = {
    id,
    name,
    nama_kelas: name,
    mapel,
    mata_pelajaran: mapel,
    section: newClass.section || "Fase D Kurikulum Merdeka",
    room: newClass.room || newClass.ruang || (mapel.toLowerCase().includes("ipa") ? "Lab IPA" : "Ruang Kelas"),
    ruang: newClass.room || newClass.ruang || (mapel.toLowerCase().includes("ipa") ? "Lab IPA" : "Ruang Kelas"),
    subjectCode: code,
    kode_kelas: code,
    themeColor: newClass.themeColor || newClass.banner_color || (mapel.toLowerCase().includes("ipa") ? "#0F9D58" : "#1967D2"),
    banner_color: newClass.themeColor || newClass.banner_color || (mapel.toLowerCase().includes("ipa") ? "#0F9D58" : "#1967D2"),
    bgGradient: newClass.bgGradient || (mapel.toLowerCase().includes("ipa") ? "from-emerald-600 via-teal-600 to-slate-950" : "from-blue-700 via-indigo-700 to-slate-950"),
    bannerType: newClass.bannerType || (newClass.bannerPhotoUrl ? "photo" : "illustration"),
    bannerIllustration: newClass.bannerIllustration || (mapel.toLowerCase().includes("ipa") ? "science" : "math"),
    banner_pattern: newClass.bannerIllustration || (mapel.toLowerCase().includes("ipa") ? "science" : "matematika"),
    bannerPhotoUrl: newClass.bannerPhotoUrl || "",
    teacherName: newClass.teacherName || newClass.nama_guru || "Ibu Siti Rahmawati, M.Pd.",
    nama_guru: newClass.teacherName || newClass.nama_guru || "Ibu Siti Rahmawati, M.Pd.",
    studentCount: newClass.studentCount || 0,
    description: newClass.description || `Kelas pembelajaran aktif berbasis AI Sokratik materi ${mapel}.`,
  };

  // Cek apakah token atau id sudah ada
  const existingIdx = current.findIndex(
    (c) => c.id === id || (code && c.subjectCode.toLowerCase() === code)
  );

  let updatedList: SharedClassRecord[];
  if (existingIdx >= 0) {
    updatedList = [...current];
    updatedList[existingIdx] = { ...updatedList[existingIdx], ...completeRecord };
  } else {
    updatedList = [completeRecord, ...current];
  }

  inMemoryClasses = updatedList;

  try {
    fs.writeFileSync(CLASSES_FILE, JSON.stringify(updatedList, null, 2), "utf8");
  } catch (err) {
    console.warn("[SHARED CLASSES] Gagal menulis ke file registry:", err);
  }

  // Hapus dari data/deleted_classes.json jika guru secara aktif membuat/mengedit kembali
  try {
    const existingDeleted = getDeletedClassRecords();
    const cleanedDeleted = existingDeleted.filter(
      (d) =>
        d.id.toLowerCase() !== id.toLowerCase() &&
        (!code || d.subjectCode?.toLowerCase() !== code)
    );
    fs.writeFileSync(DELETED_CLASSES_FILE, JSON.stringify(cleanedDeleted, null, 2), "utf8");
  } catch {}

  return completeRecord;
}

export function findSharedClassByToken(token: string): SharedClassRecord | null {
  if (!token) return null;
  const clean = token.toLowerCase().trim();
  if (isClassDeleted(clean) || isClassArchived(clean)) return null;

  const list = getAllSharedClasses();

  // 1. Exact match pada subjectCode atau kode_kelas
  const exact = list.find(
    (c) =>
      c.subjectCode.toLowerCase() === clean ||
      (c.kode_kelas && c.kode_kelas.toLowerCase() === clean)
  );
  if (exact) return exact;

  // 2. Cek token alias umum
  const aliases: Record<string, string> = {
    "12345": "mtk8xpk",
    mtk8: "mtk8xpk",
    ipa8: "ipa8xpk",
    ipa: "ipa8xpk",
    matematika: "mtk8xpk",
  };
  if (aliases[clean]) {
    const aliasTarget = aliases[clean];
    if (isClassDeleted(aliasTarget) || isClassArchived(aliasTarget)) return null;
    const aliased = list.find((c) => c.subjectCode.toLowerCase() === aliasTarget);
    if (aliased) return aliased;
  }

  // 3. Prefix matching cerdas jika guru membuat token IPA dinamis (misal "ipa8w7x", "ipa9...")
  if (clean.startsWith("ipa")) {
    if (
      isClassDeleted("ipa-8") ||
      isClassDeleted("ipa8xpk") ||
      isClassDeleted(clean) ||
      isClassArchived("ipa-8") ||
      isClassArchived("ipa8xpk") ||
      isClassArchived(clean)
    ) {
      return null;
    }
    const existingIpa = list.find((c) => c.mapel.toLowerCase() === "ipa");
    if (existingIpa) {
      return {
        ...existingIpa,
        subjectCode: clean,
        kode_kelas: clean,
      };
    }

    // Buat kelas IPA baru otomatis
    return saveSharedClass({
      name: "IPA (Ilmu Pengetahuan Alam)",
      nama_kelas: "IPA (Ilmu Pengetahuan Alam)",
      mapel: "IPA",
      mata_pelajaran: "IPA",
      section: "Fase D • Kurikulum Merdeka",
      room: "Lab IPA",
      subjectCode: clean,
      themeColor: "#0F9D58",
      bgGradient: "from-emerald-600 via-teal-600 to-slate-950",
      bannerIllustration: "science",
      bannerType: "illustration",
      teacherName: "Ibu Siti Rahmawati, M.Pd.",
      description: "Sistem Organisasi Kehidupan, Gerak dan Gaya, Usaha dan Energi, Struktur Bumi & Tata Surya.",
    });
  }

  // 4. Prefix mapel lainnya (bin, ing, inf, ips)
  const mapelPrefixMap: Record<string, { name: string; mapel: string; room: string; color: string; illu: string }> = {
    bin: { name: "Bahasa Indonesia (Kelas 8)", mapel: "Bahasa Indonesia", room: "Ruang 8-B", color: "#7C3AED", illu: "literature" },
    ing: { name: "Bahasa Inggris (Kelas 8)", mapel: "Bahasa Inggris", room: "Lab Bahasa", color: "#E11D48", illu: "english" },
    inf: { name: "Informatika / TIK (Kelas 8)", mapel: "Informatika", room: "Lab Komputer", color: "#0284C7", illu: "tech" },
    ips: { name: "IPS (Ilmu Pengetahuan Sosial)", mapel: "IPS", room: "Ruang 8-C", color: "#D97706", illu: "social" },
  };

  for (const [prefix, meta] of Object.entries(mapelPrefixMap)) {
    if (clean.startsWith(prefix)) {
      return saveSharedClass({
        name: meta.name,
        nama_kelas: meta.name,
        mapel: meta.mapel,
        mata_pelajaran: meta.mapel,
        section: "Fase D • Kurikulum Merdeka",
        room: meta.room,
        subjectCode: clean,
        themeColor: meta.color,
        bgGradient: "from-slate-700 via-slate-800 to-slate-950",
        bannerIllustration: meta.illu,
        bannerType: "illustration",
        teacherName: "Ibu Siti Rahmawati, M.Pd.",
      });
    }
  }

  return null;
}

