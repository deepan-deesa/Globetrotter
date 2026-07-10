import type { Express, Request, Response, NextFunction } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { hashPassword, verifyPassword, generateToken, verifyToken, generateResetToken } from "./auth";
import { registerSchema, loginSchema, resetPasswordRequestSchema, resetPasswordSchema } from "@shared/auth-schemas";

// JWT Authentication middleware
const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies?.token || req.headers.authorization?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }

  (req as any).user = { id: payload.userId, email: payload.email };
  next();
};

function isDatabaseUnavailableError(err: unknown): boolean {
  if (!err) return false;

  const message = err instanceof Error ? err.message : String(err);
  const code = typeof err === "object" && err !== null && "code" in err ? String((err as any).code) : "";

  return (
    code === "ECONNREFUSED" ||
    message.includes("ECONNREFUSED") ||
    message.includes("DATABASE_URL") ||
    message.includes("connect") ||
    message.includes("database") ||
    message.includes("timeout")
  );
}

function sendDatabaseUnavailable(res: Response) {
  return res.status(503).json({
    message: "Database unavailable. Start PostgreSQL and configure DATABASE_URL to enable login and trip features.",
  });
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // ===== AUTHENTICATION ROUTES =====

  // Register
  app.post("/api/auth/register", async (req, res) => {
    try {
      const input = registerSchema.parse(req.body);

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(input.email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already registered" });
      }

      // Hash password and create user
      const hashedPassword = await hashPassword(input.password);
      const user = await storage.createUserWithPassword(input.email, input.name, hashedPassword);

      // Generate token
      const token = generateToken({ userId: user.id, email: user.email });

      // Set cookie
      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.status(201).json({
        user: { id: user.id, name: user.name, email: user.email },
        token,
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      if (isDatabaseUnavailableError(err)) {
        return sendDatabaseUnavailable(res);
      }
      console.error("Registration error:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Login
  app.post("/api/auth/login", async (req, res) => {
    try {
      const input = loginSchema.parse(req.body);

      // Find user
      const user = await storage.getUserByEmail(input.email);
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Verify password
      const isValid = await verifyPassword(input.password, user.password);
      if (!isValid) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Generate token
      const token = generateToken({ userId: user.id, email: user.email });

      // Set cookie
      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.json({
        user: { id: user.id, name: user.name, email: user.email },
        token,
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      if (isDatabaseUnavailableError(err)) {
        return sendDatabaseUnavailable(res);
      }
      console.error("Login error:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Logout
  app.post("/api/auth/logout", (req, res) => {
    res.clearCookie("token");
    res.json({ message: "Logged out successfully" });
  });

  // Get  // Create trip
  app.post("/api/trips", authenticate, async (req: any, res) => {
    try {
      const { title, description, startDate, endDate, isPublic } = req.body;

      if (!title) {
        return res.status(400).json({ message: "Title is required" });
      }

      const trip = await storage.createTrip({
        userId: req.user.id,
        title,
        description: description || null,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        isPublic: isPublic || false,
      });

      res.json(trip);
    } catch (error) {
      console.error("Error creating trip:", error);
      res.status(500).json({ message: "Failed to create trip" });
    }
  });

  // Request password reset
  app.post("/api/auth/reset-password-request", async (req, res) => {
    try {
      const input = resetPasswordRequestSchema.parse(req.body);
      const user = await storage.getUserByEmail(input.email);

      if (user) {
        const resetToken = generateResetToken();
        const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
        await storage.setResetToken(input.email, resetToken, expiry);

        // In production, send email with reset link
        // For now, just return success
        console.log(`Password reset token for ${input.email}: ${resetToken}`);
      }

      // Always return success to prevent email enumeration
      res.json({ message: "If the email exists, a reset link has been sent" });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      if (isDatabaseUnavailableError(err)) {
        return sendDatabaseUnavailable(res);
      }
      console.error("Reset request error:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ===== AI CHATBOT ROUTES =====

  app.post("/api/ai/chat", authenticate, async (req: any, res) => {
    try {
      const { message, context } = req.body;
      const userId = req.user.id;

      if (!message) return res.status(400).json({ message: "Message is required" });

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "HTTP-Referer": "https://globetrotter.app",
          "X-Title": "GlobeTrotter",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "openai/gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: `You are TravellerBuddy, a premium AI travel assistant for GlobeTrotter. 
              Your goal is to help users plan amazing trips. You can create trips, add stops, and add activities.
              When a user asks to plan a trip, use the create_trip_plan tool.
              Ensure dates are valid ISO strings.
              Always be encouraging and professional.
              Current context: ${JSON.stringify(context || {})}`
            },
            { role: "user", content: message }
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "create_trip_plan",
                description: "Create a new trip with a title, description, stops and activities",
                parameters: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    description: { type: "string" },
                    stops: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          cityName: { type: "string" },
                          country: { type: "string" },
                          arrivalDate: { type: "string" },
                          departureDate: { type: "string" },
                          activities: {
                            type: "array",
                            items: {
                              type: "object",
                              properties: {
                                title: { type: "string" },
                                cost: { type: "string" },
                                duration: { type: "number" },
                                scheduledTime: { type: "string" }
                              },
                              required: ["title"]
                            }
                          }
                        },
                        required: ["cityName", "country", "arrivalDate", "departureDate"]
                      }
                    }
                  },
                  required: ["title"]
                }
              }
            }
          ],
          tool_choice: "auto"
        })
      });

      const data = await response.json() as any;

      if (!data.choices || data.choices.length === 0) {
        throw new Error("Invalid response from OpenRouter");
      }

      const aiMessage = data.choices[0].message;

      if (aiMessage.tool_calls) {
        for (const toolCall of aiMessage.tool_calls) {
          if (toolCall.function.name === "create_trip_plan") {
            const args = JSON.parse(toolCall.function.arguments);

            // Execute the plan
            const trip = await storage.createTrip({
              userId,
              title: args.title,
              description: args.description || "",
              isPublic: false
            } as any);

            if (args.stops) {
              for (const stopData of args.stops) {
                const stop = await storage.createTripStop({
                  tripId: trip.id,
                  cityName: stopData.cityName,
                  country: stopData.country,
                  arrivalDate: new Date(stopData.arrivalDate),
                  departureDate: new Date(stopData.departureDate),
                  notes: ""
                } as any);

                if (stopData.activities) {
                  for (const actData of stopData.activities) {
                    await storage.createTripActivity({
                      tripId: trip.id,
                      stopId: stop.id,
                      activityId: 1, // Default activity ID
                      title: actData.title,
                      description: "",
                      scheduledDate: new Date(actData.scheduledTime || stopData.arrivalDate),
                      cost: actData.cost || "0",
                      duration: actData.duration || 60,
                      notes: ""
                    } as any);
                  }
                }
              }
            }

            return res.json({
              message: `I've created your trip "${args.title}" with ${args.stops?.length || 0} stops! You can find it on your dashboard.`,
              tripId: trip.id,
              action: "trip_created"
            });
          }
        }
      }

      res.json({ message: aiMessage.content });
    } catch (error) {
      console.error("AI Chat error:", error);
      res.status(500).json({ message: "TravellerBuddy is resting right now. Please try again later." });
    }
  });

  // Reset password
  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const input = resetPasswordSchema.parse(req.body);

      const user = await storage.verifyResetToken(input.token);
      if (!user) {
        return res.status(400).json({ message: "Invalid or expired reset token" });
      }

      const hashedPassword = await hashPassword(input.password);
      await storage.updateUserPassword(user.id, hashedPassword);

      // Clear reset token
      await storage.setResetToken(user.email, "", new Date(0));

      res.json({ message: "Password reset successfully" });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      if (isDatabaseUnavailableError(err)) {
        return sendDatabaseUnavailable(res);
      }
      console.error("Reset password error:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // === TRIP ROUTES ===

  app.get(api.trips.list.path, authenticate, async (req: any, res) => {
    const trips = await storage.getTrips(req.user.id);
    res.json(trips);
  });

  app.get("/api/trips/:id", async (req: any, res) => {
    try {
      const tripId = parseInt(req.params.id);
      const trip = await storage.getTripById(tripId);
      if (!trip) return res.status(404).json({ message: "Trip not found" });

      if (trip.isPublic || (req.isAuthenticated() && trip.userId === req.user.id)) {
        return res.json(trip);
      }
      res.status(403).json({ message: "Forbidden" });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch trip" });
    }
  });

  app.post(api.trips.create.path, authenticate, async (req: any, res) => {
    try {
      const input = api.trips.create.input.parse(req.body);
      const trip = await storage.createTrip({ ...input, userId: req.user.id } as any);
      res.status(201).json(trip);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch(api.trips.update.path, authenticate, async (req: any, res) => {
    try {
      const input = api.trips.update.input.parse(req.body);
      const trip = await storage.updateTrip(Number(req.params.id), req.user.id, input);
      if (!trip) return res.status(404).json({ message: "Trip not found" });
      res.json(trip);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete(api.trips.delete.path, authenticate, async (req: any, res) => {
    const deleted = await storage.deleteTrip(Number(req.params.id), req.user.id);
    if (!deleted) return res.status(404).json({ message: "Trip not found" });
    res.status(204).end();
  });

  // Trip Stops
  app.get(api.tripStops.listByTrip.path, authenticate, async (req: any, res) => {
    const stops = await storage.getStopsByTrip(Number(req.params.tripId), req.user.id);
    res.json(stops);
  });

  app.post(api.tripStops.create.path, authenticate, async (req: any, res) => {
    try {
      const tripId = Number(req.params.tripId);
      // Verify trip ownership
      const trip = await storage.getTrip(tripId, req.user.id);
      if (!trip) return res.status(403).json({ message: "Forbidden" });

      const input = api.tripStops.create.input.parse(req.body);
      const stop = await storage.createTripStop({ ...input, tripId });
      res.status(201).json(stop);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete(api.tripStops.delete.path, authenticate, async (req: any, res) => {
    const deleted = await storage.deleteTripStop(Number(req.params.id));
    if (!deleted) return res.status(404).json({ message: "Stop not found" });
    res.status(204).end();
  });

  app.patch(api.tripStops.reorder.path, authenticate, async (req: any, res) => {
    const input = api.tripStops.reorder.input.parse(req.body);
    const stop = await storage.updateStopOrder(Number(req.params.id), req.user.id, input.order);
    if (!stop) return res.status(404).json({ message: "Stop not found" });
    res.json(stop);
  });

  // Activities (Search/Read-only)
  app.get(api.activities.list.path, authenticate, async (req, res) => {
    const list = await storage.getActivities();
    res.json(list);
  });

  app.get("/api/activities/search", authenticate, async (req, res) => {
    const query = req.query.q as string;
    if (!query) return res.json([]);
    const results = await storage.searchActivities(query);
    res.json(results);
  });

  // Trip Activities
  app.get(api.tripActivities.listByStop.path, authenticate, async (req: any, res) => {
    const activities = await storage.getTripActivitiesByStop(Number(req.params.tripStopId), req.user.id);
    res.json(activities);
  });

  app.post(api.tripActivities.create.path, authenticate, async (req: any, res) => {
    try {
      const stopId = Number(req.params.stopId);
      const input = api.tripActivities.create.input.parse(req.body);
      const tripActivity = await storage.createTripActivity({ ...input, stopId });
      res.status(201).json(tripActivity);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete(api.tripActivities.delete.path, authenticate, async (req: any, res) => {
    const deleted = await storage.deleteTripActivity(Number(req.params.id));
    if (!deleted) return res.status(404).json({ message: "Activity not found" });
    res.status(204).end();
  });

  // Users
  app.get(api.users.list.path, authenticate, async (req, res) => {
    const users = await storage.getUsers();
    res.json(users);
  });

  // ===== TRIP STOPS ROUTES =====

  // Get all stops for a trip
  app.get("/api/trips/:id/stops", async (req: any, res) => {
    try {
      const tripId = parseInt(req.params.id);
      const trip = await storage.getTripById(tripId);

      if (!trip) return res.status(404).json({ message: "Trip not found" });

      if (!trip.isPublic && (!req.isAuthenticated() || trip.userId !== req.user.id)) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const stops = await storage.getTripStops(tripId);
      res.json(stops);
    } catch (error) {
      console.error("Error fetching trip stops:", error);
      res.status(500).json({ message: "Failed to fetch trip stops" });
    }
  });

  // Create a stop for a trip
  app.post("/api/trips/:id/stops", authenticate, async (req: any, res) => {
    try {
      const tripId = parseInt(req.params.id);
      const trip = await storage.getTripById(tripId);

      if (!trip || trip.userId !== req.user.id) {
        return res.status(404).json({ message: "Trip not found" });
      }

      const { cityName, country, arrivalDate, departureDate, notes } = req.body;

      if (!cityName || !country || !arrivalDate || !departureDate) {
        return res.status(400).json({ message: "City name, country, arrival date, and departure date are required" });
      }

      const stop = await storage.createTripStop({
        tripId,
        cityName,
        country,
        arrivalDate: new Date(arrivalDate),
        departureDate: new Date(departureDate),
        notes: notes || null,
      });

      res.json(stop);
    } catch (error) {
      console.error("Error creating trip stop:", error);
      res.status(500).json({ message: "Failed to create trip stop" });
    }
  });

  // Update a trip stop
  app.put("/api/stops/:id", authenticate, async (req: any, res) => {
    try {
      const stopId = parseInt(req.params.id);
      const stop = await storage.getTripStopById(stopId);

      if (!stop) {
        return res.status(404).json({ message: "Stop not found" });
      }

      const trip = await storage.getTripById(stop.tripId);
      if (!trip || trip.userId !== req.user.id) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const updated = await storage.updateTripStop(stopId, req.body);
      res.json(updated);
    } catch (error) {
      console.error("Error updating trip stop:", error);
      res.status(500).json({ message: "Failed to update trip stop" });
    }
  });

  // Delete a trip stop
  app.delete("/api/stops/:id", authenticate, async (req: any, res) => {
    try {
      const stopId = parseInt(req.params.id);
      const stop = await storage.getTripStopById(stopId);

      if (!stop) {
        return res.status(404).json({ message: "Stop not found" });
      }

      const trip = await storage.getTripById(stop.tripId);
      if (!trip || trip.userId !== req.user.id) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      await storage.deleteTripStop(stopId);
      res.json({ message: "Stop deleted successfully" });
    } catch (error) {
      console.error("Error deleting trip stop:", error);
      res.status(500).json({ message: "Failed to delete trip stop" });
    }
  });

  // ===== TRIP ACTIVITIES ROUTES =====

  // Get all activities for a trip
  app.get("/api/trips/:id/activities", async (req: any, res) => {
    try {
      const tripId = parseInt(req.params.id);
      const trip = await storage.getTripById(tripId);

      if (!trip) return res.status(404).json({ message: "Trip not found" });

      if (!trip.isPublic && (!req.isAuthenticated() || trip.userId !== req.user.id)) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const activities = await storage.getTripActivities(tripId);
      res.json(activities);
    } catch (error) {
      console.error("Error fetching trip activities:", error);
      res.status(500).json({ message: "Failed to fetch trip activities" });
    }
  });

  // Create an activity for a trip
  app.post("/api/trips/:id/activities", authenticate, async (req: any, res) => {
    try {
      const tripId = parseInt(req.params.id);
      const trip = await storage.getTripById(tripId);

      if (!trip || trip.userId !== req.user.id) {
        return res.status(404).json({ message: "Trip not found" });
      }

      const { stopId, activityId, title, description, scheduledDate, cost, duration, notes } = req.body;

      if (!title || !scheduledDate || !activityId) {
        return res.status(400).json({ message: "Title, scheduled date, and activity ID are required" });
      }

      const activity = await storage.createTripActivity({
        tripId,
        stopId: stopId || null,
        activityId,
        title,
        description: description || null,
        scheduledDate: new Date(scheduledDate),
        cost: cost || "0",
        duration: duration || null,
        notes: notes || null,
      });

      res.json(activity);
    } catch (error) {
      console.error("Error creating trip activity:", error);
      res.status(500).json({ message: "Failed to create trip activity" });
    }
  });

  // Delete a trip activity
  app.delete("/api/activities/:id", authenticate, async (req: any, res) => {
    try {
      const activityId = parseInt(req.params.id);
      const activity = await storage.getTripActivityById(activityId);

      if (!activity) {
        return res.status(404).json({ message: "Activity not found" });
      }

      const trip = await storage.getTripById(activity.tripId);
      if (!trip || trip.userId !== req.user.id) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      await storage.deleteTripActivity(activityId);
      res.json({ message: "Activity deleted successfully" });
    } catch (error) {
      console.error("Error deleting trip activity:", error);
      res.status(500).json({ message: "Failed to delete trip activity" });
    }
  });

  return httpServer;
}
