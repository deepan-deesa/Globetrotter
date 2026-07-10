import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
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
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Edit, Trash2, Globe, Lock, MapPin, Calendar } from "lucide-react";
import { motion } from "framer-motion";
import TripItinerary from "@/components/TripItinerary";
import AddStopDialog from "@/components/AddStopDialog";
import { type TripStop, type TripActivity } from "@shared/schema";

interface Trip {
    id: number;
    title: string;
    description: string | null;
    isPublic: boolean;
    createdAt: string;
}

export default function TripDetail() {
    const { id } = useParams<{ id: string }>();
    const [, setLocation] = useLocation();
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const { data: trip, isLoading } = useQuery<Trip>({
        queryKey: ["trip", id],
        queryFn: async () => {
            const res = await fetch(`/api/trips/${id}`, { credentials: "include" });
            if (!res.ok) {
                if (res.status === 404) throw new Error("Trip not found");
                throw new Error("Failed to fetch trip");
            }
            return res.json();
        },
        enabled: !!id,
    });

    const { data: stops } = useQuery<TripStop[]>({
        queryKey: ["stops", id],
        queryFn: async () => {
            const res = await fetch(`/api/trips/${id}/stops`);
            if (!res.ok) throw new Error("Failed to fetch stops");
            return res.json();
        },
        enabled: !!id,
    });

    const { data: allActivities } = useQuery<TripActivity[]>({
        queryKey: ["activities", "all", id],
        queryFn: async () => {
            const res = await fetch(`/api/trips/${id}/activities`);
            if (!res.ok) throw new Error("Failed to fetch activities");
            return res.json();
        },
        enabled: !!id,
    });

    const totalBudget = allActivities?.reduce((acc, act) => acc + parseFloat(act.cost || "0"), 0) || 0;

    const tripDuration = stops && stops.length > 0
        ? Math.max(1, Math.ceil((new Date(stops[stops.length - 1].departureDate).getTime() - new Date(stops[0].arrivalDate).getTime()) / (1000 * 60 * 60 * 24)))
        : 1;

    const dailyAverage = totalBudget / tripDuration;
    const isOverBudget = dailyAverage > 200;

    const togglePublicMutation = useMutation({
        mutationFn: async () => {
            const res = await fetch(`/api/trips/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isPublic: !trip?.isPublic }),
            });
            if (!res.ok) throw new Error("Failed to update trip privacy");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["trip", id] });
            toast({
                title: "Privacy updated",
                description: `Your trip is now ${!trip?.isPublic ? "public" : "private"}.`,
            });
        },
        onError: (error: Error) => {
            toast({
                title: "Update failed",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    const deleteTripMutation = useMutation({
        mutationFn: async () => {
            const res = await fetch(`/api/trips/${id}`, {
                method: "DELETE",
                credentials: "include",
            });
            if (!res.ok) throw new Error("Failed to delete trip");
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["trips"] });
            toast({
                title: "Trip deleted",
                description: "Your trip has been deleted successfully.",
            });
            setLocation("/trips");
        },
        onError: (error: Error) => {
            toast({
                title: "Failed to delete trip",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    if (isLoading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-12 w-64" />
                <Skeleton className="h-96 w-full" />
            </div>
        );
    }

    if (!trip) {
        return (
            <Card>
                <CardContent className="flex flex-col items-center justify-center py-16">
                    <MapPin className="w-16 h-16 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Trip not found</h3>
                    <p className="text-muted-foreground mb-6">
                        This trip doesn't exist or you don't have access to it.
                    </p>
                    <Button onClick={() => setLocation("/trips")}>
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Trips
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setLocation("/trips")}
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <h1 className="text-3xl font-bold">{trip.title}</h1>
                            <Badge variant={trip.isPublic ? "default" : "secondary"} className="gap-1">
                                {trip.isPublic ? (
                                    <>
                                        <Globe className="w-3 h-3" />
                                        Public
                                    </>
                                ) : (
                                    <>
                                        <Lock className="w-3 h-3" />
                                        Private
                                    </>
                                )}
                            </Badge>
                        </div>
                        <p className="text-muted-foreground">
                            Created {new Date(trip.createdAt).toLocaleDateString()}
                        </p>
                    </div>
                </div>

                <div className="flex gap-2">
                    <Button variant="outline" className="gap-2">
                        <Edit className="w-4 h-4" />
                        Edit
                    </Button>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive" className="gap-2">
                                <Trash2 className="w-4 h-4" />
                                Delete
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This will permanently delete "{trip.title}" and all associated data.
                                    This action cannot be undone.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={() => deleteTripMutation.mutate()}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                    Delete Trip
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </div>

            {/* Content */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid gap-6 md:grid-cols-3"
            >
                {/* Main Content */}
                <div className="md:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Description</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">
                                {trip.description || "No description provided for this trip."}
                            </p>
                        </CardContent>
                    </Card>

                    <Card id="itinerary-section">
                        <CardHeader className="pb-3">
                            <CardTitle>Itinerary</CardTitle>
                            <CardDescription>Stops and activities for this trip</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <TripItinerary tripId={Number(id)} />
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Quick Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <AddStopDialog tripId={Number(id)} />
                            <Button variant="outline" className="w-full justify-start gap-2" onClick={() => {
                                const el = document.getElementById('itinerary-section');
                                if (el) el.scrollIntoView({ behavior: 'smooth' });
                            }}>
                                <Calendar className="w-4 h-4" />
                                Build Itinerary
                            </Button>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Trip Stats</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Stops</span>
                                <span className="font-medium">{stops?.length || 0}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Total Days</span>
                                <span className="font-medium">{tripDuration} days</span>
                            </div>
                            <div className="flex justify-between text-sm pt-2 border-t">
                                <span className="text-muted-foreground">Total Budget</span>
                                <span className="font-bold text-primary">${totalBudget.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Daily Average</span>
                                <span className="font-medium">${dailyAverage.toFixed(2)}</span>
                            </div>
                            {isOverBudget && (
                                <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                                    <p className="text-xs text-destructive font-medium">
                                        Budget Alert: Spending is high (${dailyAverage.toFixed(2)}/day). Average traveler budget is ~$150.
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Share Trip</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-sm text-muted-foreground">
                                {trip.isPublic
                                    ? "Anyone with the link can view this trip."
                                    : "Only you can see this trip."}
                            </p>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    className="flex-1 gap-2"
                                    onClick={() => togglePublicMutation.mutate()}
                                    disabled={togglePublicMutation.isPending}
                                >
                                    {trip.isPublic ? <Lock className="w-4 h-4" /> : <Globe className="w-4 h-4" />}
                                    Make {trip.isPublic ? "Private" : "Public"}
                                </Button>
                                {trip.isPublic && (
                                    <Button
                                        variant="default"
                                        className="flex-1"
                                        onClick={() => {
                                            const url = `${window.location.origin}/share/${trip.id}`;
                                            navigator.clipboard.writeText(url);
                                            toast({ title: "Link copied!", description: "Share it with your friends." });
                                        }}
                                    >
                                        Copy Link
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </motion.div>
        </div>
    );
}
