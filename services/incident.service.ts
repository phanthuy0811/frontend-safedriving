import { apiClient } from "./api.client";
import { IncidentRequest, IncidentResponse } from "@/types/incident";

// GET /incidents
export async function getAllIncidents(): Promise<IncidentResponse[]> {
  const response = await apiClient.get<IncidentResponse[]>("/incidents");
  return response.data || [];
}

// GET /incidents/{id}
export async function getIncidentById(id: string): Promise<IncidentResponse> {
  const response = await apiClient.get<IncidentResponse>(`/incidents/${id}`);
  return response.data!;
}

// GET /incidents/trip/{tripId}
export async function getIncidentsByTripId(tripId: string): Promise<IncidentResponse[]> {
  const response = await apiClient.get<IncidentResponse[]>(`/incidents/trip/${tripId}`);
  return response.data || [];
}

// POST /incidents — ADMIN, MANAGER, DRIVER
export async function createIncident(request: IncidentRequest): Promise<IncidentResponse> {
  const response = await apiClient.post<IncidentResponse>("/incidents", request);
  return response.data!;
}

// PUT /incidents/{id} — ADMIN, MANAGER, DRIVER
export async function updateIncident(
  id: string,
  request: IncidentRequest
): Promise<IncidentResponse> {
  const response = await apiClient.put<IncidentResponse>(`/incidents/${id}`, request);
  return response.data!;
}

// DELETE /incidents/{id} — ADMIN, MANAGER only (hard delete)
export async function deleteIncident(id: string): Promise<void> {
  await apiClient.delete<void>(`/incidents/${id}`);
}
