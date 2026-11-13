import fs from "fs";
import path from "path";
import { UnenrollRequest } from "./unenroll-types";

export type { UnenrollRequest };

const DATA_DIR = path.join(process.cwd(), "data");
const FILE_PATH = path.join(DATA_DIR, "unenroll_requests.json");

function ensureFile() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(FILE_PATH)) {
      fs.writeFileSync(FILE_PATH, JSON.stringify([], null, 2), "utf8");
    }
  } catch (err) {
    console.warn("[UNENROLL REQUESTS] Failed to init file:", err);
  }
}

export function getAllUnenrollRequests(): UnenrollRequest[] {
  try {
    ensureFile();
    if (fs.existsSync(FILE_PATH)) {
      const content = fs.readFileSync(FILE_PATH, "utf8");
      const list = JSON.parse(content);
      if (Array.isArray(list)) return list;
    }
  } catch (err) {
    console.warn("[UNENROLL REQUESTS] Failed to read:", err);
  }
  return [];
}

export function createUnenrollRequest(
  studentId: string,
  studentName: string,
  classId: string,
  className: string
): UnenrollRequest {
  ensureFile();
  const current = getAllUnenrollRequests();

  // Jika sudah ada request pending untuk siswa & kelas ini, kembalikan yang sudah ada
  const existing = current.find(
    (r) =>
      r.studentId === studentId &&
      (r.classId === classId || r.className === className) &&
      r.status === "pending"
  );
  if (existing) return existing;

  const newReq: UnenrollRequest = {
    id: `unenroll-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    studentId: studentId || "student-1",
    studentName: studentName || "Siswa Thinksy",
    classId,
    className,
    status: "pending",
    requestedAt: new Date().toISOString(),
  };

  const updated = [newReq, ...current];
  try {
    fs.writeFileSync(FILE_PATH, JSON.stringify(updated, null, 2), "utf8");
  } catch (err) {
    console.warn("[UNENROLL REQUESTS] Failed to write:", err);
  }

  return newReq;
}

export function updateUnenrollRequestStatus(
  requestId: string,
  status: "approved" | "rejected"
): UnenrollRequest | null {
  ensureFile();
  const current = getAllUnenrollRequests();
  const idx = current.findIndex((r) => r.id === requestId);
  if (idx === -1) return null;

  current[idx] = {
    ...current[idx],
    status,
    processedAt: new Date().toISOString(),
  };

  try {
    fs.writeFileSync(FILE_PATH, JSON.stringify(current, null, 2), "utf8");
  } catch (err) {
    console.warn("[UNENROLL REQUESTS] Failed to update:", err);
  }

  return current[idx];
}

export function cancelUnenrollRequest(
  studentIdOrClassId: string,
  classId?: string
): boolean {
  ensureFile();
  const current = getAllUnenrollRequests();
  const filtered = current.filter((r) => {
    if (r.status !== "pending") return true;
    if (classId) {
      if ((r.studentId === studentIdOrClassId || !studentIdOrClassId) && (r.classId === classId || r.className === classId)) {
        return false;
      }
      if (r.classId === classId) return false;
    } else {
      if (r.id === studentIdOrClassId || r.classId === studentIdOrClassId) {
        return false;
      }
    }
    return true;
  });
  try {
    fs.writeFileSync(FILE_PATH, JSON.stringify(filtered, null, 2), "utf8");
    return true;
  } catch (err) {
    console.warn("[UNENROLL REQUESTS] Failed to cancel:", err);
  }
  return false;
}
