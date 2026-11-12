import { apiClient } from "./api.client";
import { PageResponse } from "@/types/common";
import {
  HitlCaseResponse,
  HitlReviewDecisionRequest,
  HitlStatus,
} from "@/types/hitl";

export async function getHitlQueue(
  status?: HitlStatus,
  page: number = 0,
  size: number = 20
): Promise<PageResponse<HitlCaseResponse>> {
  const query = new URLSearchParams({
    page: page.toString(),
    size: size.toString(),
  });
  if (status) {
    query.set("status", status);
  }

  const response = await apiClient.get<PageResponse<HitlCaseResponse>>(
    `/hitl/queue?${query.toString()}`
  );
  return response.data!;
}

export async function clearAllHitlCases(): Promise<void> {
  await apiClient.delete(`/hitl/all`);
}

export async function getHitlCaseById(id: string): Promise<HitlCaseResponse> {
  const response = await apiClient.get<HitlCaseResponse>(`/hitl/${id}`);
  return response.data!;
}

export async function reviewHitlCase(
  id: string,
  payload: HitlReviewDecisionRequest
): Promise<HitlCaseResponse> {
  const response = await apiClient.post<HitlCaseResponse>(
    `/hitl/${id}/review`,
    payload
  );
  return response.data!;
}
