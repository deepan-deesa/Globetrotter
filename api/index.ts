import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "../server/routes";
import { storage } from "../server/storage";
import { createServer } from "http";
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";

const app = express();
const httpServer = createServer(app);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: process.env.NODE_ENV === "production" ? undefined : false,
}));
app.use(compression());
app.use(cookieParser());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests from this IP, please try again later.",
});
app.use("/api/", limiter);

app.use(
  express.json({
    verify: (req: any, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

let isInitialized = false;
async function initializeApp() {
  if (isInitialized) return;
  await registerRoutes(httpServer, app);
  try {
    await storage.seedActivities();
  } catch (error) {
    // Database seeding error handled gracefully
  }
  
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const isDatabaseError = err?.code === "ECONNREFUSED" ||
      err?.message?.includes("ECONNREFUSED") ||
      err?.message?.includes("database") ||
      err?.message?.includes("DATABASE_URL");

    if (isDatabaseError) {
      res.status(503).json({
        message: "Database unavailable. Start PostgreSQL and configure DATABASE_URL to enable full functionality.",
      });
      return;
    }

    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
  });

  isInitialized = true;
}

export default async function handler(req: Request, res: Response) {
  await initializeApp();
  app(req, res);
}
