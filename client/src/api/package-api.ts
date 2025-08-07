import axios from "axios";
import { BACKEND_URL } from "@/lib/constants";

export async function getPackagesWithAmount(
  type: string,
  item_value: number,
) {
  try {
    const sessionId = localStorage.getItem("sessionId");
    const response = await axios.post(
      `${BACKEND_URL}/api/package/evaluate-price`,
      {
        type,
        item_value,
      },
      {
        withCredentials: true,
        headers: {
          Authorization: `Bearer ${sessionId}`,
        },
      }
    );
    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.error || "Failed to fetch notifications"
    );
  }
}

export async function verifyPayment(
  paymentIntentId: any
) {
  try {
    const sessionId = localStorage.getItem("sessionId");
    const response = await axios.post(
      `${BACKEND_URL}/api/package/verify-payment`,
      {
        paymentIntentId
      },
      {
        withCredentials: true,
        headers: {
          Authorization: `Bearer ${sessionId}`,
        },
      }
    );
    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.error || "Failed to fetch notifications"
    );
  }
}


export async function selectPackage(
  packageId: number,
  type: "CLASSIFIED" | "AUCTION-VEHICLE" | "AUCTION-NUMBERPLATE",
  draftId: number
) {
  try {
    const sessionId = localStorage.getItem("sessionId");
    const response = await axios.post(
      `${BACKEND_URL}/api/package/select`,
      {
        package_id: packageId,
        type: type,
        draft_id: draftId,
      },
      {
        withCredentials: true,
        headers: {
          Authorization: `Bearer ${sessionId}`,
        },
      }
    );
    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.error || "Failed to fetch notifications"
    );
  }
}