export interface RouteResponse {
  id: string;
  code: string;
  routeName: string;
  distanceKm: number;
  standardDurationMin: number;
  isActive?: boolean;
  note?: string;
}

export interface RouteRequest {
  code: string;
  routeName: string;
  distanceKm: number;
  standardDurationMin: number;
  isActive?: boolean;
  note?: string;
}
