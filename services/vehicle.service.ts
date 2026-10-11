import { apiClient } from "./api.client";
import { AssignDriverRequest, VehicleResponse, VehicleStatus } from "@/types/vehicle";

export async function getAllVehicles(status?: VehicleStatus): Promise<VehicleResponse[]> {
  const query = status ? `?status=${encodeURIComponent(status)}` : "";
  const response = await apiClient.get<VehicleResponse[]>(`/api/v1/vehicles${query}`);
  return response.data || [];
}

export async function getVehicleById(id: string): Promise<VehicleResponse> {
  const response = await apiClient.get<VehicleResponse>(`/api/v1/vehicles/${id}`);
  return response.data!;
}

export async function assignDriverToVehicle(
  vehicleId: string,
  driverId: string
): Promise<VehicleResponse> {
  const payload: AssignDriverRequest = { driver_id: driverId };
  const response = await apiClient.post<VehicleResponse>(
    `/api/v1/vehicles/${vehicleId}/assign-driver`,
    payload
  );
  return response.data!;
}

// POST /vehicles — ADMIN, MANAGER
export async function createVehicle(
  request: any
): Promise<VehicleResponse> {
  const response = await apiClient.post<VehicleResponse>("/api/v1/vehicles", request);
  return response.data!;
}

// PUT /vehicles/{id} — ADMIN, MANAGER
export async function updateVehicle(
  id: string,
  request: any
): Promise<VehicleResponse> {
  const response = await apiClient.put<VehicleResponse>(
    `/api/v1/vehicles/${id}`,
    request
  );
  return response.data!;
}

// DELETE /vehicles/{id} — soft delete, ADMIN, MANAGER
export async function deleteVehicle(id: string): Promise<void> {
  await apiClient.delete<void>(`/api/v1/vehicles/${id}`);
}
