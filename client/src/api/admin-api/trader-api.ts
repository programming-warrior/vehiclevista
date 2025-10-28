import { BACKEND_URL } from "@/lib/constants";
import axios from "axios";
import type { TraderRequest } from "@shared/schema";

const API_URL = BACKEND_URL;

export async function adminGetTraderRequests(status?: string): Promise<TraderRequest[]> {
  const sessionId = localStorage.getItem("sessionId");
  
  const params = status ? { status } : {};
  
  const response = await axios.get(
    `${API_URL}/api/admin/trader-requests`,
    {
      params,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${sessionId}`,
      },
      withCredentials: true,
    }
  );

  return response.data;
}

export async function adminApproveTraderRequest(requestId: number): Promise<{ success: boolean; message: string }> {
  const sessionId = localStorage.getItem("sessionId");
  
  const response = await axios.post(
    `${API_URL}/api/admin/trader-requests/${requestId}/approve`,
    {},
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${sessionId}`,
      },
      withCredentials: true,
    }
  );

  return response.data;
}

export async function adminRejectTraderRequest(
  requestId: number,
  rejectionReason: string
): Promise<{ success: boolean; message: string }> {
  const sessionId = localStorage.getItem("sessionId");
  
  const response = await axios.post(
    `${API_URL}/api/admin/trader-requests/${requestId}/reject`,
    { rejectionReason },
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${sessionId}`,
      },
      withCredentials: true,
    }
  );

  return response.data;
}
