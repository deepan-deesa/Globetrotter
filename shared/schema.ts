import { pgTable, text, serial, integer, timestamp, decimal, numeric, boolean, index, primaryKey } from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// === TABLE DEFINITIONS ===

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  image: text("image"),
  emailVerified: boolean("email_verified").default(false).notNull(),
  resetToken: text("reset_token"),
  resetTokenExpiry: timestamp("reset_token_expiry"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => ({
  emailIdx: index("email_idx").on(t.email),
}));

export const trips = pgTable("trips", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  isPublic: boolean("is_public").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => ({
  userIdIdx: index("trip_user_id_idx").on(t.userId),
}));

export const tripStops = pgTable("trip_stops", {
  id: serial("id").primaryKey(),
  tripId: integer("trip_id").notNull().references(() => trips.id, { onDelete: "cascade" }),
  cityName: text("city_name").notNull(),
  country: text("country").notNull(),
  arrivalDate: timestamp("arrival_date").notNull(),
  departureDate: timestamp("departure_date").notNull(),
  orderIndex: integer("order_index").notNull().default(0),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => ({
  tripIdIdx: index("stop_trip_id_idx").on(t.tripId),
  orderIdx: index("stop_order_idx").on(t.tripId, t.orderIndex),
}));

export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category"),
  description: text("description"),
  defaultCost: decimal("default_cost", { precision: 10, scale: 2 }),
});

export const tripActivities = pgTable("trip_activities", {
  id: serial("id").primaryKey(),
  tripId: integer("trip_id").notNull().references(() => trips.id, { onDelete: "cascade" }),
  stopId: integer("stop_id").references(() => tripStops.id, { onDelete: "cascade" }),
  activityId: integer("activity_id").notNull().references(() => activities.id),
  title: text("title").notNull(),
  description: text("description"),
  scheduledDate: timestamp("scheduled_date").notNull(),
  cost: numeric("cost", { precision: 10, scale: 2 }).default("0"),
  duration: integer("duration"),
  orderIndex: integer("order_index").notNull().default(0),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => ({
  tripIdIdx: index("trip_activity_trip_id_idx").on(t.tripId),
  stopIdIdx: index("trip_activity_stop_id_idx").on(t.stopId),
  activityIdIdx: index("trip_activity_activity_id_idx").on(t.activityId),
  dateIdx: index("trip_activity_date_idx").on(t.scheduledDate),
}));

export const budgets = pgTable("budgets", {
  id: serial("id").primaryKey(),
  tripId: integer("trip_id").references(() => trips.id).notNull(),
  category: text("category").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").default("USD").notNull(),
}, (t) => ({
  tripBudgetIdx: index("trip_budget_idx").on(t.tripId),
}));

export const sharedTrips = pgTable("shared_trips", {
  tripId: integer("trip_id").references(() => trips.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  accessLevel: text("access_level", { enum: ["viewer", "editor"] }).default("viewer").notNull(),
  sharedAt: timestamp("shared_at").defaultNow().notNull(),
}, (t) => ({
  pk: primaryKey({ columns: [t.tripId, t.userId] }),
  sharedTripIdx: index("shared_trip_idx").on(t.tripId),
}));

// === RELATIONS ===

export const usersRelations = relations(users, ({ many }) => ({
  ownedTrips: many(trips),
  sharedTrips: many(sharedTrips),
}));

export const tripsRelations = relations(trips, ({ one, many }) => ({
  user: one(users, {
    fields: [trips.userId],
    references: [users.id],
  }),
  stops: many(tripStops),
  activities: many(tripActivities),
  budgets: many(budgets),
  sharedWith: many(sharedTrips),
}));

export const tripStopsRelations = relations(tripStops, ({ one, many }) => ({
  trip: one(trips, { fields: [tripStops.tripId], references: [trips.id] }),
  tripActivities: many(tripActivities),
}));

export const activitiesRelations = relations(activities, ({ many }) => ({
  trips: many(tripActivities),
}));

export const tripActivitiesRelations = relations(tripActivities, ({ one }) => ({
  trip: one(trips, {
    fields: [tripActivities.tripId],
    references: [trips.id],
  }),
  stop: one(tripStops, {
    fields: [tripActivities.stopId],
    references: [tripStops.id],
  }),
  activity: one(activities, {
    fields: [tripActivities.activityId],
    references: [activities.id],
  }),
}));

export const budgetsRelations = relations(budgets, ({ one }) => ({
  trip: one(trips, { fields: [budgets.tripId], references: [trips.id] }),
}));

export const sharedTripsRelations = relations(sharedTrips, ({ one }) => ({
  trip: one(trips, { fields: [sharedTrips.tripId], references: [trips.id] }),
  user: one(users, { fields: [sharedTrips.userId], references: [users.id] }),
}));

// === BASE SCHEMAS ===

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, password: true, resetToken: true, resetTokenExpiry: true });
export const insertTripSchema = createInsertSchema(trips).omit({ id: true, createdAt: true });
export const insertTripStopSchema = createInsertSchema(tripStops).omit({ id: true });
export const insertActivitySchema = createInsertSchema(activities).omit({ id: true });
export const insertTripActivitySchema = createInsertSchema(tripActivities).omit({
  id: true,
  createdAt: true,
});
export const insertBudgetSchema = createInsertSchema(budgets).omit({ id: true });
export const insertSharedTripSchema = createInsertSchema(sharedTrips).omit({ sharedAt: true });

// === EXPLICIT API CONTRACT TYPES ===

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Trip = typeof trips.$inferSelect;
export type InsertTrip = z.infer<typeof insertTripSchema>;

export type TripStop = typeof tripStops.$inferSelect;
export type InsertTripStop = z.infer<typeof insertTripStopSchema>;

export type Activity = typeof activities.$inferSelect;
export type InsertActivity = z.infer<typeof insertActivitySchema>;

export type TripActivity = typeof tripActivities.$inferSelect;
export type InsertTripActivity = z.infer<typeof insertTripActivitySchema>;

export type Budget = typeof budgets.$inferSelect;
export type InsertBudget = z.infer<typeof insertBudgetSchema>;

export type SharedTrip = typeof sharedTrips.$inferSelect;
export type InsertSharedTrip = z.infer<typeof insertSharedTripSchema>;
