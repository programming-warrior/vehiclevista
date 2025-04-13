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
    const response = await axios.delete(`${BACKEND_URL}/api/auth/logout`);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Logout failed");
  }
}


export async function validateSession() {
  try {
    const response = await axios.get(`${BACKEND_URL}/api/auth/authenticate`, {
      withCredentials: true,
    });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || "Authentication failed");
  }
}
