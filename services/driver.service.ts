import { apiClient } from "./api.client";
import {
  DriverCreateRequest,
  DriverRequest,
  DriverResponse,
} from "@/types/driver";

// GET /drivers — Xem danh sách tài xế đang quản lý
export async function getAllDrivers(): Promise<DriverResponse[]> {
  const response = await apiClient.get<DriverResponse[]>("/drivers");
  return response.data || [];
}

// GET /drivers/{id} — Tra cứu hồ sơ chi tiết một tài xế
export async function getDriverById(id: string): Promise<DriverResponse> {
  const response = await apiClient.get<DriverResponse>(`/drivers/${id}`);
  return response.data!;
}

// GET /drivers/me — Lấy hồ sơ cá nhân của tài xế hiện tại
export async function getMyDriverProfile(): Promise<DriverResponse> {
  const response = await apiClient.get<DriverResponse>("/drivers/me");
  return response.data!;
}

// POST /drivers — Tạo hồ sơ tài xế trọn gói (JSON hoặc Multipart FormData kèm avatar)
export async function createDriver(
  request: DriverCreateRequest,
  avatarFile?: File | null
): Promise<DriverResponse> {
  if (avatarFile) {
    const formData = new FormData();
    // Spring Boot expects "data" as JSON blob or string, and "avatar" as file
    const jsonBlob = new Blob([JSON.stringify(request)], {
      type: "application/json",
    });
    formData.append("data", jsonBlob);
    formData.append("avatar", avatarFile);

    const response = await apiClient.post<DriverResponse>("/drivers", formData);
    return response.data!;
  }

  const response = await apiClient.post<DriverResponse>("/drivers", request);
  return response.data!;
}

// PUT /drivers/{id} — Cập nhật thông tin hồ sơ tài xế
export async function updateDriver(
  id: string,
  request: DriverRequest
): Promise<DriverResponse> {
  const response = await apiClient.put<DriverResponse>(`/drivers/${id}`, request);
  return response.data!;
}

// DELETE /drivers/{id} — Xóa thông tin tài xế (Soft delete)
export async function deleteDriver(id: string): Promise<void> {
  await apiClient.delete<void>(`/drivers/${id}`);
}
