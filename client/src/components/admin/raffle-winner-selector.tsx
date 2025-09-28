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

type Entrant = {
  id: string;
  name: string;
  tickets: number;
};

type Props = {
  // Raffle identifier used by the API route
  raffleId: Number;
  // Optional static entrants list (unique users and their ticket counts)
  entrants?: any;
  // Optional URL to load entrants from. Response should be { entrants: Entrant[] }
  entrantsApi?: string;
  // Existing winner (if already chosen)
  currentWinnerId?: string | null;
  // Called after a winner is saved
  onSaved?: (winnerId: string) => void;
};

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function RaffleWinnerSelector({
  raffleId,
  entrants: entrantsProp,
  entrantsApi,
  currentWinnerId,
  onSaved,
}: Props) {
  const { toast } = useToast();
  //   const { data, isLoading } = useSWR<{ entrants: Entrant[] }>(
  //     entrantsApi ? entrantsApi : null,
  //     entrantsApi ? fetcher : null,
  //   )

  //   const entrants = React.useMemo<Entrant[]>(() => entrantsProp ?? data?.entrants ?? [], [entrantsProp, data?.entrants])
  const entrants = entrantsProp;
  const totalTickets = React.useMemo(
    () => entrants.reduce((sum: any, e: any) => sum + (e.tickets || 0), 0),
    [entrants]
  );

  const [selectedId, setSelectedId] = React.useState<string | undefined>(
    currentWinnerId ?? undefined
  );
  const [submitting, setSubmitting] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);

  // Weighted random pick by tickets count
  const pickRandomWeighted = React.useCallback(() => {
    if (!entrants?.length || totalTickets <= 0) return;
    let r = Math.floor(Math.random() * totalTickets) + 1;
    for (const e of entrants) {
      r -= e.tickets;
      if (r <= 0) {
        setSelectedId(e.id);
        return;
      }
    }
  }, [entrants, totalTickets]);

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
      const res = await fetch(`/api/raffles/${raffleId}/winner`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ winnerUserId: selectedId }),
      });
      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || "Failed to set winner");
      }
      toast({
        title: "Winner saved",
        description: "The selected user has been recorded as the winner.",
      });
      onSaved?.(selectedId);
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
              value={selectedId ?? ""}
              onValueChange={(v) => setSelectedId(v)}
              disabled={isLoading || entrants.length === 0}
            >
              <SelectTrigger id="winner" className="w-full border-blue-200">
                <SelectValue
                  placeholder={isLoading ? "Loading..." : "Select a user"}
                />
              </SelectTrigger>
              <SelectContent>
                {entrants.map((e: any) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.user?.username || e.username || e.name}{" "}
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
                  {entrants.find((e: any) => e.id === currentWinnerId)?.user
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
                        {entrants.find((e: any) => e.id === selectedId)?.user
                          ?.username ?? "the selected user"}
                      </span>{" "}
                      as the winner for this raffle.
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