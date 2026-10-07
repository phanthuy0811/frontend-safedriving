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
