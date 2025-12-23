export default function Platforms() {
  const platforms = [
    { name: 'Epic Games', icon: '🎮', connected: true, games: 45 },
    { name: 'GOG', icon: '🕹️', connected: true, games: 23 },
    { name: 'Steam', icon: '💨', connected: false, games: 0 },
    { name: 'Ubisoft Connect', icon: '🎯', connected: false, games: 0 },
  ];

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Platforms</h1>
      
      <div className="grid grid-cols-2 gap-6">
        {platforms.map((p, i) => (
          <div key={i} className="bg-gray-900/50 rounded-xl p-8 text-center">
            <div className="text-6xl mb-4">{p.icon}</div>
            <h3 className="text-2xl font-bold mb-2">{p.name}</h3>
            <p className="text-gray-400 mb-4">{p.games} games</p>
            {p.connected ? (
              <button className="px-6 py-2 bg-red-600 rounded-lg hover:bg-red-700">Disconnect</button>
            ) : (
              <button className="px-6 py-2 bg-blue-600 rounded-lg hover:bg-blue-700">Connect</button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
