import { BACKEND_URL } from "@/lib/constants";
import axios from "axios";
import {
  registerUser,
  loginUser,
  validateSession,
  logoutUser,
  getUserDetails,
  changePassword,
  getUserBids,
  updateUserCardInfo,
  googleAuth,
  contactSeller,
  getNotifications,
  markNotificationRead,
  getCardInfo,
  sendRegistrationOtp,
  verifyRegistrationOtp,
  getUsersAuctionListings,
  getUsersClassifiedListings,
  markClassifiedListingSold,
  markAuctionListingSold,
  editClassifiedListing,
  getFavouriteVehicles,
  getFavouriteAuctions,
  addToRecentViewApi,
} from "./user-api";
import {
  getVehicles,
  advanceVehicleSearch,
  uploadSingleVehicle,
  uploadBulkVehicle,
  getSellerVehicleListings,
  getFeaturedVehicles,
  getVehicleById,
  incrementVehicleClicks,
  incrementVehicleViews,
  getDraftVehicle,
  addOrRemoveVehicleToFavouriteApi,
} from "./vehicle-api";
import {
  createAuction,
  getActiveAuctions,
  getAuctionById,
  placeLiveBid,
  getBidsForAuction,
  UpdateDraftAuctionWithItemDraft,
  createNumberPlate,
  verifyBidPayment,
  addOrRemoveAuctionToFavouriteApi,
} from "./auction-api";

import {
  getRunningRaffle,
  purchaseRaffleTicket,
  incrementRaffleViews,
  incrementRaffleClicks,
  verifyTicketPayment,
  getRaffleById,
  getBidsForRaffle,
  getBidsForRunningRaffle,
} from "./raffle-api";

import {
  getPerformanceMetrics,
  getTopListings,
} from "./admin-api/analytics-api";
import { adminGetLoginLogs } from "./admin-api/log-api";
import { getUsers, blacklistUser, unBlacklistUser } from "./admin-api/user-api";

import {
  adminGetVehicles,
  blacklistVehicle,
  unBlacklistVehicle,
} from "./admin-api/vehicle-api";

import {
  adminAddPackage,
  adminGetPackages,
  adminUpdatePackage,
  adminTogglePackageActive,
} from "./admin-api/packages-api";
import { adminGetAuctions } from "./admin-api/auction-api";

import { getListingReports } from "./admin-api/repots-api";

import { uploadUserReport, uploadListingReport } from "./report-api";

import { createRaffle, getRaffles, chooseWinner } from "./admin-api/raffle-api";

import {
  getPackagesWithAmount,
  selectPackage,
  verifyPayment,
} from "./package-api";
import { adminGetPaymentHistory } from "./admin-api/payment-api";
import { adminGetChatHistory } from "./admin-api/buyer-seller-chat-api";
import {
  AuctionData,
  AuctionDraftCacheStore,
  vehicleDraftCacheStore,
} from "@/hooks/use-store";

async function getLocationSuggestion(location: string) {
  try {
    const res = await axios(
      `https://nominatim.openstreetmap.org/search?format=json&q=${location}`
    );
    return res.data;
  } catch (e) {
    throw e;
  }
}

