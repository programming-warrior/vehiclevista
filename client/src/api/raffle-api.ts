import axios from "axios";
import { BACKEND_URL } from "@/lib/constants";
import z from "zod";
// import { vehicleUploadSchema } from "@shared/zodSchema/vehicleSchema";


export async function getRunningRaffle() {
  try {
    const response = await axios.get(
      `${BACKEND_URL}/api/raffle/get` 
    );
    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || "No Running Raffle"
    );
  }
}

export async function getRaffleById(auctionId: string) {
  try {
    const response = await axios.get(
      `${BACKEND_URL}/api/auction/get/${auctionId}`, 
    );
    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || "Error fetching vehicle list"
    );
  }
}

export async function getBidsForRaffle(auctionId: string) {
  try {
    const response = await axios.get(
      `${BACKEND_URL}/api/auction/bids/${auctionId}`, 
    );
    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || "Error fetching bids list"
    );
  }
}

export async function verifyTicketPayment(
    paymentIntentId: any
  ) {
    try {
      const sessionId = localStorage.getItem("sessionId");
      const response = await axios.post(
        `${BACKEND_URL}/api/raffle/purchase/verify-payment`,
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

export async function purchaseRaffleTicket(raffleId: string, ticketQuantity: string) {
  try {
    const response = await axios.post(
      `${BACKEND_URL}/api/raffle/purchase-ticket/${raffleId}`,
      {
        ticketQuantity
      },
      {
        headers:{
         'Content-Type':'application/json',
         'Authorization':`Bearer ${localStorage.getItem('sessionId')}` 
        }
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
      `${BACKEND_URL}/api/raffle/increase-clicks/` ,
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
      `${BACKEND_URL}/api/raffle/increase-views/` ,
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