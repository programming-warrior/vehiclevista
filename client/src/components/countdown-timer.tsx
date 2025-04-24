import React, { useEffect, useState } from "react";
import { useWebSocket } from "@/hooks/use-store";
import { set } from "date-fns";

export default function CountdownTimer({ auction }: { auction: any }) {
  const [timeLeft, setTimeLeft] = useState<string>("00:00:00:00");
  const { socket } = useWebSocket();

  console.log(timeLeft);

  useEffect(() => {
    console.log(auction);
    const initialDistance = auction.remainingTime;

    updateTimerDisplay(initialDistance);

    // Set up timer to decrease remainingTime locally every second
    let timerId: NodeJS.Timeout | null = null;

    if (!socket || socket.readyState !== WebSocket.OPEN) {
        console.log("Socket is not open, not starting timer.");
      timerId = setInterval(() => {
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
    return () => {
      if (timerId) {
        clearInterval(timerId);
      }
    };
  }, [auction.endTime, auction.remainingTime, socket]);

  return (
    <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-center py-2 px-4">
      {timeLeft}
    </div>
  );
}
