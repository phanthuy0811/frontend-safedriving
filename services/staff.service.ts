import { apiClient } from "./api.client";
import { StaffResponse } from "@/types/auth";

// GET /staff
export async function getAllStaff(): Promise<StaffResponse[]> {
  const response = await apiClient.get<StaffResponse[]>("/staff");
  return response.data || [];
}

// GET /staff/{id}
export async function getStaffById(id: string): Promise<StaffResponse> {
  const response = await apiClient.get<StaffResponse>(`/staff/${id}`);
  return response.data!;
}
