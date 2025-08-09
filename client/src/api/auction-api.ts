import axios from "axios";
import { BACKEND_URL } from "@/lib/constants";
import z from "zod";
// import { vehicleUploadSchema } from "@shared/zodSchema/vehicleSchema";

export async function createAuction(
  data:any
) {
  try {
    const response = await axios.post(
      `${BACKEND_URL}/api/auction/create`,
      {
        ...data,
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
    throw new Error(error.response?.data?.message);
  }
}

export async function createNumberPlate(
  data:any
) {
  try {
    const response = await axios.post(
      `${BACKEND_URL}/api/auction/numberplate/create`,
      {
        ...data,
      },
      {
        withCredentials:true,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("sessionId")}`,
        },
      }
    );
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message);
  }
}

export async function addOrRemoveAuctionToFavouriteApi(auctionId:any, toAdd:boolean) {
  try {
    const response = await axios.post(
      `${BACKEND_URL}/api/auction/update-favourite`,
      {
        auctionId,
        toAdd
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
      error.response?.data?.message || "Error updating auction favourite"
    );
  }
}

export async function UpdateDraftAuctionWithItemDraft(
  auctionDraftId: number,
  itemId:number,
  itemType: string
) {
  try {
    const response = await axios.patch(
      `${BACKEND_URL}/api/auction/update-draft/`+auctionDraftId,
      {
        itemId,
        itemType
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
    throw new Error(error.response?.data?.message);
  }
}

export async function getActiveAuctions(searchParams: string) {
  try {
    const response = await axios.get(
      `${BACKEND_URL}/api/auction/get?` + searchParams
    );
    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || "Error fetching vehicle list"
    );
  }
}

export async function getAuctionById(auctionId: string) {
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

export async function getBidsForAuction(auctionId: string) {
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

export async function verifyBidPayment(
    paymentIntentId: any
  ) {
    try {
      const sessionId = localStorage.getItem("sessionId");
      const response = await axios.post(
        `${BACKEND_URL}/api/auction/bids/verify-payment`,
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

export async function placeLiveBid(auctionId: string, bidAmount: string) {
  try {
    const response = await axios.post(
      `${BACKEND_URL}/api/auction/place/live-bid/${auctionId}`,
      {
        bidAmount
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