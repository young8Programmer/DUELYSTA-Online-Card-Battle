# 🚀 DUELYSTA Setup Guide

## Prerequisites

- Node.js 18+ installed
- PostgreSQL installed and running
- Redis installed and running (optional, for production)

## Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file (copy from `.env.example`):
```bash
cp .env.example .env
```

4. Update `.env` with your database credentials:
```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_DATABASE=duelysta

REDIS_HOST=localhost
REDIS_PORT=6379

JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=7d

PORT=3000
NODE_ENV=development
```

5. Create PostgreSQL database:
```sql
CREATE DATABASE duelysta;
```

6. Start the backend server:
```bash
npm run start:dev
```

7. Initialize default cards (in a new terminal):
```bash
curl -X POST http://localhost:3000/cards/init
```

The backend will automatically create database tables on first run.

## Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file (optional, defaults work for local dev):
```env
VITE_API_URL=http://localhost:3000
VITE_SOCKET_URL=http://localhost:3000
```

4. Start the frontend development server:
```bash
npm run dev
```

5. Open your browser and navigate to:
```
http://localhost:5173
```

## First Steps

1. **Register an account** - Create your username and password
2. **Build a deck** - Go to "My Decks" and create a deck with exactly 30 cards
3. **Play a match** - Choose Casual or Ranked mode and find an opponent!

## Game Rules

- Each player starts with **30 HP**
- **Mana** increases by 1 each turn (max 10)
- Draw **1 card** at the start of each turn
- Maximum **7 cards** in hand
- Deck must contain exactly **30 cards**
- Maximum **3 copies** of each card per deck

## Card Types

- **Attack Cards**: Deal damage to opponent
- **Defense Cards**: Heal HP or gain shield
- **Spell Cards**: Special effects (stun, freeze, draw cards, etc.)

## Development

### Backend Commands
- `npm run start:dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run start:prod` - Start production server

### Frontend Commands
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Troubleshooting

### Database Connection Issues
- Ensure PostgreSQL is running
- Check database credentials in `.env`
- Verify database exists: `psql -U postgres -l`

### WebSocket Connection Issues
- Ensure backend is running on port 3000
- Check CORS settings in `backend/src/main.ts`
- Verify JWT token is being sent correctly

### Card Initialization
If cards don't appear, manually initialize them:
```bash
curl -X POST http://localhost:3000/cards/init
```

## Production Deployment

1. Set `NODE_ENV=production` in backend `.env`
2. Build backend: `npm run build`
3. Build frontend: `npm run build`
4. Serve frontend build files with a web server (nginx, etc.)
5. Use PM2 or similar to run backend: `npm run start:prod`

## Features Implemented

✅ User authentication (JWT)
✅ Card system with effects
✅ Deck building (30 cards, max 3 copies)
✅ Real-time matchmaking
✅ Turn-based gameplay
✅ Server-authoritative game logic
✅ Rating system (ELO-like)
✅ Leaderboard
✅ Casual and Ranked modes
✅ Anti-cheat validation

Enjoy playing DUELYSTA! 🏆
