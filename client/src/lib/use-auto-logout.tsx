import { useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useUser } from "@/hooks/use-store";
import { logoutUser } from "@/api";
import axios from "axios";
import { BACKEND_URL } from "./constants";
const AUTO_LOGOUT_MINUTES = 15;

const events = ["mousemove", "keydown", "click", "scroll", "touchstart"];

export function useAutoLogout(userRole: string) {
  const timerRef = useRef<number | null>(null);
  const [location, setLocation] = useLocation();
  const { setUser } = useUser();

  const logout = async () => {
    try{
      console.log("logout called");
      localStorage.removeItem("sessionId");
      setUser({
        userId: "",
        role: "",
        card_Verified: false,
      });
      events.forEach((event) => window.removeEventListener(event, resetTimer));
      await logoutUser();
      setLocation("/login");
    }
    catch(e){

    }
  };

  let lastping = 0;

  const resetTimer = () => {
    console.log("resetting...");
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(
      logout,
      AUTO_LOGOUT_MINUTES * 60 * 1000
    );
    let now = Date.now();
    if (now - lastping >= 60 * 1000) {
      lastping = now;
      axios.post(
        `${BACKEND_URL}/api/admin/keep-alive`,
        {},
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("sessionId")}`,
          },
          withCredentials: true,
        }
      ).catch(e=>console.log(e))
    }
  };

  useEffect(() => {
    console.log("userRole" + userRole);
    if (userRole != "admin") return;

    events.forEach((event) => window.addEventListener(event, resetTimer));

    console.log("auto logout inactivity timer started");
    // Start the timer initially
    resetTimer();

    return () => {
      events.forEach((event) => window.removeEventListener(event, resetTimer));
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [userRole]);
}
