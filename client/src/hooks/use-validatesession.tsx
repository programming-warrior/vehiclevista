// client/src/hooks/useValidateSession.ts

import { useEffect, useState } from "react";
import { useUser } from "./use-store";
import { validateSession } from "@/api";
import { useToast } from "./use-toast";

export function useValidateSession() {
  const { setUser } = useUser();
  const { toast } = useToast();
  const [isValidating, setIsValidating] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      try {
        console.log('check session')
        setIsValidating(true);
        const userData = await validateSession();
        
        setUser({
          userId: userData.userId,
          role: userData.role
        });
        
      } catch (error) {
        console.log("Session validation failed or no session exists");
      } finally {
        setIsValidating(false);
      }
    };

    checkSession();
  }, [setUser]);

  return { isValidating };
}