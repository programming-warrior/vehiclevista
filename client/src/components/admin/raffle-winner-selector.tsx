"use client";

import * as React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getBidsForRaffle, chooseWinner } from "@/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useEffect, useState } from "react";

type Entrant = {
  userId: number;
  username: string;
  ticketQtn: number;
};

type Props = {
  raffleId: Number;
  currentWinnerId?: string | null;
  onSaved?: (winnerId: string) => void;
};

export function RaffleWinnerSelector({
  raffleId,
  currentWinnerId,
  onSaved,
}: Props) {
  const { toast } = useToast();

  const [bids, setBids] = useState<any>([]);
  const entrants: Entrant[] = Object.values(
    bids.reduce((acc: any, curr: any) => {
      if (!acc[curr.userId]) {
        acc[curr.userId] = {
          userId: curr.userId,
          username: curr.user.username,
          ticketQtn: 0,
        };
      }
      acc[curr.userId].ticketQtn += curr.ticketQtn;
      return acc;
    }, {})
  );
  const totalTickets = entrants.reduce(
    (sum: number, e: Entrant) => sum + (e.ticketQtn || 0),
    0
  );

  const [selectedId, setSelectedId] = useState<number | undefined>(
    undefined
  );
  const [submitting, setSubmitting] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);

  const pickRandomWeighted = () => {
    if (!entrants?.length || totalTickets <= 0) return;
    let r = Math.floor(Math.random() * totalTickets) + 1;
    console.log(r);
    for (const e of entrants) {
      r -= e.ticketQtn;
      if (r <= 0) {
        console.log(e.userId)
        setSelectedId(e.userId);
        return;
      }
    }
  };

  useEffect(() => {
    const fetchRaffleBids = async () => {
      try {
        const response = await getBidsForRaffle(raffleId.toString());
        setBids(response.purchaseHistory || []);
      } catch (error) {
        console.error("Error fetching bids:", error);
      }
    };

    fetchRaffleBids();
  }, [raffleId]);

  async function saveWinner() {
    if (!selectedId) {
      toast({
        title: "No user selected",
        description: "Please select a user to set as the winner.",
      });
      return;
    }
    try {
      setSubmitting(true);
      await chooseWinner(raffleId.toString(), selectedId.toString());
      toast({
        title: "Winner saved",
        description: "The selected user has been recorded as the winner.",
      });
      // onSaved?.(selectedId);
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.message ?? "Unable to save winner.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="border border-blue-100 bg-white">
      <CardHeader>
        <CardTitle className="text-blue-800">Select Raffle Winner</CardTitle>
        <CardDescription className="text-blue-600">
          Choose one user from all purchasers. You can select manually or pick
          randomly weighted by tickets.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div className="flex flex-col gap-2">
            <Label htmlFor="winner" className="text-blue-700">
              Winner
            </Label>
            <Select
              value={selectedId?.toString() ?? ""}
              onValueChange={(v) => setSelectedId(Number(v))}
              disabled={isLoading || entrants.length === 0}
            >
              <SelectTrigger id="winner" className="w-full border-blue-200">
                <SelectValue
                  placeholder={isLoading ? "Loading..." : "Select a user"}
                />
              </SelectTrigger>
              <SelectContent>
                {entrants.map((e) => (
                  <SelectItem key={e.userId} value={e.userId.toString()}>
                    {e.username}{" "}
                    {e.ticketQtn > 0
                      ? `(${e.ticketQtn} ticket${e.ticketQtn > 1 ? "s" : ""})`
                      : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {currentWinnerId && (
              <p className="text-sm text-blue-600">
                Current winner:{" "}
                <span className="font-medium">
                  {entrants.find((e: any) => e.userId === currentWinnerId)
                    ?.username ?? currentWinnerId}
                </span>
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label className="text-blue-700">Actions</Label>
            <div className="flex flex-col gap-2">
              <Button
                type="button"
                variant="secondary"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                onClick={pickRandomWeighted}
                disabled={isLoading || entrants.length === 0}
              >
                Pick Randomly (Weighted)
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    type="button"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    disabled={!selectedId || submitting}
                  >
                    {submitting ? "Saving..." : "Set as Winner"}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-white border-blue-100">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-blue-800">
                      Confirm winner
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-blue-600">
                      This will record{" "}
                      <span className="font-medium">
                        {entrants.find((e: any) => e.id === selectedId)
                          ?.username ?? "the selected user"}
                      </span>{" "}
                      as the winner for this raffle.
                      <p className="text-red-500">This action cannot be undone </p>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="border-blue-600 text-blue-600">
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={saveWinner}
                      disabled={submitting}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Confirm
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label className="text-blue-700">Stats</Label>
            <div className="flex flex-col gap-2">
              <Badge
                variant="outline"
                className="text-blue-700 border-blue-200 bg-blue-50 w-fit"
              >
                Users: {entrants.length}
              </Badge>
              <Badge
                variant="outline"
                className="text-blue-700 border-blue-200 bg-blue-50 w-fit"
              >
                Tickets: {totalTickets}
              </Badge>
            </div>
          </div>
        </div>

        <div className="rounded-md border border-blue-100 bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-blue-700">User</TableHead>
                <TableHead className="text-right text-blue-700">
                  Tickets
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entrants.map((e: any) => (
                <TableRow key={e.id} data-selected={e.id === selectedId}>
                  <TableCell className="font-medium text-blue-800">
                    {e.user?.username || e.username || e.name}
                  </TableCell>
                  <TableCell className="text-right text-blue-800">
                    {e.ticketQtn}
                  </TableCell>
                </TableRow>
              ))}
              {entrants.length === 0 && (
                <TableRow>
                  <TableCell colSpan={2} className="text-center text-blue-500">
                    No purchasers yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

export default RaffleWinnerSelector;
