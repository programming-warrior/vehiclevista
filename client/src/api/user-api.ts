import axios from "axios";
import { BACKEND_URL } from "@/lib/constants";
import { userRegisterSchema } from "@shared/zodSchema/userSchema";
import z from "zod";

export async function registerUser(
  userData: z.infer<typeof userRegisterSchema>
) {
  try {
    const response = await axios.post(
      `${BACKEND_URL}/api/auth/register`,
      userData
    );
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Registration failed");
  }
}

export async function googleAuth(credentialResponse:any){
  try{
    const res = await axios.post(
      BACKEND_URL + "/api/auth/google",
      { token: credentialResponse.credential },
      {
        headers: { "Content-Type": "application/json" },
      }
    );
    return res.data
  }
  catch(e){
    throw e
  }  
}

export async function loginUser(username: string, password: string) {
  try {
    const response = await axios.post(`${BACKEND_URL}/api/auth/login`, {
      username,
      password,
    });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Login failed");
  }
}

export async function logoutUser() {
  try {
    const sessionId= localStorage.getItem('sessionId');
    const response = await axios.delete(`${BACKEND_URL}/api/auth/logout`, {
      withCredentials: true,
      headers: {
        Authorization: `Bearer ${sessionId}`,
      }
    });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Logout failed");
  }
}


export async function getUserDetails() {
  try {
    const sessionId = localStorage.getItem("sessionId");
    const response = await axios.get(`${BACKEND_URL}/api/user/`, {
      withCredentials: true,
      headers: {
        Authorization: `Bearer ${sessionId}`,
      },
    });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || "Failed to fetch user details");
  }
}


//change password
export async function changePassword(oldPassword: string, newPassword: string) {
  try {
    const sessionId = localStorage.getItem("sessionId");
    const response = await axios.patch(
      `${BACKEND_URL}/api/user/change-password`,
      { oldPassword, newPassword },
      {
        withCredentials: true,
        headers: {
          Authorization: `Bearer ${sessionId}`,
        },
      }
    );
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || "Failed to change password");
  }
}

export async function getUserBids(){
  try{
    const sessionId = localStorage.getItem("sessionId");
    const response = await axios.get(`${BACKEND_URL}/api/user/bids`, {
      withCredentials: true,
      headers: {
        Authorization: `Bearer ${sessionId}`,
      },
    });
    return response.data;
  }
  catch(e:any){
    throw new Error(e.response?.data?.error || "Failed to fetch user bids")
  }
}

export async function updateUserCardInfo(paymentMethodId:string){
  try{
    const sessionId = localStorage.getItem("sessionId");
    const response = await axios.patch(
      `${BACKEND_URL}/api/user/card-info`,
      { paymentMethodId },
      {
        withCredentials: true,
        headers: {
          Authorization: `Bearer ${sessionId}`,
        },
      }
    );
    return response.data;
  }
  catch(e:any){
    throw new Error(e.response?.data?.error || "Failed to fetch user bids")
  }
}

export async function validateSession() {
  try {
    const sessionId = localStorage.getItem("sessionId");
    const response = await axios.get(`${BACKEND_URL}/api/auth/authenticate`, {
      withCredentials: true,
      headers: {
        Authorization: `Bearer ${sessionId}`,
      },
    });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || "Authentication failed");
  }
}
