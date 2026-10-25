import { apiClient } from "./api.client";
import { AssignmentRequest, AssignmentResponse } from "@/types/assignment";

// GET /assignments
export async function getAllAssignments(): Promise<AssignmentResponse[]> {
  const response = await apiClient.get<AssignmentResponse[]>("/assignments");
  return response.data || [];
}

// GET /assignments/{id}
export async function getAssignmentById(id: string): Promise<AssignmentResponse> {
  const response = await apiClient.get<AssignmentResponse>(`/assignments/${id}`);
  return response.data!;
}

// GET /assignments/driver/{driverId}
export async function getAssignmentsByDriverId(
  driverId: string
): Promise<AssignmentResponse[]> {
  const response = await apiClient.get<AssignmentResponse[]>(
    `/assignments/driver/${driverId}`
  );
  return response.data || [];
}

// POST /assignments — ADMIN, MANAGER (tự động cập nhật Trip → ASSIGNED)
export async function createAssignment(
  request: AssignmentRequest
): Promise<AssignmentResponse> {
  const response = await apiClient.post<AssignmentResponse>("/assignments", request);
  return response.data!;
}

// PUT /assignments/{id} — ADMIN, MANAGER
export async function updateAssignment(
  id: string,
  request: AssignmentRequest
): Promise<AssignmentResponse> {
  const response = await apiClient.put<AssignmentResponse>(
    `/assignments/${id}`,
    request
  );
  return response.data!;
}

// DELETE /assignments/{id} — soft delete, ADMIN, MANAGER
export async function deleteAssignment(id: string): Promise<void> {
  await apiClient.delete<void>(`/assignments/${id}`);
}
