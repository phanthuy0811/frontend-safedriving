import { apiClient } from "./api.client";
import { StaffRequest, StaffResponse } from "@/types/staff";

// GET /staff — Xem toàn bộ danh sách cán bộ, nhân viên
export async function getAllStaff(): Promise<StaffResponse[]> {
  const response = await apiClient.get<StaffResponse[]>("/staff");
  return response.data || [];
}

// GET /staff/{id} — Xem chi tiết hồ sơ nhân sự theo ID
export async function getStaffById(id: string): Promise<StaffResponse> {
  const response = await apiClient.get<StaffResponse>(`/staff/${id}`);
  return response.data!;
}

// POST /staff — Tạo mới hồ sơ nhân sự
export async function createStaff(request: StaffRequest): Promise<StaffResponse> {
  const response = await apiClient.post<StaffResponse>("/staff", request);
  return response.data!;
}

// PUT /staff/{id} — Cập nhật thông tin nhân viên
export async function updateStaff(
  id: string,
  request: StaffRequest
): Promise<StaffResponse> {
  const response = await apiClient.put<StaffResponse>(`/staff/${id}`, request);
  return response.data!;
}

// DELETE /staff/{id} — Xóa hồ sơ nhân sự
export async function deleteStaff(id: string): Promise<void> {
  await apiClient.delete<void>(`/staff/${id}`);
}
