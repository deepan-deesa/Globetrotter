import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Map, Calendar, DollarSign, Users, TrendingUp, Sparkles, Globe2 } from "lucide-react";
import { motion } from "framer-motion";

interface Trip {
  id: number;
  title: string;
  description: string | null;
  isPublic: boolean;
  createdAt: string;
  startDate: string | null;
  endDate: string | null;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100
    }
  }
};

export default function Dashboard() {
  const { user } = useAuth();

  const { data: trips, isLoading } = useQuery<Trip[]>({
    queryKey: ["trips"],
    queryFn: async () => {
      const res = await fetch("/api/trips", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch trips");
      return res.json();
    },
  });

  const stats = [
    {
      title: "Total Trips",
      value: trips?.length || 0,
      icon: Map,
      color: "text-blue-600",
      bgColor: "bg-gradient-to-br from-blue-50 to-blue-100",
      iconBg: "bg-blue-500",
    },
    {
      title: "Upcoming",
      value: trips?.length || 0,
      icon: Calendar,
      color: "text-green-600",
      bgColor: "bg-gradient-to-br from-green-50 to-green-100",
      iconBg: "bg-green-500",
    },
    {
      title: "Total Budget",
      value: "$0",
      icon: DollarSign,
      color: "text-purple-600",
      bgColor: "bg-gradient-to-br from-purple-50 to-purple-100",
      iconBg: "bg-purple-500",
    },
    {
      title: "Shared Trips",
      value: "0",
      icon: Users,
      color: "text-orange-600",
      bgColor: "bg-gradient-to-br from-orange-50 to-orange-100",
      iconBg: "bg-orange-500",
    },
  ];

  return (
    <motion.div
      className="space-y-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Hero Section */}
      <motion.div
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-background p-8 md:p-12 border border-primary/10"
        variants={itemVariants}
      >
        <div className="relative z-10 max-w-2xl">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Welcome back, {user?.name?.split(" ")[0] || "Traveler"}!
            </h1>
          </motion.div>
          <motion.p
            className="text-lg text-muted-foreground mt-4"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            Plan your next adventure and track your journeys with ease
          </motion.p>
          <motion.div
            className="mt-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Link href="/create-trip">
              <motion.div
                whileHover={{ scale: 1.05, boxShadow: "0 10px 30px rgba(0,0,0,0.15)" }}
                whileTap={{ scale: 0.95 }}
              >
                <Button size="lg" className="gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg">
                  <Sparkles className="w-5 h-5" />
                  Create New Trip
                </Button>
              </motion.div>
            </Link>
          </motion.div>
        </div>

        {/* Decorative Globe Icon */}
        <motion.div
          className="absolute right-8 top-1/2 -translate-y-1/2 opacity-10"
          animate={{
            rotate: 360,
            scale: [1, 1.1, 1]
          }}
          transition={{
            rotate: { duration: 20, repeat: Infinity, ease: "linear" },
            scale: { duration: 3, repeat: Infinity, ease: "easeInOut" }
          }}
        >
          <Globe2 className="w-48 h-48 md:w-64 md:h-64" />
        </motion.div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
        variants={containerVariants}
      >
        {stats.map((stat, index) => (
          <motion.div
            key={stat.title}
            variants={itemVariants}
            whileHover={{ y: -5, transition: { duration: 0.2 } }}
          >
            <Card className="overflow-hidden border-none shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className={`h-2 ${stat.bgColor}`} />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <motion.div
                  className={`p-3 rounded-xl ${stat.iconBg} shadow-lg`}
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.6 }}
                >
                  <stat.icon className="w-4 h-4 text-white" />
                </motion.div>
              </CardHeader>
              <CardContent>
                <motion.div
                  className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent"
                  initial={{ scale: 0.5 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: index * 0.1 + 0.2, type: "spring" }}
                >
                  {stat.value}
                </motion.div>
                <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  All time
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Recent Trips */}
      <motion.div className="grid gap-6 md:grid-cols-2" variants={containerVariants}>
        <Card>
          <CardHeader>
            <CardTitle>Recent Trips</CardTitle>
            <CardDescription>Your latest travel plans</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : trips && trips.length > 0 ? (
              <div className="space-y-3">
                {trips.slice(0, 3).map((trip) => (
                  <Link key={trip.id} href={`/trips/${trip.id}`}>
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className="p-4 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold">{trip.title}</h3>
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {trip.description || "No description"}
                          </p>
                        </div>
                        <Map className="w-5 h-5 text-muted-foreground ml-2" />
                      </div>
                    </motion.div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Map className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground mb-4">No trips yet</p>
                <Link href="/create-trip">
                  <Button variant="outline" size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Trip
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Get started with your planning</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/create-trip">
              <Button variant="outline" className="w-full justify-start gap-2">
                <Plus className="w-4 h-4" />
                Create New Trip
              </Button>
            </Link>
            <Link href="/trips">
              <Button variant="outline" className="w-full justify-start gap-2">
                <Map className="w-4 h-4" />
                View All Trips
              </Button>
            </Link>
            <Link href="/builder">
              <Button variant="outline" className="w-full justify-start gap-2">
                <Calendar className="w-4 h-4" />
                Build Itinerary
              </Button>
            </Link>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div >
  );
}
