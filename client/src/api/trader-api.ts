import { BACKEND_URL } from "@/lib/constants";
import axios from "axios";
import type { InsertTraderRequest, TraderRequest } from "@shared/schema";

const API_URL = BACKEND_URL;

export async function submitTraderRequest(data: Omit<InsertTraderRequest, 'userId' | 'status'>): Promise<TraderRequest> {
  const sessionId = localStorage.getItem("sessionId");
  
  const response = await axios.post(
    `${API_URL}/api/trader/request`,
    data,
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

export async function getMyTraderRequest(): Promise<TraderRequest | null> {
  const sessionId = localStorage.getItem("sessionId");
  
  try {
    const response = await axios.get(
      `${API_URL}/api/trader/my-request`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionId}`,
        },
        withCredentials: true,
      }
    );

    return response.data;
  } catch (error: any) {
    if (error.response?.status === 404) {
      return null;
    }
    throw error;
  }
}
