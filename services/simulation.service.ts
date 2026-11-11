import { apiClient } from "./api.client";
import { AccidentBlackspot, SimulationRouteData, SimulationStatus } from "@/types/blackspot";

export async function getActiveBlackspots(): Promise<AccidentBlackspot[]> {
  try {
    const res = await apiClient.get<AccidentBlackspot[]>("/api/v1/blackspots");
    return res.data || [];
  } catch (err) {
    console.error("Lỗi lấy danh sách điểm đen:", err);
    return [];
  }
}

export async function getSimulationRoute(): Promise<SimulationRouteData | null> {
  try {
    const res = await apiClient.get<SimulationRouteData>("/api/v1/simulation/route");
    return res.data || null;
  } catch (err) {
    console.error("Lỗi lấy dữ liệu lộ trình mô phỏng:", err);
    return null;
  }
}

export async function startGpsSimulation(
  tripId = "trip-e2e-001",
  speedMultiplier = 2.0,
  startIndex?: number
): Promise<SimulationStatus | null> {
  try {
    let url = `/api/v1/simulation/start?tripId=${encodeURIComponent(tripId)}&speedMultiplier=${speedMultiplier}`;
    if (startIndex !== undefined && startIndex !== null) {
      url += `&startIndex=${startIndex}`;
    }
    const res = await apiClient.post<SimulationStatus>(url);
    return res.data || null;
  } catch (err) {
    console.error("Lỗi khởi chạy mô phỏng:", err);
    return null;
  }
}

export async function stopGpsSimulation(): Promise<SimulationStatus | null> {
  try {
    const res = await apiClient.post<SimulationStatus>("/api/v1/simulation/stop");
    return res.data || null;
  } catch (err) {
    console.error("Lỗi dừng mô phỏng:", err);
    return null;
  }
}

export async function getSimulationStatus(): Promise<SimulationStatus | null> {
  try {
    const res = await apiClient.get<SimulationStatus>("/api/v1/simulation/status");
    return res.data || null;
  } catch (err) {
    console.error("Lỗi lấy trạng thái mô phỏng:", err);
    return null;
  }
}
