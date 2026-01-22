# 🏆 DUELYSTA — Online Card Battle

Real-time Turn-based Multiplayer Web Game

## 🎯 Project Overview

DUELYSTA is a professional online card battle game where two players compete in real-time turn-based matches. The game features server-authoritative logic to prevent cheating, a comprehensive card system with various effects, and a competitive rating system.

## 🧠 Game Concept

- **2 Players** take turns playing cards
- Each card can: **Attack**, **Defend**, or provide **Special Effects**
- **Goal**: Reduce opponent's HP to 0
- **Player Stats**: 30 HP, 0-10 Mana, 30-card deck, max 7 cards in hand

## 🃏 Card Types

1. **Attack Card** - Deals damage
2. **Defense Card** - Provides shield/heal
3. **Spell Card** - Special effects (stun, double damage, steal mana, etc.)

## 🏗️ Tech Stack

### Backend
- **Nest.js** - Framework
- **Socket.IO** - WebSocket for real-time communication
- **PostgreSQL** - Main database
- **Redis** - Match state caching
- **JWT** - Authentication

### Frontend
- **React + TypeScript** - UI framework
- **Zustand** - State management
- **Socket.IO Client** - Real-time updates
- **Canvas/UI Components** - Game rendering

## 🚀 Getting Started

**📖 For detailed setup instructions, see [SETUP.md](./SETUP.md)**

### Quick Start

1. **Backend Setup**
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your PostgreSQL credentials
npm run start:dev
```

2. **Initialize Cards** (in a new terminal)
```bash
curl -X POST http://localhost:3000/cards/init
```

3. **Frontend Setup**
```bash
cd frontend
npm install
npm run dev
```

4. **Open Browser**
```
http://localhost:5173
```

### Prerequisites
- Node.js 18+
- PostgreSQL (Redis is optional for now)

## 📁 Project Structure

```
├── backend/          # Nest.js backend
│   ├── src/
│   │   ├── auth/     # Authentication module
│   │   ├── users/    # User management
│   │   ├── cards/    # Card system
│   │   ├── decks/    # Deck management
│   │   ├── matches/  # Match system
│   │   ├── game/     # Game engine & logic
│   │   └── websocket/# WebSocket gateway
│   └── ...
├── frontend/         # React frontend
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── store/    # Zustand store
│   │   ├── hooks/    # Custom hooks
│   │   └── ...
│   └── ...
└── README.md
```

## 🔒 Anti-Cheat Features

- All game logic validated on server
- Mana calculations server-side
- Turn validation server-side
- All client actions verified

## 🏆 Rating System

- ELO-like rating algorithm
- Ranked & Casual game modes
- Global leaderboard

## 📚 Documentation

- **[SETUP.md](./SETUP.md)** - Detailed setup and configuration guide
- **[PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md)** - Complete feature list and architecture

## 🎮 How to Play

1. **Register/Login** - Create your account
2. **Build a Deck** - Create a deck with exactly 30 cards (max 3 copies each)
3. **Find Match** - Choose Casual or Ranked mode
4. **Play Cards** - Use mana to play cards and defeat your opponent!
5. **Win** - Reduce opponent's HP to 0 to win

## 🔥 Features

- ✅ Real-time multiplayer gameplay
- ✅ Server-authoritative (anti-cheat)
- ✅ Turn-based card battles
- ✅ Multiple card types and effects
- ✅ Rating system (ELO-like)
- ✅ Leaderboard
- ✅ Deck building
- ✅ Casual & Ranked modes

## 📝 License

MIT

---

**Built with ❤️ for portfolio and learning purposes**