export async function vehicleLookUp(
  registration_num: string,
  current_mileage: number
) {
  try {
    const res = await axios.post(
      BACKEND_URL + "/api/vehicles/look-up",
      {
        registration_num,
        current_mileage,
      },
      {
        withCredentials: true,
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );
    return res.data;
  } catch (e) {
    throw e;
  }
}

export async function getSellerDetais(sellerId: number) {
  try {
    const res = await axios.get(BACKEND_URL + "/api/seller/" + sellerId);
    return res.data;
  } catch (e) {
    throw e;
  }
}

// Admin: toggle auction visibility (enabled/disabled)
export async function adminToggleAuctionVisibility(auctionVisibilityAction: "enable"|"disable") {
  try {
    const res = await axios.patch(
      `${BACKEND_URL}/api/admin/auctions/toggle-visibility`,
      {  auctionVisibilityAction },
      {
        withCredentials: true,
        headers: {
          Authorization: `Bearer ${localStorage.getItem("sessionId")}`,
          "Content-Type": "application/json",
        },
      }
    );
    return res.data;
  } catch (e) {
    console.error("Error toggling auction visibility:", e);
    throw e;
  }
}

async function dvsaApi(registration_num: string) {
  try {
    const res = await axios.post(
      BACKEND_URL + "/api/vehicles/dvsa",
      {
        registration_num,
      },
      {
        withCredentials: true,
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );
    return res.data;
  } catch (e) {
    throw e;
  }
}

async function uploadToPresignedUrl(
  file: File,
  presignedUrl: string
): Promise<string> {
  try {
    console.log(file.type);
    const response = await fetch(presignedUrl, {
      method: "PUT",
      body: file,
      headers: {
        "Content-Type": file.type,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to upload image: ${response.statusText}`);
    }

    // Return the public URL by removing the query parameters from presignedUrl
    return presignedUrl.split("?")[0];
  } catch (error) {
    console.error("Error uploading file:", error);
    throw error;
  }
}

async function getPresignedUrls(
  files: {
    fileName: string;
    contentType: string;
  }[]
) {
  try {
    const response = await axios.post(
      `${BACKEND_URL}/api/presigned-url`,
      { files },
      {
        withCredentials: true,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("sessionId")}`,
        },
      }
    );
    return response;
  } catch (error) {
    console.error("Error getting presigned URLs:", error);
    throw error;
  }
}

async function validatePostalCode(postalCode: string) {
  try {
    const response = await axios.get(
      "https://api.postcodes.io/postcodes/" + postalCode
    );
    return response;
  } catch (e) {
    console.error("Error validating postcal code: ", e);
    throw e;
  }
}

export async function fetchVehicleCount(
  options: {
    type?: string;
    latitude?: string;
    longitude?: string;
    distance?: string;
    make?: string;
    model?: string;
    minBudget?: number;
    maxBudget?: number;
  } = {}
) {
  try {
    const params = new URLSearchParams();

    Object.entries(options).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        params.append(key, String(value));
      }
    });

    const response = await axios.get(
      `${BACKEND_URL}/api/vehicles/get-vehicle-count?${params.toString()}`
    );

    return response;
  } catch (e) {
    console.error("Error validating postcal code: ", e);
    throw e;
  }
}

import { useAuctionDraftCache, useVehicleDraftCache } from "@/hooks/use-store";

