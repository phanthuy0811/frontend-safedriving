import { apiClient } from "./api.client";
import { DriverResponse, DriverRequest } from "@/types/driver";

// GET /drivers
export async function getAllDrivers(): Promise<DriverResponse[]> {
  const response = await apiClient.get<DriverResponse[]>("/drivers");
  return response.data || [];
}

// GET /drivers/{id}
export async function getDriverById(id: string): Promise<DriverResponse> {
  const response = await apiClient.get<DriverResponse>(`/drivers/${id}`);
  return response.data!;
}

// POST /drivers
export async function createDriver(request: DriverRequest): Promise<DriverResponse> {
  const response = await apiClient.post<DriverResponse>("/drivers", request);
  return response.data!;
}

// PUT /drivers/{id}
export async function updateDriver(
  id: string,
  request: DriverRequest
): Promise<DriverResponse> {
  const response = await apiClient.put<DriverResponse>(`/drivers/${id}`, request);
  return response.data!;
}

// DELETE /drivers/{id}
export async function deleteDriver(id: string): Promise<void> {
  await apiClient.delete<void>(`/drivers/${id}`);
}
