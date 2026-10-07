import { apiClient } from "./api.client";
import { PageResponse } from "@/types/common";
import {
  HitlCaseResponse,
  HitlReviewDecisionRequest,
  HitlStatus,
} from "@/types/hitl";

export async function getHitlQueue(
  status: HitlStatus = "PENDING",
  page: number = 0,
  size: number = 20
): Promise<PageResponse<HitlCaseResponse>> {
  const query = new URLSearchParams({
    status,
    page: page.toString(),
    size: size.toString(),
  });

  const response = await apiClient.get<PageResponse<HitlCaseResponse>>(
    `/api/v1/hitl/queue?${query.toString()}`
  );
  return response.data!;
}

export async function getHitlCaseById(id: string): Promise<HitlCaseResponse> {
  const response = await apiClient.get<HitlCaseResponse>(`/api/v1/hitl/${id}`);
  return response.data!;
}

export async function reviewHitlCase(
  id: string,
  payload: HitlReviewDecisionRequest
): Promise<HitlCaseResponse> {
  const response = await apiClient.post<HitlCaseResponse>(
    `/api/v1/hitl/${id}/review`,
    payload
  );
  return response.data!;
}
