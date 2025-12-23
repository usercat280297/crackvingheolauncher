import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      navigate('/login');
      return;
    }
    
    const parsedUser = JSON.parse(userData);
    const fullUser = {
      ...parsedUser,
      username: parsedUser.name?.split(' ')[0] || 'User',
      joinDate: '2024-01-15',
      level: Math.floor(Math.random() * 50) + 1,
      xp: Math.floor(Math.random() * 10000),
      gamesOwned: Math.floor(Math.random() * 200) + 50,
      hoursPlayed: Math.floor(Math.random() * 1000) + 100,
      achievements: Math.floor(Math.random() * 500) + 50,
      friends: Math.floor(Math.random() * 100) + 20,
      avatar: '/Saitma-Meme-PNG-758x473-removebg-preview.png',
      bio: 'Gaming enthusiast and crackvingheo user',
      location: 'Vietnam',
      favoriteGenres: ['Action', 'RPG', 'Adventure'],
      recentGames: [
        { name: 'Cyberpunk 2077', hours: 45, lastPlayed: '2 hours ago' },
        { name: 'The Witcher 3', hours: 120, lastPlayed: '1 day ago' },
        { name: 'GTA V', hours: 89, lastPlayed: '3 days ago' }
      ]
    };
    
    setUser(fullUser);
    setEditForm(fullUser);
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/');
  };

  const handleSave = () => {
    setUser(editForm);
    localStorage.setItem('user', JSON.stringify(editForm));
    setIsEditing(false);
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">
      <div className="relative h-64 bg-gradient-to-r from-cyan-600 via-blue-600 to-purple-600 overflow-hidden">
        <div className="absolute inset-0 bg-black/30" />
        <div className="absolute top-4 left-4">
          <Link to="/" className="flex items-center gap-2 px-4 py-2 bg-black/50 backdrop-blur-sm rounded-lg hover:bg-black/70 transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            Back to Store
          </Link>
        </div>
        
        <div className="absolute bottom-0 left-0 right-0 p-8">
          <div className="flex items-end gap-6">
            <div className="relative">
              <img 
                src={user.avatar} 
                alt={user.username} 
                className="w-32 h-32 rounded-full border-4 border-white/20 bg-gray-800 object-contain p-2" 
              />
              <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full border-4 border-gray-900 flex items-center justify-center">
                <div className="w-3 h-3 bg-white rounded-full" />
              </div>
            </div>
            
            <div className="flex-1 pb-4">
              <div className="flex items-center gap-4 mb-2">
                <h1 className="text-4xl font-bold">{user.username}</h1>
                <div className="px-3 py-1 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full text-sm font-bold">
                  Level {user.level}
                </div>
              </div>
              <p className="text-xl text-gray-200 mb-2">{user.email}</p>
              <div className="flex items-center gap-6 text-sm text-gray-300">
                <span>📍 {user.location}</span>
                <span>📅 Joined {user.joinDate}</span>
                <span>🎮 {user.gamesOwned} games</span>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button 
                onClick={() => setIsEditing(!isEditing)}
                className="px-6 py-3 bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-lg font-medium transition"
              >
                {isEditing ? 'Cancel' : 'Edit Profile'}
              </button>
              <button 
                onClick={handleLogout}
                className="px-6 py-3 bg-red-600 hover:bg-red-500 rounded-lg font-medium transition"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="sticky top-0 z-40 bg-black/95 backdrop-blur-xl border-b border-gray-800">
        <div className="px-8 py-4">
          <div className="flex gap-8">
            {[
              { id: 'overview', label: 'Overview', icon: '📊' },
              { id: 'games', label: 'Games Library', icon: '🎮' },
              { id: 'achievements', label: 'Achievements', icon: '🏆' },
              { id: 'friends', label: 'Friends', icon: '👥' },
              { id: 'settings', label: 'Settings', icon: '⚙️' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
                  activeTab === tab.id 
                    ? 'bg-cyan-600 text-white' 
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="p-8">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-blue-600/20 to-blue-800/20 rounded-xl p-6 border border-blue-500/20">
                <div className="text-3xl font-bold text-blue-400">{user.gamesOwned}</div>
                <div className="text-gray-400">Games Owned</div>
              </div>
              <div className="bg-gradient-to-br from-green-600/20 to-green-800/20 rounded-xl p-6 border border-green-500/20">
                <div className="text-3xl font-bold text-green-400">{user.hoursPlayed}h</div>
                <div className="text-gray-400">Hours Played</div>
              </div>
              <div className="bg-gradient-to-br from-yellow-600/20 to-yellow-800/20 rounded-xl p-6 border border-yellow-500/20">
                <div className="text-3xl font-bold text-yellow-400">{user.achievements}</div>
                <div className="text-gray-400">Achievements</div>
              </div>
              <div className="bg-gradient-to-br from-purple-600/20 to-purple-800/20 rounded-xl p-6 border border-purple-500/20">
                <div className="text-3xl font-bold text-purple-400">{user.friends}</div>
                <div className="text-gray-400">Friends</div>
              </div>
            </div>

            <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-800">
              <h3 className="text-xl font-bold mb-4">Profile Info</h3>
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Bio</label>
                    <textarea 
                      value={editForm.bio}
                      onChange={(e) => setEditForm({...editForm, bio: e.target.value})}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Location</label>
                    <input 
                      value={editForm.location}
                      onChange={(e) => setEditForm({...editForm, location: e.target.value})}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
                    />
                  </div>
                  <button 
                    onClick={handleSave}
                    className="w-full py-2 bg-cyan-600 hover:bg-cyan-500 rounded-lg font-medium transition"
                  >
                    Save Changes
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <div className="text-sm text-gray-400">Bio</div>
                    <div className="text-gray-200">{user.bio}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400">Favorite Genres</div>
                    <div className="flex gap-2 mt-1">
                      {user.favoriteGenres.map(genre => (
                        <span key={genre} className="px-2 py-1 bg-gray-800 rounded text-xs">{genre}</span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="lg:col-span-3 bg-gray-900/50 rounded-xl p-6 border border-gray-800">
              <h3 className="text-xl font-bold mb-4">Recent Games</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {user.recentGames.map((game, index) => (
                  <div key={index} className="flex items-center gap-4 p-4 bg-gray-800/50 rounded-lg">
                    <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center text-xl font-bold">
                      🎮
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold">{game.name}</div>
                      <div className="text-sm text-gray-400">{game.hours}h • {game.lastPlayed}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'games' && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🎮</div>
            <h3 className="text-2xl font-bold mb-2">Games Library</h3>
            <p className="text-gray-400">Your game collection will appear here</p>
          </div>
        )}

        {activeTab === 'achievements' && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🏆</div>
            <h3 className="text-2xl font-bold mb-2">Achievements</h3>
            <p className="text-gray-400">Your gaming achievements will be displayed here</p>
          </div>
        )}

        {activeTab === 'friends' && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">👥</div>
            <h3 className="text-2xl font-bold mb-2">Friends</h3>
            <p className="text-gray-400">Connect with other gamers</p>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">⚙️</div>
            <h3 className="text-2xl font-bold mb-2">Account Settings</h3>
            <p className="text-gray-400">Manage your account preferences</p>
          </div>
        )}
      </div>
    </div>
  );
}