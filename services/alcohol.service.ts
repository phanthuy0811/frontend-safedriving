import { apiClient } from "./api.client";
import { AlcoholRecordResponse } from "@/types/alcohol";

// GET /alcohol-records
export async function getAllAlcoholRecords(driverId?: string): Promise<AlcoholRecordResponse[]> {
  const url = driverId ? `/alcohol-records?driverId=${encodeURIComponent(driverId)}` : "/alcohol-records";
  const response = await apiClient.get<AlcoholRecordResponse[]>(url);
  return response.data || [];
}

// GET /alcohol-records/{id}
export async function getAlcoholRecordById(id: number): Promise<AlcoholRecordResponse> {
  const response = await apiClient.get<AlcoholRecordResponse>(`/alcohol-records/${id}`);
  return response.data!;
}