export async function pushListingDraftCacheToServer({
  auctionCache,
  clearAuctionCache,
  vehicleCache,
  clearVehicleCache,
}: {
  auctionCache: AuctionData;
  clearAuctionCache: () => void;
  vehicleCache: any;
  clearVehicleCache: () => void;
}): Promise<number> {
  try {
    if (vehicleCache && vehicleCache.draftId) {
      let imageUrls: string[] = [];

      console.log(vehicleCache);
      const fileKeys = vehicleCache.images.map((file: File) => ({
        fileName: `${Date.now()}-${file.name.split(" ").join("")}`,
        contentType: file.type,
      }));
      console.log("fetching presgined urls");
      const presignedUrlsResponse = await getPresignedUrls(fileKeys);
      const presignedUrls = presignedUrlsResponse.data.urls;

      console.log("uploading vehicle images to the s3");
      const uploadPromises = vehicleCache.images.map(
        (file: File, index: number) =>
          uploadToPresignedUrl(file, presignedUrls[index])
      );

      for (const promise of uploadPromises) {
        await promise.then((url: string) => {
          imageUrls.push(url);
        });
      }
      console.log("uploaded ");
      const vehicleData = {
        ...vehicleCache,
        images: imageUrls,
      };
      const vehicleDraftResponse = await axios.post(
        `${BACKEND_URL}/api/vehicles/upload-single`,
        { ...vehicleData },
        {
          withCredentials: true,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("sessionId")}`,
          },
        }
      );
      clearVehicleCache();
      return vehicleDraftResponse.data.draftId;
    } else if (auctionCache && auctionCache.draftId) {
      console.log("uploading auction draft");
      const auctionResponse = await axios.post(
        `${BACKEND_URL}/api/auction/create`,
        { ...auctionCache },
        {
          withCredentials: true,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("sessionId")}`,
          },
        }
      );
      const auctionDraftId = auctionResponse.data.draftId;
      console.log("auctionDraftId ", auctionDraftId);
      let itemDraftId: number | null = null;
      let itemResponse: any;
      console.log(auctionCache);
      if (auctionCache.itemType === "VEHICLE") {
        let imageUrls: string[] = [];

        const fileKeys = auctionCache.item.images.map((file: File) => ({
          fileName: `${Date.now()}-${file.name.split(" ").join("")}`,
          contentType: file.type,
        }));
        console.log("generating vehicle presigned url");
        const presignedUrlsResponse = await getPresignedUrls(fileKeys);
        const presignedUrls = presignedUrlsResponse.data.urls;

        const uploadPromises = auctionCache.item.images.map(
          (file: File, index: number) =>
            uploadToPresignedUrl(file, presignedUrls[index])
        );

        for (const promise of uploadPromises) {
          await promise.then((url: string) => {
            imageUrls.push(url);
          });
        }
        console.log("images uploaded: vehicle");
        const vehicleData = {
          ...auctionCache.item,
          images: imageUrls,
        };
        itemResponse = await axios.post(
          `${BACKEND_URL}/api/vehicles/upload-single`,
          { ...vehicleData },
          {
            withCredentials: true,
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("sessionId")}`,
            },
          }
        );
        itemDraftId = itemResponse.data.draftId;
      } else if (auctionCache.itemType === "NUMBERPLATE") {
        let documentUrls: string[] = [];

        const fileKeys = auctionCache.item.document_url.map((file: File) => ({
          fileName: `${Date.now()}-${file.name.split(" ").join("")}`,
          contentType: file.type,
        }));
        console.log("generating presgined url: numberplate");
        const presignedUrlsResponse = await getPresignedUrls(fileKeys);
        const presignedUrls = presignedUrlsResponse.data.urls;

        const uploadPromises = auctionCache.item.document_url.map(
          (file: File, index: number) =>
            uploadToPresignedUrl(file, presignedUrls[index])
        );

        for (const promise of uploadPromises) {
          await promise.then((url: string) => {
            documentUrls.push(url);
          });
        }
        console.log("document uploaded");
        const numberPlateData = {
          ...auctionCache.item,
          document_url: documentUrls,
        };
        itemResponse = await axios.post(
          `${BACKEND_URL}/api/auction/numberplate/create`,
          { ...numberPlateData },
          {
            withCredentials: true,
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("sessionId")}`,
            },
          }
        );
        itemDraftId = itemResponse.data.draftId;
      }
      console.log("itemDraftId: ", itemDraftId);
      if (itemDraftId && auctionDraftId) {
        const response = await axios.patch(
          `${BACKEND_URL}/api/auction/update-draft/${auctionDraftId}`,
          { itemId: itemDraftId, itemType: auctionCache.itemType },
          {
            withCredentials: true,
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("sessionId")}`,
            },
          }
        );
      }
      clearAuctionCache();
      console.log("auction cache draft pushed to the server");
      return auctionDraftId;
    }
    return NaN;
  } catch (e: any) {
    console.error("Error pushing draft cache: ", e);
    throw new Error(e.message || "Previous saved data lost!");
  }
}

export {
  validatePostalCode,
  uploadToPresignedUrl,
  getPresignedUrls,
  dvsaApi,
  getLocationSuggestion,
  getVehicles,
  getVehicleById,
  advanceVehicleSearch,
  uploadSingleVehicle,
  uploadBulkVehicle,
  getSellerVehicleListings,
  getFeaturedVehicles,
  incrementVehicleClicks,
  incrementVehicleViews,
  addOrRemoveVehicleToFavouriteApi,
  getDraftVehicle,
  createAuction,
  getActiveAuctions,
  getAuctionById,
  placeLiveBid,
  getBidsForAuction,
  UpdateDraftAuctionWithItemDraft,
  createNumberPlate,
  verifyBidPayment,
  addOrRemoveAuctionToFavouriteApi,
  registerUser,
  sendRegistrationOtp,
  verifyRegistrationOtp,
  loginUser,
  validateSession,
  logoutUser,
  getUserDetails,
  changePassword,
  getFavouriteVehicles,
  getFavouriteAuctions,
  addToRecentViewApi,
  getUserBids,
  updateUserCardInfo,
  googleAuth,
  contactSeller,
  getNotifications,
  markNotificationRead,
  getCardInfo,
  getUsersClassifiedListings,
  getUsersAuctionListings,
  markClassifiedListingSold,
  markAuctionListingSold,
  editClassifiedListing,
  getRunningRaffle,
  getRaffleById,
  purchaseRaffleTicket,
  verifyTicketPayment,
  incrementRaffleClicks,
  incrementRaffleViews,
  getBidsForRaffle,
  getBidsForRunningRaffle,
  getPerformanceMetrics,
  getTopListings,
  getListingReports,
  getUsers,
  blacklistUser,
  unBlacklistUser,
  createRaffle,
  chooseWinner,
  getRaffles,
  adminGetVehicles,
  adminGetLoginLogs,
  blacklistVehicle,
  unBlacklistVehicle,
  adminGetAuctions,
  adminGetPaymentHistory,
  adminGetChatHistory,
  adminAddPackage,
  adminTogglePackageActive,
  adminGetPackages,
  adminUpdatePackage,
  uploadListingReport,
  uploadUserReport,
  getPackagesWithAmount,
  selectPackage,
  verifyPayment,
};
