import { apiClient } from "./api.client";
import { VehicleTypeRequest, VehicleTypeResponse } from "@/types/vehicle-type";

// GET /vehicle-types
export async function getAllVehicleTypes(): Promise<VehicleTypeResponse[]> {
  const response = await apiClient.get<VehicleTypeResponse[]>("/vehicle-types");
  return response.data || [];
}

// GET /vehicle-types/{id}
export async function getVehicleTypeById(id: number): Promise<VehicleTypeResponse> {
  const response = await apiClient.get<VehicleTypeResponse>(`/vehicle-types/${id}`);
  return response.data!;
}

// POST /vehicle-types — ADMIN, MANAGER
export async function createVehicleType(
  request: VehicleTypeRequest
): Promise<VehicleTypeResponse> {
  const response = await apiClient.post<VehicleTypeResponse>("/vehicle-types", request);
  return response.data!;
}

// PUT /vehicle-types/{id} — ADMIN, MANAGER
export async function updateVehicleType(
  id: number,
  request: VehicleTypeRequest
): Promise<VehicleTypeResponse> {
  const response = await apiClient.put<VehicleTypeResponse>(
    `/vehicle-types/${id}`,
    request
  );
  return response.data!;
}

// DELETE /vehicle-types/{id} — ADMIN, MANAGER (hard delete)
export async function deleteVehicleType(id: number): Promise<void> {
  await apiClient.delete<void>(`/vehicle-types/${id}`);
}
