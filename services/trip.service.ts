import { apiClient } from "./api.client";
import { TripRequest, TripResponse } from "@/types/trip";

// GET /trips
export async function getAllTrips(): Promise<TripResponse[]> {
  const response = await apiClient.get<TripResponse[]>("/trips");
  return response.data || [];
}

// GET /trips/{id}
export async function getTripById(id: string): Promise<TripResponse> {
  const response = await apiClient.get<TripResponse>(`/trips/${id}`);
  return response.data!;
}

// POST /trips — ADMIN, MANAGER
export async function createTrip(request: TripRequest): Promise<TripResponse> {
  const response = await apiClient.post<TripResponse>("/trips", request);
  return response.data!;
}

// PUT /trips/{id} — ADMIN, MANAGER
export async function updateTrip(
  id: string,
  request: TripRequest
): Promise<TripResponse> {
  const response = await apiClient.put<TripResponse>(`/trips/${id}`, request);
  return response.data!;
}

// DELETE /trips/{id} — soft delete, ADMIN, MANAGER
export async function deleteTrip(id: string): Promise<void> {
  await apiClient.delete<void>(`/trips/${id}`);
}
