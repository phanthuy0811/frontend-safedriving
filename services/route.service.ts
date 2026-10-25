import { apiClient } from "./api.client";
import { RouteResponse, RouteRequest } from "@/types/route";

// GET /routes
export async function getAllRoutes(): Promise<RouteResponse[]> {
  const response = await apiClient.get<RouteResponse[]>("/routes");
  return response.data || [];
}

// GET /routes/{id}
export async function getRouteById(id: string): Promise<RouteResponse> {
  const response = await apiClient.get<RouteResponse>(`/routes/${id}`);
  return response.data!;
}

// POST /routes — ADMIN, MANAGER
export async function createRoute(request: RouteRequest): Promise<RouteResponse> {
  const response = await apiClient.post<RouteResponse>("/routes", request);
  return response.data!;
}

// PUT /routes/{id} — ADMIN, MANAGER
export async function updateRoute(
  id: string,
  request: RouteRequest
): Promise<RouteResponse> {
  const response = await apiClient.put<RouteResponse>(`/routes/${id}`, request);
  return response.data!;
}

// DELETE /routes/{id}
export async function deleteRoute(id: string): Promise<void> {
  await apiClient.delete<void>(`/routes/${id}`);
}
