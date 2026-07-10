import {
  users, trips, tripStops, activities, tripActivities, budgets,
  type User, type InsertUser,
  type Trip, type InsertTrip,
  type TripStop, type InsertTripStop,
  type Activity, type InsertActivity,
  type TripActivity, type InsertTripActivity,
  type Budget, type InsertBudget
} from "@shared/schema";
import { db } from "./db";
import { eq, and, sql } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUsers(): Promise<User[]>;
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUserWithPassword(email: string, name: string, password: string): Promise<User>;
  updateUserPassword(userId: number, hashedPassword: string): Promise<void>;
  setResetToken(email: string, token: string, expiry: Date): Promise<void>;
  verifyResetToken(token: string): Promise<User | undefined>;

  // Trip operations
  getTrips(userId: number): Promise<Trip[]>;
  getTrip(id: number, userId: number): Promise<Trip | undefined>;
  getTripById(id: number): Promise<Trip | undefined>;
  createTrip(trip: InsertTrip): Promise<Trip>;
  updateTrip(id: number, userId: number, updates: Partial<InsertTrip>): Promise<Trip | undefined>;
  deleteTrip(id: number, userId: number): Promise<boolean>;

  // Stop operations
  getTripStops(tripId: number): Promise<TripStop[]>;
  getTripStopById(id: number): Promise<TripStop | undefined>;
  getStopsByTrip(tripId: number, userId: number): Promise<TripStop[]>;
  createTripStop(stop: InsertTripStop): Promise<TripStop>;
  updateTripStop(id: number, updates: Partial<InsertTripStop>): Promise<TripStop | undefined>;
  deleteTripStop(id: number): Promise<boolean>;
  updateStopOrder(id: number, userId: number, order: number): Promise<TripStop | undefined>;

  // Activity operations
  getActivities(): Promise<Activity[]>;
  searchActivities(query: string): Promise<Activity[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;
  seedActivities(): Promise<void>;

  // Trip Activity operations
  getTripActivities(tripId: number): Promise<TripActivity[]>;
  getTripActivityById(id: number): Promise<TripActivity | undefined>;
  getTripActivitiesByStop(tripStopId: number, userId: number): Promise<TripActivity[]>;
  createTripActivity(tripActivity: InsertTripActivity): Promise<TripActivity>;
  deleteTripActivity(id: number): Promise<boolean>;

  // Budget operations
  getBudgetsByTrip(tripId: number): Promise<Budget[]>;
  createBudget(budget: InsertBudget): Promise<Budget>;
}

interface MemoryState {
  users: User[];
  trips: Trip[];
  tripStops: TripStop[];
  activities: Activity[];
  tripActivities: TripActivity[];
  budgets: Budget[];
  nextUserId: number;
  nextTripId: number;
  nextTripStopId: number;
  nextActivityId: number;
  nextTripActivityId: number;
  nextBudgetId: number;
}

export class DatabaseStorage implements IStorage {
  private useMemoryFallback = false;
  private memoryState: MemoryState = {
    users: [],
    trips: [],
    tripStops: [],
    activities: [],
    tripActivities: [],
    budgets: [],
    nextUserId: 1,
    nextTripId: 1,
    nextTripStopId: 1,
    nextActivityId: 1,
    nextTripActivityId: 1,
    nextBudgetId: 1,
  };

  constructor() {
    this.seedActivities().catch(() => undefined);
  }

  private async withFallback<T>(operation: () => Promise<T>, fallback: () => T | Promise<T>): Promise<T> {
    if (this.useMemoryFallback) {
      return await fallback();
    }

    try {
      return await operation();
    } catch (error) {
      this.useMemoryFallback = true;
      console.warn("Falling back to in-memory storage:", error instanceof Error ? error.message : String(error));
      return await fallback();
    }
  }

  private ensureSeededActivities(): void {
    if (this.memoryState.activities.length === 0) {
      const sampleActivities: InsertActivity[] = [
        { name: "Eiffel Tower Visit", category: "Sightseeing", description: "Visit the iconic iron lattice tower", defaultCost: "30.00" },
        { name: "Louvre Museum", category: "Culture", description: "World's largest art museum", defaultCost: "25.00" },
        { name: "Colosseum Tour", category: "History", description: "Ancient Roman amphitheatre", defaultCost: "40.00" },
        { name: "Sushi Making Class", category: "Food", description: "Learn to make authentic sushi", defaultCost: "80.00" },
        { name: "Grand Canal Gondola", category: "Experience", description: "Romantic ride in Venice", defaultCost: "100.00" },
      ];

      this.memoryState.activities = sampleActivities.map((activity, index) => ({
        id: this.memoryState.nextActivityId + index,
        ...activity,
      } as Activity));
      this.memoryState.nextActivityId = this.memoryState.activities.length + 1;
    }
  }

