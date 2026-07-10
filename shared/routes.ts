import { z } from 'zod';
import {
  insertUserSchema, users,
  insertTripSchema, trips,
  insertTripStopSchema, tripStops,
  insertActivitySchema, activities,
  insertTripActivitySchema, tripActivities,
  insertBudgetSchema, budgets,
  User, InsertUser, Trip, InsertTrip, TripStop, InsertTripStop, Activity, InsertActivity, TripActivity, InsertTripActivity
} from './schema';

export { type User, type InsertUser, type Trip, type InsertTrip, type TripStop, type InsertTripStop, type Activity, type InsertActivity, type TripActivity, type InsertTripActivity };

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  unauthorized: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  users: {
    list: {
      method: 'GET' as const,
      path: '/api/users',
      responses: {
        200: z.array(z.custom<User>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/users/:id',
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/users',
      input: insertUserSchema,
      responses: {
        201: z.custom<typeof users.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
  },
  trips: {
    list: {
      method: 'GET' as const,
      path: '/api/trips',
      responses: {
        200: z.array(z.custom<typeof trips.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/trips/:id',
      responses: {
        200: z.custom<typeof trips.$inferSelect>(),
        404: errorSchemas.notFound,
        403: errorSchemas.unauthorized,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/trips',
      input: insertTripSchema.omit({ userId: true }),
      responses: {
        201: z.custom<typeof trips.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PATCH' as const,
      path: '/api/trips/:id',
      input: insertTripSchema.partial(),
      responses: {
        200: z.custom<typeof trips.$inferSelect>(),
        404: errorSchemas.notFound,
        400: errorSchemas.validation,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/trips/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
  },
  tripStops: {
    listByTrip: {
      method: 'GET' as const,
      path: '/api/trips/:tripId/stops',
      responses: {
        200: z.array(z.custom<typeof tripStops.$inferSelect>()),
        403: errorSchemas.unauthorized,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/trips/:tripId/stops',
      input: insertTripStopSchema.omit({ tripId: true }),
      responses: {
        201: z.custom<typeof tripStops.$inferSelect>(),
        400: errorSchemas.validation,
        403: errorSchemas.unauthorized,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/stops/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
    reorder: {
      method: 'PATCH' as const,
      path: '/api/stops/:id/order',
      input: z.object({ order: z.number() }),
      responses: {
        200: z.custom<typeof tripStops.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
  },
  activities: {
    list: {
      method: 'GET' as const,
      path: '/api/activities',
      responses: {
        200: z.array(z.custom<typeof activities.$inferSelect>()),
      },
    },
    search: {
      method: 'GET' as const,
      path: '/api/activities/search',
      input: z.object({ q: z.string() }),
      responses: {
        200: z.array(z.custom<typeof activities.$inferSelect>()),
      },
    },
  },
  tripActivities: {
    listByStop: {
      method: 'GET' as const,
      path: '/api/trip-stops/:stopId/activities',
      responses: {
        200: z.array(z.custom<typeof tripActivities.$inferSelect>()),
        403: errorSchemas.unauthorized,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/trip-stops/:stopId/activities',
      input: insertTripActivitySchema.omit({ stopId: true }),
      responses: {
        201: z.custom<typeof tripActivities.$inferSelect>(),
        400: errorSchemas.validation,
        403: errorSchemas.unauthorized,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/trip-activities/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
