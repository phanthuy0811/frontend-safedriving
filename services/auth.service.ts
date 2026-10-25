import { ApiResponseAuthResponse, LoginRequest, RegisterRequest } from "@/types/auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export async function loginApi(credentials: LoginRequest): Promise<ApiResponseAuthResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "*/*",
    },
    body: JSON.stringify(credentials),
  });

  const data: ApiResponseAuthResponse = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.");
  }

  return data;
}

export async function registerApi(payload: RegisterRequest): Promise<ApiResponseAuthResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "*/*",
    },
    body: JSON.stringify(payload),
  });

  const data: ApiResponseAuthResponse = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Đăng ký không thành công. Vui lòng thử lại.");
  }

  return data;
}

