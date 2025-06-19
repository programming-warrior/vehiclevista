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
  getUsersAuctionListings,
  getUsersClassifiedListings,
  markClassifiedListingSold,
  markAuctionListingSold,
  editClassifiedListing,
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
  getDraftVehicle
} from "./vehicle-api";
import { 
    createAuction, 
    getActiveAuctions, 
    getAuctionById, 
    placeLiveBid, 
    getBidsForAuction,
    UpdateDraftAuctionWithItemDraft,
    createNumberPlate,
    verifyBidPayment
} from "./auction-api";

import { getRunningRaffle, purchaseRaffleTicket, incrementRaffleViews, incrementRaffleClicks, verifyTicketPayment } from "./raffle-api";

import { 
  getPerformanceMetrics,
  getTopListings
 } from "./admin-api/analytics-api";
 import { getUsers, blacklistUser, unBlacklistUser } from "./admin-api/user-api";

 import { adminGetVehicles , blacklistVehicle, unBlacklistVehicle } from "./admin-api/vehicle-api";

 import { adminGetAuctions } from "./admin-api/auction-api";

 import { getListingReports } from "./admin-api/repots-api";

 import { uploadUserReport, uploadListingReport } from "./report-api";
 
 import { createRaffle, getRaffles } from "./admin-api/raffle-api";

 import { getPackagesWithAmount, selectPackage, verifyPayment } from "./package-api";


async function getLocationSuggestion(location:string){
    try{
      const res= await axios(`https://nominatim.openstreetmap.org/search?format=json&q=${location}`);
      return res.data;
    }
    catch(e){
      throw e
    }
}

export async function vehicleLookUp(registration_num:string, current_mileage: number){
  try{
    const res= await axios.post(BACKEND_URL + '/api/vehicles/look-up',
      {
        registration_num,
        current_mileage
      },
      {
        withCredentials: true,
        headers:{
          'Authorization':`Bearer ${localStorage.getItem('token')}`
        }
      }
    )
    return res.data;
  }
  catch(e){
    throw e;
  }
}

async function dvsaApi(registration_num:string){
  try{
    const res= await axios.post(BACKEND_URL + '/api/vehicles/dvsa',
      {
        registration_num
      },
      {
        withCredentials: true,
        headers:{
          'Authorization':`Bearer ${localStorage.getItem('token')}`
        }
      }
    )
    return res.data;
  }
  catch(e){
    throw e;
  }
}

async function uploadToPresignedUrl(file: File, presignedUrl: string): Promise<string> {
    try {
      console.log(file.type);
      const response = await fetch(presignedUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to upload image: ${response.statusText}`);
      }
      
      // Return the public URL by removing the query parameters from presignedUrl
      return presignedUrl.split('?')[0];
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
          "Authorization":`Bearer ${localStorage.getItem('sessionId')}`
        },
      }
    );
    return response;
  } catch (error) {
    console.error("Error getting presigned URLs:", error);
    throw error;
  }
}

export {
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
  getDraftVehicle,

  createAuction,
  getActiveAuctions,
  getAuctionById,
  placeLiveBid,
  getBidsForAuction,
  UpdateDraftAuctionWithItemDraft,
  createNumberPlate,
  verifyBidPayment,

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
  getUsersClassifiedListings,
  getUsersAuctionListings,
  markClassifiedListingSold,
  markAuctionListingSold,
  editClassifiedListing,

  getRunningRaffle,
  purchaseRaffleTicket,
  verifyTicketPayment,
  incrementRaffleClicks,
  incrementRaffleViews,
  

  getPerformanceMetrics,
  getTopListings, 
  getListingReports,
  getUsers,
  blacklistUser,
  unBlacklistUser,
  createRaffle,
  getRaffles,
  adminGetVehicles,
  blacklistVehicle,
  unBlacklistVehicle,

  adminGetAuctions,

  uploadListingReport,
  uploadUserReport,

  getPackagesWithAmount, 
  selectPackage,
  verifyPayment
};