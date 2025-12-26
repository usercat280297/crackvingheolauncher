import { Link } from 'react-router-dom'

export default function Bypass() {
  const platforms = [
    { name: 'UBISOFT', logo: '/logo nè/Ubisoft_logo.svg.png', color: 'from-blue-600 to-blue-800' },
    { name: 'EA', logo: '/logo nè/Electronic-Arts-Logo.svg.png', color: 'from-red-600 to-red-800' },
    { name: 'ROCKSTAR', logo: '/logo nè/Rockstar_Games_Logo.svg.png', color: 'from-yellow-600 to-orange-600' },
    { name: 'DENUVO', logo: '/logo nè/Denuvo_logo.png', color: 'from-purple-600 to-purple-800' },
    { name: 'PLAYSTATION', logo: '/logo nè/PlayStation_logo.svg.png', color: 'from-blue-500 to-blue-700' },
    { name: 'OTHER GAMES', logo: '/logo nè/1451303.png', color: 'from-pink-500 to-purple-600' }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 relative overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, cyan 1px, transparent 0)', backgroundSize: '40px 40px' }} />
      </div>

      <div className="relative z-10 p-12">
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold text-white mb-4 tracking-wider italic" style={{ fontFamily: 'Impact, sans-serif' }}>
            SELECT AN APP TO GET STARTED
          </h1>
        </div>

        <div className="max-w-7xl mx-auto grid grid-cols-3 gap-8">
          {platforms.map((platform, index) => (
            <div
              key={index}
              className="group relative aspect-square rounded-3xl overflow-hidden cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-cyan-500/50"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${platform.color} opacity-80 group-hover:opacity-100 transition-opacity`} />
              <div className="absolute inset-0 border-4 border-purple-500/50 rounded-3xl group-hover:border-cyan-400 transition-colors" />
              
              <div className="relative h-full flex flex-col items-center justify-center p-8">
                <div className="w-40 h-40 mb-6 flex items-center justify-center">
                  <img src={platform.logo} alt={platform.name} className="max-w-full max-h-full object-contain filter drop-shadow-2xl" />
                </div>
                <h3 className="text-white text-3xl font-bold tracking-wider">{platform.name}</h3>
              </div>

              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <p className="text-gray-400 text-lg">
            Created by: ©️ᴠĐᴇᴀᴋ©️ Version: 4.0.0.0
          </p>
        </div>
      </div>
    </div>
  )
}
