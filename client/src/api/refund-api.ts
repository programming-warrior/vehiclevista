import axios from "axios";
import { BACKEND_URL } from "@/lib/constants";

export interface Refund {
  id: number;
  userId: number;
  paymentIntentId: string;
  stripeRefundId: string | null;
  amount: number;
  currency: string;
  reason: string;
  reasonDetails: string | null;
  status: string;
  listingId: number | null;
  listingType: string | null;
  bidId: number | null;
  packageId: number | null;
  processedBy: number | null;
  errorMessage: string | null;
  createdAt: string;
  completedAt: string | null;
}

export interface RefundWithUser {
  refund: Refund;
  user: {
    id: number;
    username: string;
    email: string;
  };
}

export interface RefundStats {
  byStatus: Array<{
    status: string;
    count: number;
    totalAmount: number;
  }>;
  byReason: Array<{
    reason: string;
    count: number;
    totalAmount: number;
  }>;
  last30Days: {
    count: number;
    totalAmount: number;
  };
}

export interface GetRefundsParams {
  status?: string;
  reason?: string;
  userId?: number;
  page?: number;
  limit?: number;
}

export interface RefundsResponse {
  refunds: RefundWithUser[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Get all refunds with filtering and pagination
 */
export async function getRefunds(params?: GetRefundsParams): Promise<RefundsResponse> {
  try {
    const sessionId = localStorage.getItem("sessionId");
    const response = await axios.get(`${BACKEND_URL}/api/admin/refunds`, {
      withCredentials: true,
      headers: {
        Authorization: `Bearer ${sessionId}`,
      },
      params,
    });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || "Failed to fetch refunds");
  }
}

/**
 * Get refund statistics
 */
export async function getRefundStats(): Promise<RefundStats> {
  try {
    const sessionId = localStorage.getItem("sessionId");
    const response = await axios.get(`${BACKEND_URL}/api/admin/refunds/stats`, {
      withCredentials: true,
      headers: {
        Authorization: `Bearer ${sessionId}`,
      },
    });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || "Failed to fetch refund statistics");
  }
}

/**
 * Get detailed information about a specific refund
 */
export async function getRefundById(id: number): Promise<RefundWithUser> {
  try {
    const sessionId = localStorage.getItem("sessionId");
    const response = await axios.get(`${BACKEND_URL}/api/admin/refunds/${id}`, {
      withCredentials: true,
      headers: {
        Authorization: `Bearer ${sessionId}`,
      },
    });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || "Failed to fetch refund details");
  }
}

/**
 * Manually initiate a refund (admin only)
 */
export async function createManualRefund(data: {
  userId: number;
  paymentIntentId: string;
  amount: number;
  reason?: string;
  reasonDetails?: string;
}): Promise<{ success: boolean; refund: Refund; stripeRefund: any }> {
  try {
    const sessionId = localStorage.getItem("sessionId");
    const response = await axios.post(
      `${BACKEND_URL}/api/admin/refunds/manual`,
      data,
      {
        withCredentials: true,
        headers: {
          Authorization: `Bearer ${sessionId}`,
        },
      }
    );
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || "Failed to process refund");
  }
}
