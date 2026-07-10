import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Map, Globe, Lock } from "lucide-react";
import { motion } from "framer-motion";

interface Trip {
  id: number;
  title: string;
  description: string | null;
  isPublic: boolean;
  createdAt: string;
}

export default function MyTrips() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: trips, isLoading } = useQuery<Trip[]>({
    queryKey: ["trips"],
    queryFn: async () => {
      const res = await fetch("/api/trips", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch trips");
      return res.json();
    },
  });

  const filteredTrips = trips?.filter((trip) =>
    trip.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    trip.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Trips</h1>
          <p className="text-muted-foreground mt-1">
            Manage and view all your travel plans
          </p>
        </div>
        <Link href="/create-trip">
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            New Trip
          </Button>
        </Link>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search trips..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Trips Grid */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      ) : filteredTrips && filteredTrips.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredTrips.map((trip, index) => (
            <motion.div
              key={trip.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Link href={`/trips/${trip.id}`}>
                <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer group">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <Map className="w-8 h-8 text-primary group-hover:scale-110 transition-transform" />
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
                    <CardTitle className="line-clamp-1 group-hover:text-primary transition-colors">
                      {trip.title}
                    </CardTitle>
                    <CardDescription className="line-clamp-2">
                      {trip.description || "No description provided"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground">
                      Created {new Date(trip.createdAt).toLocaleDateString()}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Map className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {searchQuery ? "No trips found" : "No trips yet"}
            </h3>
            <p className="text-muted-foreground text-center mb-6 max-w-sm">
              {searchQuery
                ? "Try adjusting your search query"
                : "Start planning your adventures by creating your first trip"}
            </p>
            {!searchQuery && (
              <Link href="/create-trip">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Trip
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
