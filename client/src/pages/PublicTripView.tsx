import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Globe, MapPin, Calendar, Home } from "lucide-react";
import { motion } from "framer-motion";
import TripItinerary from "@/components/TripItinerary";
import { type TripStop, type TripActivity } from "@shared/schema";

interface Trip {
    id: number;
    title: string;
    description: string | null;
    isPublic: boolean;
    createdAt: string;
}

export default function PublicTripView() {
    const { id } = useParams<{ id: string }>();
    const [, setLocation] = useLocation();

    const { data: trip, isLoading, error } = useQuery<Trip>({
        queryKey: ["trip", "public", id],
        queryFn: async () => {
            const res = await fetch(`/api/trips/${id}`);
            if (!res.ok) {
                if (res.status === 403) throw new Error("This trip is private.");
                throw new Error("Trip not found.");
            }
            return res.json();
        },
        enabled: !!id,
        retry: false
    });

    const { data: stops } = useQuery<TripStop[]>({
        queryKey: ["stops", "public", id],
        queryFn: async () => {
            const res = await fetch(`/api/trips/${id}/stops`);
            if (!res.ok) throw new Error("Failed to fetch stops");
            return res.json();
        },
        enabled: !!trip,
    });

    const { data: allActivities } = useQuery<TripActivity[]>({
        queryKey: ["activities", "all", "public", id],
        queryFn: async () => {
            const res = await fetch(`/api/trips/${id}/activities`);
            if (!res.ok) throw new Error("Failed to fetch activities");
            return res.json();
        },
        enabled: !!trip,
    });

    const totalBudget = allActivities?.reduce((acc, act) => acc + parseFloat(act.cost || "0"), 0) || 0;

    if (isLoading) {
        return (
            <div className="container mx-auto py-8 px-4 space-y-6 max-w-4xl">
                <Skeleton className="h-12 w-64" />
                <Skeleton className="h-96 w-full" />
            </div>
        );
    }

    if (error || !trip) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
                <Card className="max-w-md w-full text-center">
                    <CardContent className="py-12">
                        <MapPin className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-xl font-bold mb-2">Access Denied</h3>
                        <p className="text-muted-foreground mb-6">
                            {error instanceof Error ? error.message : "This trip doesn't exist or is not public."}
                        </p>
                        <Button onClick={() => setLocation("/")} className="gap-2">
                            <Home className="w-4 h-4" />
                            Go to Home
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-muted/10 pb-20">
            {/* Simple Top Nav */}
            <div className="bg-white border-b px-6 py-4 mb-8">
                <div className="container mx-auto max-w-5xl flex justify-between items-center">
                    <div className="flex items-center gap-2 font-bold text-xl text-primary">
                        <img src="/favicon.png" alt="GlobeTrotter Logo" className="w-8 h-8 object-contain" />
                        GlobeTrotter Share
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setLocation("/")}>
                        Sign In to Create Your Own
                    </Button>
                </div>
            </div>

            <main className="container mx-auto px-4 max-w-4xl space-y-8">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                >
                    <div className="flex flex-wrap items-center gap-3">
                        <h1 className="text-4xl font-extrabold tracking-tight">{trip.title}</h1>
                        <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 gap-1 px-3 py-1">
                            <Globe className="w-3 h-3" />
                            Public Itinerary
                        </Badge>
                    </div>
                    <p className="text-xl text-muted-foreground leading-relaxed">
                        {trip.description || "A curated travel experience."}
                    </p>
                </motion.div>

                <div className="grid gap-8 md:grid-cols-3">
                    <div className="md:col-span-2">
                        <Card className="shadow-sm">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Calendar className="w-5 h-5 text-primary" />
                                    Itinerary Overview
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {/* Pass a readOnly prop or handle it inside TripItinerary if needed */}
                                {/* For simplicity, we'll check inside TripItinerary for auth, but here we just need viewing */}
                                <TripItinerary tripId={trip.id} />
                            </CardContent>
                        </Card>
                    </div>

                    <div className="space-y-6">
                        <Card className="shadow-sm border-primary/10">
                            <CardHeader>
                                <CardTitle>Trip Stats</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex justify-between text-sm py-2 border-b">
                                    <span className="text-muted-foreground">Destinations</span>
                                    <span className="font-bold">{stops?.length || 0}</span>
                                </div>
                                <div className="flex justify-between text-sm py-2 border-b">
                                    <span className="text-muted-foreground">Total Budget</span>
                                    <span className="font-bold text-primary">${totalBudget.toFixed(2)}</span>
                                </div>
                                <div className="pt-2 text-xs text-muted-foreground leading-relaxed">
                                    Shared with you by a GlobeTrotter traveler. Use this itinerary as inspiration for your next adventure!
                                </div>
                                <Button className="w-full mt-4" onClick={() => setLocation("/signup")}>
                                    Plan Your Own Trip
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    );
}
