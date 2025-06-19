import axios from "axios";
import { BACKEND_URL } from "@/lib/constants";
import z from "zod";
// import { vehicleUploadSchema } from "@shared/zodSchema/vehicleSchema";

export async function getRunningRaffle() {
  try {
    const response = await axios.get(`${BACKEND_URL}/api/raffle/get`);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "No Running Raffle");
  }
}

export async function getRaffleById(raffleId: number | string) {
  try {
    const response = await axios.get(
      `${BACKEND_URL}/api/raffle/get/${raffleId}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("sessionId")}`,
        },
        withCredentials: true,
      }
    );
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "No Running Raffle");
  }
}


export async function getBidsForRaffle(raffleId: string) {
  try {
    const response = await axios.get(
      `${BACKEND_URL}/api/raffle/purchases/${raffleId}`, 
      {
        headers:{
          Authorization: `Bearer ${localStorage.getItem('sessionId')}`
        },
        withCredentials: true,
      }
    );
    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || "Error fetching bids list"
    );
  }
}

export async function getBidsForRunningRaffle() {
  try {
    const response = await axios.get(
      `${BACKEND_URL}/api/raffle/purchases`, 
    );
    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || "Error fetching bids list"
    );
  }
}

export async function verifyTicketPayment(paymentIntentId: any) {
  try {
    const sessionId = localStorage.getItem("sessionId");
    const response = await axios.post(
      `${BACKEND_URL}/api/raffle/purchase/verify-payment`,
      {
        paymentIntentId,
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

export async function purchaseRaffleTicket(
  ticketQuantity: string
) {
  try {
    const response = await axios.post(
      `${BACKEND_URL}/api/raffle/purchase-ticket`,
      {
        ticketQuantity,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("sessionId")}`,
        },
      }
    );
    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || "Error fetching vehicle list"
    );
  }
}

export async function incrementRaffleClicks(raffleId: string) {
  try {
    const response = await axios.post(
      `${BACKEND_URL}/api/raffle/increase-clicks/`,
      {
        raffleId,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("sessionId")}`,
        },
      }
    );
    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || "Error incrementing vehicle clicks"
    );
  }
}

export async function incrementRaffleViews(raffleId: string) {
  try {
    const response = await axios.post(
      `${BACKEND_URL}/api/raffle/increase-views/`,
      {
        raffleId,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("sessionId")}`,
        },
      }
    );
    return response.data;
  } catch (error: any) {
    // throw new Error(
    //   error.response?.data?.message || "Error incrementing vehicle clicks"
    // );
  }
}
