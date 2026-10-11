import { apiClient } from "./api.client";
import {
  SomnolenceRecordRequest,
  SomnolenceRecordResponse,
} from "@/types/somnolence-record";

// GET /somnolence-records — ADMIN, MANAGER
export async function getAllSomnolenceRecords(): Promise<SomnolenceRecordResponse[]> {
  const response = await apiClient.get<SomnolenceRecordResponse[]>("/somnolence-records");
  return response.data || [];
}

// GET /somnolence-records/{id} — ADMIN, MANAGER (id là Long)
export async function getSomnolenceRecordById(
  id: number
): Promise<SomnolenceRecordResponse> {
  const response = await apiClient.get<SomnolenceRecordResponse>(
    `/somnolence-records/${id}`
  );
  return response.data!;
}

// GET /somnolence-records/driver/{driverId} — ADMIN, MANAGER
export async function getSomnolenceRecordsByDriverId(
  driverId: string
): Promise<SomnolenceRecordResponse[]> {
  const response = await apiClient.get<SomnolenceRecordResponse[]>(
    `/somnolence-records/driver/${driverId}`
  );
  return response.data || [];
}

// POST /somnolence-records — ADMIN, MANAGER
export async function createSomnolenceRecord(
  request: SomnolenceRecordRequest
): Promise<SomnolenceRecordResponse> {
  const response = await apiClient.post<SomnolenceRecordResponse>(
    "/somnolence-records",
    request
  );
  return response.data!;
}

// DELETE /somnolence-records/{id} — ADMIN, MANAGER (hard delete, không có PUT)
export async function deleteSomnolenceRecord(id: number): Promise<void> {
  await apiClient.delete<void>(`/somnolence-records/${id}`);
}
