import React, { useEffect, useState, useRef } from "react";
import { useWebSocket } from "@/hooks/use-store";

export default function RaffleCountDownTimer({ raffle, setRaffle }: { raffle: any, setRaffle: any }) {
  const [timeLeft, setTimeLeft] = useState<string>("00:00:00:00");
  const { socket } = useWebSocket();
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isSubscribedRef = useRef<boolean>(false);

  // Effect 1: Handle WebSocket subscription (only runs when socket or raffle.id changes)
  useEffect(() => {
    if (!socket || socket.readyState !== WebSocket.OPEN || isSubscribedRef.current) {
      return;
    }

    console.log("subscribing to raffle");
    socket.send(
      JSON.stringify({
        type: "subscribe",
        payload: {
          raffleId: raffle.id,
        },
      })
    );
    isSubscribedRef.current = true;

    // Handle WebSocket messages
    const handleWebSocketMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        console.log(data);
        if (data.event === "RAFFLE_TIMER") {
          console.log("updating remainignt time");
          setRaffle((prev: any) =>
            prev.id.toString() === data.message.raffleId
              ? { ...prev, remainingTime: data.message.remainingTime }
              : prev
          );
        }
      } catch (err) {
        console.error("Error processing WebSocket message:", err);
      }
    };

    socket.addEventListener("message", handleWebSocketMessage);

    // Cleanup function for WebSocket
    return () => {
      console.log("WebSocket cleanup");
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(
          JSON.stringify({
            type: "unsubscribe",
            payload:{
              raffleId: raffle.id,
            }
          })
        );
      }
      socket.removeEventListener("message", handleWebSocketMessage);
      isSubscribedRef.current = false;
    };
  }, [socket]); // Only depend on socket and raffle.id


  // Effect 2: Handle timer display updates
  useEffect(() => {
    console.log('side effect of raffle remaining time udpate')
    const updateTimerDisplay = (distance: number) => {
      if (distance <= 0) {
        setTimeLeft("Ended");
        return;
      }

      const totalSeconds = Math.floor(distance / 1000);
      const days = Math.floor(totalSeconds / (3600 * 24));
      const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      setTimeLeft(
        `${days.toString().padStart(2, "0")}:${hours
          .toString()
          .padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds
          .toString()
          .padStart(2, "0")}`
      );
    };

    // Initial display update
    const initialDistance = raffle.remainingTime || 0;
    updateTimerDisplay(initialDistance);

    // Set up local timer if WebSocket is not available
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      console.log("Socket is not open, starting local timer.");
      timerRef.current = setInterval(() => {
        const now = new Date().getTime();
        const endTimeDate = new Date(raffle.endDate).getTime();
        const distance = endTimeDate - now;
        updateTimerDisplay(distance);
      }, 1000);
    } else {
      // WebSocket is available, just update display when remainingTime changes
      updateTimerDisplay(raffle.remainingTime || 0);
    }

    // Cleanup timer
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [raffle.remainingTime, socket]); // This can safely depend on remainingTime now

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log("Component unmount cleanup");
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  return <span>{timeLeft}</span>;
}