  async getUsers(): Promise<User[]> {
    return this.withFallback(async () => await db.select().from(users), () => this.memoryState.users.slice());
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.withFallback(async () => {
      const [user] = await db.select().from(users).where(eq(users.id, id));
      return user;
    }, () => this.memoryState.users.find((user) => user.id === id));
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return this.withFallback(async () => {
      const [user] = await db.select().from(users).where(eq(users.email, email));
      return user;
    }, () => this.memoryState.users.find((user) => user.email === email));
  }

  async createUserWithPassword(email: string, name: string, password: string): Promise<User> {
    return this.withFallback(async () => {
      const [user] = await db.insert(users).values({
        email,
        name,
        password,
        emailVerified: false,
      }).returning();
      return user;
    }, () => {
      const user: User = {
        id: this.memoryState.nextUserId++,
        name,
        email,
        password,
        image: null,
        emailVerified: false,
        resetToken: null,
        resetTokenExpiry: null,
        createdAt: new Date(),
      } as User;
      this.memoryState.users.push(user);
      return user;
    });
  }

  async updateUserPassword(userId: number, hashedPassword: string): Promise<void> {
    return this.withFallback(async () => {
      await db.update(users).set({ password: hashedPassword }).where(eq(users.id, userId));
      return;
    }, async () => {
      const user = this.memoryState.users.find((item) => item.id === userId);
      if (user) {
        user.password = hashedPassword;
      }
    });
  }

  async setResetToken(email: string, token: string, expiry: Date): Promise<void> {
    return this.withFallback(async () => {
      await db.update(users).set({ resetToken: token, resetTokenExpiry: expiry }).where(eq(users.email, email));
      return;
    }, async () => {
      const user = this.memoryState.users.find((item) => item.email === email);
      if (user) {
        user.resetToken = token;
        user.resetTokenExpiry = expiry;
      }
    });
  }

  async verifyResetToken(token: string): Promise<User | undefined> {
    return this.withFallback(async () => {
      const [user] = await db.select().from(users).where(and(eq(users.resetToken, token), sql`reset_token_expiry > NOW()`));
      return user;
    }, () => this.memoryState.users.find((user) => user.resetToken === token && user.resetTokenExpiry && new Date(user.resetTokenExpiry) > new Date()));
  }

  async getTrips(userId: number): Promise<Trip[]> {
    return this.withFallback(async () => await db.select().from(trips).where(eq(trips.userId, userId)), () => this.memoryState.trips.filter((trip) => trip.userId === userId));
  }

  async getTrip(id: number, userId: number): Promise<Trip | undefined> {
    return this.withFallback(async () => {
      const [trip] = await db.select().from(trips).where(and(eq(trips.id, id), eq(trips.userId, userId)));
      return trip;
    }, () => this.memoryState.trips.find((trip) => trip.id === id && trip.userId === userId));
  }

  async getTripById(id: number): Promise<Trip | undefined> {
    return this.withFallback(async () => {
      const [trip] = await db.select().from(trips).where(eq(trips.id, id));
      return trip;
    }, () => this.memoryState.trips.find((trip) => trip.id === id));
  }

  async createTrip(insertTrip: InsertTrip): Promise<Trip> {
    return this.withFallback(async () => {
      const [trip] = await db.insert(trips).values(insertTrip).returning();
      return trip;
    }, () => {
      const trip: Trip = {
        id: this.memoryState.nextTripId++,
        ...insertTrip,
        createdAt: new Date(),
      } as Trip;
      this.memoryState.trips.push(trip);
      return trip;
    });
  }

  async updateTrip(id: number, userId: number, updates: Partial<InsertTrip>): Promise<Trip | undefined> {
    return this.withFallback(async () => {
      const [updated] = await db.update(trips).set(updates).where(and(eq(trips.id, id), eq(trips.userId, userId))).returning();
      return updated;
    }, () => {
      const index = this.memoryState.trips.findIndex((trip) => trip.id === id && trip.userId === userId);
      if (index === -1) return undefined;
      this.memoryState.trips[index] = { ...this.memoryState.trips[index], ...updates } as Trip;
      return this.memoryState.trips[index];
    });
  }

