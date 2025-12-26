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
    <div className="min-h-screen bg-[#0e0e10] text-white">
      <div className="relative h-48 bg-gradient-to-b from-[#18181b] to-transparent">
        <div className="absolute top-4 left-4">
          <Link to="/" className="flex items-center gap-2 px-4 py-2 bg-[#18181b] hover:bg-[#1f1f23] rounded transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            Back to Store
          </Link>
        </div>
        
        <div className="absolute bottom-0 left-0 right-0 px-8 pb-6">
          <div className="flex items-end gap-6">
            <div className="relative">
              <img 
                src={user.avatar} 
                alt={user.username} 
                className="w-28 h-28 rounded-full border-4 border-[#18181b] bg-[#18181b] object-contain p-2" 
              />
              <div className="absolute bottom-0 right-0 w-6 h-6 bg-green-500 rounded-full border-4 border-[#0e0e10]" />
            </div>
            
            <div className="flex-1 pb-2">
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-3xl font-bold tracking-tight">{user.username.toUpperCase()}</h1>
                <div className="px-2.5 py-0.5 bg-orange-500 rounded text-xs font-bold">
                  Level {user.level}
                </div>
              </div>
              <p className="text-sm text-gray-400 mb-2">{user.email}</p>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1">📍 {user.location}</span>
                <span className="flex items-center gap-1">📅 Joined {user.joinDate}</span>
                <span className="flex items-center gap-1">🎮 {user.gamesOwned} games</span>
              </div>
            </div>
            
            <div className="flex gap-2 pb-2">
              <button 
                onClick={() => setIsEditing(!isEditing)}
                className="px-5 py-2.5 bg-[#5865f2] hover:bg-[#4752c4] rounded text-sm font-medium transition"
              >
                {isEditing ? 'Cancel' : 'Edit Profile'}
              </button>
              <button 
                onClick={handleLogout}
                className="px-5 py-2.5 bg-[#ed4245] hover:bg-[#c03537] rounded text-sm font-medium transition"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="sticky top-0 z-40 bg-[#18181b] border-b border-[#26262c]">
        <div className="px-8">
          <div className="flex gap-1">
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
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition border-b-2 ${
                  activeTab === tab.id 
                    ? 'text-white border-[#5865f2]' 
                    : 'text-gray-400 border-transparent hover:text-white hover:border-gray-600'
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-[#18181b] rounded-lg p-5 border border-[#26262c]">
                <div className="text-3xl font-bold mb-1">{user.gamesOwned}</div>
                <div className="text-xs text-gray-500 uppercase tracking-wide">Games Owned</div>
              </div>
              <div className="bg-[#18181b] rounded-lg p-5 border border-[#26262c]">
                <div className="text-3xl font-bold text-green-400 mb-1">{user.hoursPlayed}h</div>
                <div className="text-xs text-gray-500 uppercase tracking-wide">Hours Played</div>
              </div>
              <div className="bg-[#18181b] rounded-lg p-5 border border-[#26262c]">
                <div className="text-3xl font-bold text-yellow-400 mb-1">{user.achievements}</div>
                <div className="text-xs text-gray-500 uppercase tracking-wide">Achievements</div>
              </div>
              <div className="bg-[#18181b] rounded-lg p-5 border border-[#26262c]">
                <div className="text-3xl font-bold text-purple-400 mb-1">{user.friends}</div>
                <div className="text-xs text-gray-500 uppercase tracking-wide">Friends</div>
              </div>
            </div>

            <div className="bg-[#18181b] rounded-lg p-5 border border-[#26262c]">
              <h3 className="text-lg font-bold mb-4">Profile Info</h3>
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1.5 uppercase tracking-wide">Bio</label>
                    <textarea 
                      value={editForm.bio}
                      onChange={(e) => setEditForm({...editForm, bio: e.target.value})}
                      className="w-full bg-[#0e0e10] border border-[#26262c] rounded px-3 py-2 text-sm text-white focus:border-[#5865f2] focus:outline-none"
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1.5 uppercase tracking-wide">Location</label>
                    <input 
                      value={editForm.location}
                      onChange={(e) => setEditForm({...editForm, location: e.target.value})}
                      className="w-full bg-[#0e0e10] border border-[#26262c] rounded px-3 py-2 text-sm text-white focus:border-[#5865f2] focus:outline-none"
                    />
                  </div>
                  <button 
                    onClick={handleSave}
                    className="w-full py-2 bg-[#5865f2] hover:bg-[#4752c4] rounded text-sm font-medium transition"
                  >
                    Save Changes
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <div className="text-xs text-gray-500 mb-1 uppercase tracking-wide">Bio</div>
                    <div className="text-sm text-gray-300">{user.bio}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-2 uppercase tracking-wide">Favorite Genres</div>
                    <div className="flex gap-2 flex-wrap">
                      {user.favoriteGenres.map(genre => (
                        <span key={genre} className="px-2.5 py-1 bg-[#26262c] rounded text-xs font-medium">{genre}</span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="lg:col-span-3 bg-[#18181b] rounded-lg p-5 border border-[#26262c]">
              <h3 className="text-lg font-bold mb-4">Recent Games</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {user.recentGames.map((game, index) => (
                  <div key={index} className="flex items-center gap-3 p-4 bg-[#0e0e10] rounded border border-[#26262c] hover:border-[#5865f2] transition">
                    <div className="w-12 h-12 bg-[#5865f2] rounded flex items-center justify-center text-xl">
                      🎮
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{game.name}</div>
                      <div className="text-xs text-gray-500">{game.hours}h • {game.lastPlayed}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'games' && (
          <div className="text-center py-20 bg-[#18181b] rounded-lg border border-[#26262c]">
            <div className="text-6xl mb-4">🎮</div>
            <h3 className="text-xl font-bold mb-2">Games Library</h3>
            <p className="text-sm text-gray-500">Your game collection will appear here</p>
          </div>
        )}

        {activeTab === 'achievements' && (
          <div className="text-center py-20 bg-[#18181b] rounded-lg border border-[#26262c]">
            <div className="text-6xl mb-4">🏆</div>
            <h3 className="text-xl font-bold mb-2">Achievements</h3>
            <p className="text-sm text-gray-500">Your gaming achievements will be displayed here</p>
          </div>
        )}

        {activeTab === 'friends' && (
          <div className="text-center py-20 bg-[#18181b] rounded-lg border border-[#26262c]">
            <div className="text-6xl mb-4">👥</div>
            <h3 className="text-xl font-bold mb-2">Friends</h3>
            <p className="text-sm text-gray-500">Connect with other gamers</p>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="text-center py-20 bg-[#18181b] rounded-lg border border-[#26262c]">
            <div className="text-6xl mb-4">⚙️</div>
            <h3 className="text-xl font-bold mb-2">Account Settings</h3>
            <p className="text-sm text-gray-500">Manage your account preferences</p>
          </div>
        )}
      </div>
    </div>
  );
}