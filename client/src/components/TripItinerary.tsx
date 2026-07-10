import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { type TripStop, type TripActivity, type Activity } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Calendar, Plus, Trash2, Clock, DollarSign } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import AddStopDialog from "./AddStopDialog";
import AddActivityDialog from "./AddActivityDialog";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

interface TripItineraryProps {
    tripId: number;
    readOnly?: boolean;
}

export default function TripItinerary({ tripId, readOnly = false }: TripItineraryProps) {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [viewMode, setViewMode] = useState<'stop' | 'day'>('stop');

    const { data: stops, isLoading: isLoadingStops } = useQuery<TripStop[]>({
        queryKey: ["stops", tripId],
        queryFn: async () => {
            const res = await fetch(`/api/trips/${tripId}/stops`);
            if (!res.ok) throw new Error("Failed to fetch stops");
            return res.json();
        },
    });

    const { data: allActivities } = useQuery<TripActivity[]>({
        queryKey: ["activities", "all", tripId],
        queryFn: async () => {
            const res = await fetch(`/api/trips/${tripId}/activities`);
            if (!res.ok) throw new Error("Failed to fetch activities");
            return res.json();
        },
    });

    const deleteStopMutation = useMutation({
        mutationFn: async (stopId: number) => {
            const res = await fetch(`/api/stops/${stopId}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Failed to delete stop");
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["stops", tripId] });
            toast({ title: "Stop removed" });
        },
    });

    if (isLoadingStops) {
        return (
            <div className="space-y-4">
                {[1, 2].map((i) => (
                    <Skeleton key={i} className="h-40 w-full" />
                ))}
            </div>
        );
    }

    if (!stops || stops.length === 0) {
        return (
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
                <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <h3 className="text-lg font-semibold mb-1">No stops added</h3>
                {readOnly ? (
                    <p className="text-muted-foreground">This trip has no destinations yet.</p>
                ) : (
                    <>
                        <p className="text-muted-foreground mb-6">Start by adding the first city of your trip.</p>
                        <AddStopDialog tripId={tripId} />
                    </>
                )}
            </div>
        );
    }

    // Daily View Data Preparation
    const activitiesByDate = allActivities?.reduce((acc, act) => {
        const date = format(new Date(act.scheduledDate), "yyyy-MM-dd");
        if (!acc[date]) acc[date] = [];
        acc[date].push(act);
        return acc;
    }, {} as Record<string, TripActivity[]>) || {};

    const sortedDates = Object.keys(activitiesByDate).sort();

    return (
        <div className="space-y-6">
            <div className="flex justify-center p-1 bg-muted/50 rounded-lg w-fit mx-auto border shadow-sm">
                <Button
                    variant={viewMode === 'stop' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('stop')}
                    className="text-xs px-4 h-8 gap-2"
                >
                    <MapPin className="w-3 h-3" />
                    Destinations
                </Button>
                <Button
                    variant={viewMode === 'day' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('day')}
                    className="text-xs px-4 h-8 gap-2"
                >
                    <Calendar className="w-3 h-3" />
                    Day-by-Day
                </Button>
            </div>

            {viewMode === 'stop' ? (
                <div className="space-y-8 relative before:absolute before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-muted">
                    <AnimatePresence>
                        {stops.map((stop, index) => (
                            <motion.div
                                key={stop.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                transition={{ delay: index * 0.1 }}
                                className="relative pl-12"
                            >
                                <div className="absolute left-0 top-2 w-8 h-8 rounded-full border-4 border-background bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
                                    {index + 1}
                                </div>

                                <Card className="overflow-hidden border-primary/10">
                                    <div className="bg-primary/5 px-6 py-3 flex justify-between items-center border-b border-primary/10">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-bold text-lg">{stop.cityName}, {stop.country}</h3>
                                            <span className="text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
                                                {differenceInDays(new Date(stop.departureDate), new Date(stop.arrivalDate))} days
                                            </span>
                                        </div>
                                        <div className="flex gap-2">
                                            {!readOnly && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                                    onClick={() => deleteStopMutation.mutate(stop.id)}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                    <CardContent className="p-6">
                                        <div className="flex flex-wrap gap-4 mb-6 text-sm text-muted-foreground">
                                            <div className="flex items-center gap-1">
                                                <Calendar className="w-4 h-4" />
                                                {format(new Date(stop.arrivalDate), "MMM d")} - {format(new Date(stop.departureDate), "MMM d, yyyy")}
                                            </div>
                                            {stop.notes && (
                                                <div className="bg-primary/5 text-primary px-3 py-1 rounded-md border border-primary/10 italic text-xs">
                                                    "{stop.notes}"
                                                </div>
                                            )}
                                        </div>

                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center">
                                                <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Activities</h4>
                                                {!readOnly && <AddActivityDialog tripId={tripId} stopId={stop.id} />}
                                            </div>
                                            <StopActivities stopId={stop.id} tripId={tripId} readOnly={readOnly} />
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                    {!readOnly && (
                        <div className="pl-12 pt-4">
                            <AddStopDialog
                                tripId={tripId}
                                trigger={
                                    <Button variant="outline" className="w-full border-dashed gap-2 group hover:border-primary hover:bg-primary/5">
                                        <Plus className="w-4 h-4 group-hover:text-primary transition-colors" />
                                        Add Next Stop
                                    </Button>
                                }
                            />
                        </div>
                    )}
                </div>
            ) : (
                <div className="space-y-6">
                    {sortedDates.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-lg border-2 border-dashed">
                            No activities scheduled yet. {readOnly ? "" : "Switch to 'Destinations' to add activities to your stops."}
                        </div>
                    ) : (
                        sortedDates.map((date) => (
                            <div key={date} className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <div className="h-px flex-1 bg-muted" />
                                    <h3 className="text-sm font-bold text-primary px-4 py-1 bg-primary/5 rounded-full border border-primary/10">
                                        {format(new Date(date), "EEEE, MMMM do")}
                                    </h3>
                                    <div className="h-px flex-1 bg-muted" />
                                </div>
                                <div className="grid gap-3">
                                    {(activitiesByDate[date] || []).map((act) => (
                                        <ActivityItem key={act.id} activity={act} tripId={tripId} stopId={act.stopId as number} readOnly={readOnly} />
                                    ))}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}

function StopActivities({ stopId, tripId, readOnly = false }: { stopId: number; tripId: number; readOnly?: boolean }) {
    const { data: activities, isLoading } = useQuery<TripActivity[]>({
        queryKey: ["activities", stopId],
        queryFn: async () => {
            const res = await fetch(`/api/trip-stops/${stopId}/activities`);
            if (!res.ok) throw new Error("Failed to fetch activities");
            return res.json();
        },
    });

    if (isLoading) return <Skeleton className="h-20 w-full" />;

    if (!activities || activities.length === 0) {
        return (
            <div className="text-center py-6 bg-muted/20 rounded-lg border border-dashed text-[11px] text-muted-foreground">
                No activities planned for this city yet.
            </div>
        );
    }

    return (
        <div className="grid gap-3">
            {activities.map((activity) => (
                <ActivityItem key={activity.id} activity={activity} tripId={tripId} stopId={stopId} readOnly={readOnly} />
            ))}
        </div>
    );
}

function ActivityItem({ activity, tripId, stopId, readOnly = false }: { activity: TripActivity; tripId: number; stopId: number; readOnly?: boolean }) {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    const deleteActivityMutation = useMutation({
        mutationFn: async (id: number) => {
            const res = await fetch(`/api/trip-activities/${id}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Failed to delete activity");
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["activities", stopId] });
            queryClient.invalidateQueries({ queryKey: ["activities", "all", String(tripId)] });
            queryClient.invalidateQueries({ queryKey: ["trip", String(tripId)] });
            toast({ title: "Activity removed" });
        },
        onError: (error: Error) => {
            toast({ title: "Failed to remove activity", description: error.message, variant: "destructive" });
        }
    });

    return (
        <div className="flex items-center justify-between p-3 bg-background border rounded-lg hover:shadow-sm transition-all group">
            <div className="flex gap-3 items-center">
                <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <Clock className="w-4 h-4" />
                </div>
                <div>
                    <p className="font-semibold text-sm">{activity.title}</p>
                    <div className="flex items-center gap-3 mt-0.5 text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">
                        <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {format(new Date(activity.scheduledDate), "h:mm a")}
                        </span>
                        <span className="flex items-center gap-1">
                            <DollarSign className="w-3 h-3 text-emerald-500" />
                            {activity.cost}
                        </span>
                    </div>
                </div>
            </div>
            {!readOnly && (
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => deleteActivityMutation.mutate(activity.id)}
                >
                    <Trash2 className="w-3.5 h-3.5" />
                </Button>
            )}
        </div>
    );
}
