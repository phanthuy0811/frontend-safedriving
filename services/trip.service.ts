import { apiClient } from "./api.client";
import { TripGpsTrackResponse, TripRequest, TripResponse, TripStatus } from "@/types/trip";

// GET /trips
export async function getAllTrips(status?: TripStatus): Promise<TripResponse[]> {
  const url = status ? `/trips?status=${status}` : "/trips";
  const response = await apiClient.get<TripResponse[]>(url);
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

// DELETE /trips/{id} — soft delete
export async function deleteTrip(id: string): Promise<void> {
  await apiClient.delete<void>(`/trips/${id}`);
}

// POST /trips/{id}/start — bắt đầu chuyến
export async function startTrip(id: string): Promise<TripResponse> {
  const response = await apiClient.post<TripResponse>(`/trips/${id}/start`);
  return response.data!;
}

// POST /trips/{id}/end — kết thúc chuyến
export async function endTrip(id: string, distanceKm?: number): Promise<TripResponse> {
  const url = distanceKm ? `/trips/${id}/end?distanceKm=${distanceKm}` : `/trips/${id}/end`;
  const response = await apiClient.post<TripResponse>(url);
  return response.data!;
}

// POST /trips/{id}/auto-dispatch — tự động nổ đơn phân công
export async function autoDispatchTrip(id: string): Promise<TripResponse> {
  const response = await apiClient.post<TripResponse>(`/trips/${id}/auto-dispatch`);
  return response.data!;
}

// GET /trips/{id}/tracks — lấy vệt tọa độ GPS
export async function getTripGpsTracks(id: string): Promise<TripGpsTrackResponse[]> {
  const response = await apiClient.get<TripGpsTrackResponse[]>(`/trips/${id}/tracks`);
  return response.data || [];
}
