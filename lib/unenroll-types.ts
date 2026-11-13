export interface UnenrollRequest {
  id: string;
  studentId: string;
  studentName: string;
  classId: string;
  className: string;
  status: "pending" | "approved" | "rejected";
  requestedAt: string;
  processedAt?: string;
}

