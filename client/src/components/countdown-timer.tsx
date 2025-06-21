import React, { useEffect, useState, useRef } from "react";
import { useWebSocket } from "@/hooks/use-store";

export default function CountdownTimer({
  auction,
  setAuction,
}: {
  auction: any;
  setAuction: any;
}) {
  const [timeLeft, setTimeLeft] = useState<string>("00:00:00:00");
  const { socket } = useWebSocket();
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isSubscribedRef = useRef<boolean>(false);
  // console.log(timeLeft);

  useEffect(() => {
    // Set up timer to decrease remainingTime locally every second
    if (
      !socket ||
      socket.readyState !== WebSocket.OPEN ||
      isSubscribedRef.current
    ) {
      return;
    }

    socket.send(
      JSON.stringify({
        type: "subscribe",
        payload: {
          auctionId: auction.id,
        },
      })
    );

    isSubscribedRef.current = true;
    // Handle WebSocket messages
    const handleWebSocketMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        if (data.event === "AUCTION_TIMER") {
          setAuction((prevAuction: any) =>
            prevAuction.id.toString() === data.message.auctionId
              ? { ...prevAuction, remainingTime: data.message.remainingTime }
              : prevAuction
          );
        }
      } catch (err) {
        console.error("Error processing WebSocket message:", err);
      }
    };

    socket.addEventListener("message", handleWebSocketMessage);

    return () => {
      console.log("WebSocket cleanup");
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(
          JSON.stringify({
            type: "unsubscribe",
            payload: {
              auctionId: auction.id,
            },
          })
        );
      }
      socket.removeEventListener("message", handleWebSocketMessage);
      isSubscribedRef.current = false;
    };
  }, [socket]);

  useEffect(() => {
    const initialDistance = auction.remainingTime || 0;

    updateTimerDisplay(initialDistance);

    if (!socket || socket.readyState !== WebSocket.OPEN) {
      console.log("Socket is not open, not starting timer.");
      timerRef.current = setInterval(() => {
        // console.log("timer running: " + auction.id);
        const now = new Date().getTime();
        const endTimeDate = new Date(auction.endDate).getTime();
        let distance = endTimeDate - now;
        updateTimerDisplay(distance);
      }, 1000);
    }

    function updateTimerDisplay(distance: number) {
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
    }

    return () => {};
  }, [auction.remainingTime, socket]);

  useEffect(() => {
    return () => {
      console.log("Component unmount cleanup");
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  return (
    <span>{timeLeft}</span>
    // <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-center py-2 px-4">
    // </div>
  );
}
