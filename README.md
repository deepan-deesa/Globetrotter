# GlobeTrotter - Travel Planning Application

A modern, full-stack travel planning application built with React, Express, and PostgreSQL. Plan trips, create itineraries, track budgets, and share your adventures.

## Features

### ✅ Completed
- **Secure Authentication**
  - JWT-based authentication with HTTP-only cookies
  - Bcrypt password hashing
  - Protected routes
  - Password reset functionality
  
- **Trip Management**
  - Create, view, and delete trips
  - Public/private trip visibility
  - Trip search and filtering
  - Comprehensive dashboard with statistics

- **Security & Performance**
  - Helmet security headers
  - Rate limiting (100 req/15min)
  - Response compression
  - Input validation with Zod
  - SQL injection protection

### 🚧 In Progress
- Itinerary builder with drag-and-drop
- Budget tracking and visualization
- Activity scheduling
- Trip sharing with other users

## Tech Stack

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **TanStack Query** - Server state management
- **Wouter** - Lightweight routing
- **shadcn/ui** - Component library
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **Lucide React** - Icons

### Backend
- **Express** - Web framework
- **PostgreSQL** - Database
- **Drizzle ORM** - Type-safe database queries
- **JWT** - Authentication tokens
- **Bcrypt** - Password hashing
- **Zod** - Schema validation

### Security
- Helmet - Security headers
- Express Rate Limit - API rate limiting
- Cookie Parser - Secure cookie handling
- CORS protection
- Input sanitization

## Prerequisites

- **Node.js** 18 or higher
- **PostgreSQL** 14 or higher
- **npm** or **yarn**

## Installation

### 1. Clone the repository
```bash
git clone <repository-url>
cd Stack-Starter
```

### 2. Install dependencies
```bash
npm install
```

### 3. Set up PostgreSQL database
```sql
CREATE DATABASE globetrotter;
CREATE USER globetrotter_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE globetrotter TO globetrotter_user;
```

### 4. Configure environment variables
Create a `.env` file in the project root:

```env
# Database
DATABASE_URL=postgresql://globetrotter_user:your_password@localhost:5432/globetrotter

# JWT Secret (use a strong random string in production)
JWT_SECRET=your-super-secret-jwt-key-min-32-characters

# Server
NODE_ENV=development
PORT=5000
```

**⚠️ IMPORTANT**: Generate a secure JWT_SECRET for production:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 5. Initialize database schema
```bash
npm run db:push
```

### 6. Start the development server
```bash
npm run dev
```

The application will be available at `http://localhost:5000`

## Project Structure

```
Stack-Starter/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   │   ├── ui/        # shadcn/ui components
│   │   │   ├── AppLayout.tsx
│   │   │   ├── AuthLayout.tsx
│   │   │   └── ProtectedRoute.tsx
│   │   ├── hooks/         # Custom React hooks
│   │   │   └── useAuth.ts
│   │   ├── pages/         # Page components
│   │   │   ├── Dashboard.tsx
│   │   │   ├── CreateTrip.tsx
│   │   │   ├── MyTrips.tsx
│   │   │   ├── TripDetail.tsx
│   │   │   ├── ItineraryBuilder.tsx
│   │   │   ├── Login.tsx
│   │   │   └── Signup.tsx
│   │   ├── lib/           # Utility functions
│   │   └── App.tsx        # Main app component
│   └── index.html
├── server/                # Backend Express application
│   ├── auth.ts           # Authentication utilities
│   ├── db.ts             # Database connection
│   ├── index.ts          # Server entry point
│   ├── routes.ts         # API routes
│   └── storage.ts        # Database operations
├── shared/               # Shared code between client/server
│   ├── auth-schemas.ts  # Zod validation schemas
│   ├── routes.ts        # Route definitions
│   └── schema.ts        # Database schema (Drizzle)
├── .env                 # Environment variables (create this)
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Available Scripts

```bash
# Development
npm run dev              # Start development server with hot reload
npm run build           # Build for production
npm run start           # Start production server

# Database
npm run db:push         # Push schema changes to database
npm run db:studio       # Open Drizzle Studio (database GUI)

# Code Quality
npm run check           # Type check TypeScript
npm run lint            # Run ESLint
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user
- `POST /api/auth/reset-password-request` - Request password reset
- `POST /api/auth/reset-password` - Reset password

### Trips
- `GET /api/trips` - Get all user trips
- `POST /api/trips` - Create new trip
- `GET /api/trips/:id` - Get trip by ID
- `PUT /api/trips/:id` - Update trip
- `DELETE /api/trips/:id` - Delete trip

## Security Best Practices

### Production Deployment Checklist
- [ ] Change `JWT_SECRET` to a secure random string (min 32 characters)
- [ ] Set `NODE_ENV=production`
- [ ] Use HTTPS in production
- [ ] Configure proper CORS settings
- [ ] Enable PostgreSQL SSL connections
- [ ] Set up database backups
- [ ] Configure rate limiting based on your needs
- [ ] Set up monitoring and logging
- [ ] Use environment variables for all secrets
- [ ] Enable security headers (already configured with Helmet)

### Password Requirements
- Minimum 8 characters
- Must contain letters and numbers
- Hashed with bcrypt (10 salt rounds)

### Token Security
- JWT tokens expire after 7 days
- HTTP-only cookies prevent XSS attacks
- Secure flag enabled in production
- SameSite=lax for CSRF protection

## Development

### Adding a New Page
1. Create component in `client/src/pages/`
2. Add route in `client/src/App.tsx`
3. Wrap with `ProtectedRoute` if authentication required

### Adding a New API Endpoint
1. Define route in `server/routes.ts`
2. Add validation schema in `shared/auth-schemas.ts` (if needed)
3. Implement database operations in `server/storage.ts`

### Database Schema Changes
1. Modify schema in `shared/schema.ts`
2. Run `npm run db:push` to apply changes
3. Update TypeScript types accordingly

## Troubleshooting

### Database Connection Issues
```bash
# Check PostgreSQL is running
pg_isready

# Test connection
psql -U globetrotter_user -d globetrotter
```

### Port Already in Use
Change `PORT` in `.env` to another port (e.g., 3000, 8080)

### Module Not Found Errors
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### TypeScript Errors
```bash
# Run type check
npm run check
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Support

For issues and questions, please open an issue on GitHub.

---

**Built with ❤️ using modern web technologies**
