import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useGameStore } from '../store/gameStore';
import './Home.css';

export default function Home() {
  const { user, logout } = useAuthStore();
  const { connectSocket } = useGameStore();
  const navigate = useNavigate();

  useEffect(() => {
    connectSocket();
  }, [connectSocket]);

  const handlePlay = (mode: 'casual' | 'ranked') => {
    navigate(`/game?mode=${mode}`);
  };

  return (
    <div className="home">
      <nav className="navbar">
        <div className="nav-content">
          <h1>🏆 DUELYSTA</h1>
          <div className="nav-links">
            <span className="user-info">
              {user?.username} (Rating: {user?.rating})
            </span>
            <button onClick={() => navigate('/decks')} className="btn btn-secondary">
              My Decks
            </button>
            <button onClick={() => navigate('/leaderboard')} className="btn btn-secondary">
              Leaderboard
            </button>
            <button onClick={logout} className="btn btn-danger">
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="home-content">
        <div className="hero">
          <h2>Welcome, {user?.username}!</h2>
          <p>Choose your game mode:</p>

          <div className="game-modes">
            <div className="game-mode-card">
              <h3>🎮 Casual</h3>
              <p>Play for fun without affecting your rating</p>
              <button
                onClick={() => handlePlay('casual')}
                className="btn btn-primary"
              >
                Play Casual
              </button>
            </div>

            <div className="game-mode-card">
              <h3>⚔️ Ranked</h3>
              <p>Compete and climb the leaderboard</p>
              <button
                onClick={() => handlePlay('ranked')}
                className="btn btn-primary"
              >
                Play Ranked
              </button>
            </div>
          </div>

          <div className="stats">
            <div className="stat">
              <div className="stat-value">{user?.wins || 0}</div>
              <div className="stat-label">Wins</div>
            </div>
            <div className="stat">
              <div className="stat-value">{user?.losses || 0}</div>
              <div className="stat-label">Losses</div>
            </div>
            <div className="stat">
              <div className="stat-value">{user?.rating || 1000}</div>
              <div className="stat-label">Rating</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
