import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Leaderboard.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    try {
      const response = await axios.get(`${API_URL}/users/leaderboard`);
      setLeaderboard(response.data);
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="leaderboard">Loading...</div>;
  }

  return (
    <div className="leaderboard">
      <div className="leaderboard-header">
        <h1>🏆 Leaderboard</h1>
        <button onClick={() => navigate('/')} className="btn btn-secondary">
          Back to Home
        </button>
      </div>

      <div className="leaderboard-table">
        <div className="leaderboard-header-row">
          <div>Rank</div>
          <div>Username</div>
          <div>Rating</div>
          <div>Wins</div>
          <div>Losses</div>
          <div>Win Rate</div>
        </div>
        {leaderboard.map((user, index) => {
          const totalGames = user.wins + user.losses;
          const winRate = totalGames > 0 ? ((user.wins / totalGames) * 100).toFixed(1) : '0.0';
          return (
            <div key={user.id} className="leaderboard-row">
              <div className="rank">#{index + 1}</div>
              <div className="username">{user.username}</div>
              <div className="rating">{user.rating}</div>
              <div className="wins">{user.wins}</div>
              <div className="losses">{user.losses}</div>
              <div className="win-rate">{winRate}%</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
