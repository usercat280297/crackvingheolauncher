import { Link } from 'react-router-dom'

export default function GameCard({ game }) {
  return (
    <Link to={`/game/${game.id}`} className="group relative">
      <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-gray-900 shadow-md hover:shadow-xl transition-shadow duration-300">
        <img 
          src={game.cover || 'https://via.placeholder.com/300x400/1f1f2e/888888?text=Game+Cover'} 
          alt={game.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          onError={(e) => {
            e.target.src = 'https://via.placeholder.com/300x400/1f1f2e/888888?text=Game+Cover';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="absolute bottom-0 left-0 right-0 p-3">
            <h3 className="font-bold text-white text-xs mb-1 line-clamp-2">{game.title}</h3>
            <p className="text-xs text-gray-300">{game.size || '5 GB'}</p>
          </div>
        </div>
        {/* Star rating badge */}
        {game.rating && (
          <div className="absolute top-2 right-2 bg-yellow-500/90 px-2 py-1 rounded-full text-xs font-bold text-white">
            ⭐ {game.rating}
          </div>
        )}
      </div>
    </Link>
  )
}