  async deleteTrip(id: number, userId: number): Promise<boolean> {
    return this.withFallback(async () => {
      const result = await db.delete(trips).where(and(eq(trips.id, id), eq(trips.userId, userId)));
      return result.rowCount ? result.rowCount > 0 : false;
    }, () => {
      const before = this.memoryState.trips.length;
      this.memoryState.trips = this.memoryState.trips.filter((trip) => !(trip.id === id && trip.userId === userId));
      return this.memoryState.trips.length !== before;
    });
  }

  async getTripStops(tripId: number): Promise<TripStop[]> {
    return this.withFallback(async () => await db.select().from(tripStops).where(eq(tripStops.tripId, tripId)).orderBy(tripStops.orderIndex), () => this.memoryState.tripStops.filter((stop) => stop.tripId === tripId).sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0)));
  }

  async getTripStopById(id: number): Promise<TripStop | undefined> {
    return this.withFallback(async () => {
      const [stop] = await db.select().from(tripStops).where(eq(tripStops.id, id));
      return stop;
    }, () => this.memoryState.tripStops.find((stop) => stop.id === id));
  }

  async getStopsByTrip(tripId: number, userId: number): Promise<TripStop[]> {
    return this.withFallback(async () => {
      const trip = await this.getTrip(tripId, userId);
      if (!trip) return [];
      return await db.select().from(tripStops).where(eq(tripStops.tripId, tripId)).orderBy(tripStops.orderIndex);
    }, () => this.memoryState.tripStops.filter((stop) => stop.tripId === tripId).sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0)));
  }

  async createTripStop(insertStop: InsertTripStop): Promise<TripStop> {
    return this.withFallback(async () => {
      const [stop] = await db.insert(tripStops).values(insertStop).returning();
      return stop;
    }, () => {
      const stop: TripStop = {
        id: this.memoryState.nextTripStopId++,
        ...insertStop,
        createdAt: new Date(),
      } as TripStop;
      this.memoryState.tripStops.push(stop);
      return stop;
    });
  }

  async updateTripStop(id: number, updates: Partial<InsertTripStop>): Promise<TripStop | undefined> {
    return this.withFallback(async () => {
      const [updated] = await db.update(tripStops).set(updates).where(eq(tripStops.id, id)).returning();
      return updated;
    }, () => {
      const index = this.memoryState.tripStops.findIndex((stop) => stop.id === id);
      if (index === -1) return undefined;
      this.memoryState.tripStops[index] = { ...this.memoryState.tripStops[index], ...updates } as TripStop;
      return this.memoryState.tripStops[index];
    });
  }

  async deleteTripStop(id: number): Promise<boolean> {
    return this.withFallback(async () => {
      const result = await db.delete(tripStops).where(eq(tripStops.id, id));
      return result.rowCount ? result.rowCount > 0 : false;
    }, () => {
      const before = this.memoryState.tripStops.length;
      this.memoryState.tripStops = this.memoryState.tripStops.filter((stop) => stop.id !== id);
      return this.memoryState.tripStops.length !== before;
    });
  }

  async updateStopOrder(id: number, userId: number, order: number): Promise<TripStop | undefined> {
    return this.withFallback(async () => {
      const [updated] = await db.update(tripStops).set({ orderIndex: order }).where(eq(tripStops.id, id)).returning();
      return updated;
    }, () => {
      const stop = this.memoryState.tripStops.find((item) => item.id === id);
      if (!stop) return undefined;
      stop.orderIndex = order;
      return stop;
    });
  }

  async getActivities(): Promise<Activity[]> {
    return this.withFallback(async () => await db.select().from(activities), () => {
      this.ensureSeededActivities();
      return this.memoryState.activities.slice();
    });
  }

  async searchActivities(query: string): Promise<Activity[]> {
    return this.withFallback(async () => await db.select().from(activities).where(sql`LOWER(${activities.name}) LIKE LOWER(${'%' + query + '%'})`), () => {
      this.ensureSeededActivities();
      const value = query.toLowerCase();
      return this.memoryState.activities.filter((activity) => activity.name.toLowerCase().includes(value));
    });
  }

  async createActivity(insertActivity: InsertActivity): Promise<Activity> {
    return this.withFallback(async () => {
      const [activity] = await db.insert(activities).values(insertActivity).returning();
      return activity;
    }, () => {
      const activity: Activity = {
        id: this.memoryState.nextActivityId++,
        ...insertActivity,
      } as Activity;
      this.memoryState.activities.push(activity);
      return activity;
    });
  }

  async seedActivities(): Promise<void> {
    return this.withFallback(async () => {
      const existing = await db.select().from(activities).limit(1);
      if (existing.length === 0) {
        await db.insert(activities).values([
          { name: "Eiffel Tower Visit", category: "Sightseeing", description: "Visit the iconic iron lattice tower", defaultCost: "30.00" },
          { name: "Louvre Museum", category: "Culture", description: "World's largest art museum", defaultCost: "25.00" },
          { name: "Colosseum Tour", category: "History", description: "Ancient Roman amphitheatre", defaultCost: "40.00" },
          { name: "Sushi Making Class", category: "Food", description: "Learn to make authentic sushi", defaultCost: "80.00" },
          { name: "Grand Canal Gondola", category: "Experience", description: "Romantic ride in Venice", defaultCost: "100.00" },
          { name: "Statue of Liberty Ferry", category: "Sightseeing", description: "Visit the symbol of freedom", defaultCost: "20.00" },
          { name: "Mount Fuji Day Trip", category: "Nature", description: "Full day tour to Japan's highest peak", defaultCost: "120.00" },
          { name: "Wine Tasting in Tuscany", category: "Food & Drink", description: "Visit local vineyards", defaultCost: "90.00" },
          { name: "Northern Lights Tour", category: "Nature", description: "Hunt for the aurora borealis", defaultCost: "150.00" },
          { name: "Safari in Kruger Park", category: "Adventure", description: "African wildlife experience", defaultCost: "250.00" },
        ]);
      }
      return;
    }, async () => {
      this.ensureSeededActivities();
    });
  }

  async getTripActivities(tripId: number): Promise<TripActivity[]> {
    return this.withFallback(async () => await db.select().from(tripActivities).where(eq(tripActivities.tripId, tripId)).orderBy(tripActivities.scheduledDate, tripActivities.orderIndex), () => this.memoryState.tripActivities.filter((activity) => activity.tripId === tripId).sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0)));
  }

  async getTripActivityById(id: number): Promise<TripActivity | undefined> {
    return this.withFallback(async () => {
      const [activity] = await db.select().from(tripActivities).where(eq(tripActivities.id, id));
      return activity;
    }, () => this.memoryState.tripActivities.find((activity) => activity.id === id));
  }

  async getTripActivitiesByStop(tripStopId: number, userId: number): Promise<TripActivity[]> {
    return this.withFallback(async () => {
      return await db.select().from(tripActivities).innerJoin(trips, eq(tripActivities.tripId, trips.id)).where(and(eq(tripActivities.stopId, tripStopId), eq(trips.userId, userId))).then((results) => results.map((r) => r.trip_activities));
    }, () => this.memoryState.tripActivities.filter((activity) => activity.stopId === tripStopId));
  }

  async createTripActivity(insertTripActivity: InsertTripActivity): Promise<TripActivity> {
    return this.withFallback(async () => {
      const [tripActivity] = await db.insert(tripActivities).values(insertTripActivity).returning();
      return tripActivity;
    }, () => {
      const tripActivity: TripActivity = {
        id: this.memoryState.nextTripActivityId++,
        ...insertTripActivity,
        createdAt: new Date(),
      } as TripActivity;
      this.memoryState.tripActivities.push(tripActivity);
      return tripActivity;
    });
  }

  async deleteTripActivity(id: number): Promise<boolean> {
    return this.withFallback(async () => {
      const result = await db.delete(tripActivities).where(eq(tripActivities.id, id));
      return result.rowCount ? result.rowCount > 0 : false;
    }, () => {
      const before = this.memoryState.tripActivities.length;
      this.memoryState.tripActivities = this.memoryState.tripActivities.filter((activity) => activity.id !== id);
      return this.memoryState.tripActivities.length !== before;
    });
  }

  async getBudgetsByTrip(tripId: number): Promise<Budget[]> {
    return this.withFallback(async () => await db.select().from(budgets).where(eq(budgets.tripId, tripId)), () => this.memoryState.budgets.filter((budget) => budget.tripId === tripId));
  }

  async createBudget(insertBudget: InsertBudget): Promise<Budget> {
    return this.withFallback(async () => {
      const [budget] = await db.insert(budgets).values(insertBudget).returning();
      return budget;
    }, () => {
      const budget: Budget = {
        id: this.memoryState.nextBudgetId++,
        ...insertBudget,
      } as Budget;
      this.memoryState.budgets.push(budget);
      return budget;
    });
  }
}

export const storage = new DatabaseStorage();
