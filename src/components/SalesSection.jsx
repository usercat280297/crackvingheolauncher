import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function SalesSection() {
  const [salesData, setSalesData] = useState({
    epic: { free: [], sales: [] },
    steam: { featured: [], specials: [] }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSalesData();
  }, []);

  const fetchSalesData = async () => {
    try {
      setLoading(true);
      // Always use mock data since API is not working
      setSalesData({
        epic: {
          free: [
            {
              id: 'epic_free_1',
              title: 'Control',
              keyImages: [{ url: 'https://cdn1.epicgames.com/salesEvent/salesEvent/EGS_Control_RemedyEntertainment_S1_2560x1440-c7c10b0ac2d6fc1e3b5e5a8e8e8e8e8e' }],
              seller: { name: 'Remedy Entertainment' }
            },
            {
              id: 'epic_free_2', 
              title: 'Fallout 3: Game of the Year Edition',
              keyImages: [{ url: 'https://cdn1.epicgames.com/offer/ac2c3883be2542b98a0268d9d80d50f2/EGS_Fallout3GameoftheYearEdition_BethesdaGameStudios_S1_2560x1440-c7c10b0ac2d6fc1e3b5e5a8e8e8e8e8e' }],
              seller: { name: 'Bethesda Game Studios' }
            },
            {
              id: 'epic_free_3',
              title: 'Metro: Last Light Redux',
              keyImages: [{ url: 'https://cdn1.epicgames.com/offer/424c217bce8c4cd2a1fcaab9aca2972f/EGS_MetroLastLightRedux_4AGames_S1_2560x1440-c7c10b0ac2d6fc1e3b5e5a8e8e8e8e8e' }],
              seller: { name: '4A Games' }
            },
            {
              id: 'epic_free_4',
              title: 'Borderlands 3',
              keyImages: [{ url: 'https://cdn1.epicgames.com/offer/9773aa1aa54f4f7b80e44bef04986cea/EGS_Borderlands3_GearboxSoftware_S1_2560x1440-c7c10b0ac2d6fc1e3b5e5a8e8e8e8e8e' }],
              seller: { name: 'Gearbox Software' }
            },
            {
              id: 'epic_free_5',
              title: 'Assassins Creed Valhalla',
              keyImages: [{ url: 'https://cdn1.epicgames.com/offer/9bcf5a4dc1d54cb6ab1a42f3a70c5cf4/EGS_AssassinsCreedValhalla_Ubisoft_S1_2560x1440-c7c10b0ac2d6fc1e3b5e5a8e8e8e8e8e' }],
              seller: { name: 'Ubisoft' }
            },
            {
              id: 'epic_free_6',
              title: 'Grand Theft Auto V',
              keyImages: [{ url: 'https://cdn1.epicgames.com/0584d2013f0149a791e7b9bad0eec102/offer/GTAV_EGS_Artwork_1200x1600_Portrait%20Store%20Banner-1200x1600-382243057711adf80322ed2aeea42191.jpg' }],
              seller: { name: 'Rockstar Games' }
            }
          ],
          sales: []
        },
        steam: {
          featured: [
            {
              id: 'steam_1',
              name: 'Cyberpunk 2077',
              header_image: 'https://cdn.akamai.steamstatic.com/steam/apps/1091500/header.jpg',
              discounted: true,
              discount_percent: 50,
              original_price: 5999,
              final_price: 2999,
              currency: 'USD'
            },
            {
              id: 'steam_2',
              name: 'The Witcher 3: Wild Hunt',
              header_image: 'https://cdn.akamai.steamstatic.com/steam/apps/292030/header.jpg',
              discounted: true,
              discount_percent: 70,
              original_price: 3999,
              final_price: 1199,
              currency: 'USD'
            },
            {
              id: 'steam_3',
              name: 'Red Dead Redemption 2',
              header_image: 'https://cdn.akamai.steamstatic.com/steam/apps/1174180/header.jpg',
              discounted: true,
              discount_percent: 60,
              original_price: 5999,
              final_price: 2399,
              currency: 'USD'
            },
            {
              id: 'steam_4',
              name: 'Elden Ring',
              header_image: 'https://cdn.akamai.steamstatic.com/steam/apps/1245620/header.jpg',
              discounted: true,
              discount_percent: 30,
              original_price: 5999,
              final_price: 4199,
              currency: 'USD'
            },
            {
              id: 'steam_5',
              name: 'God of War',
              header_image: 'https://cdn.akamai.steamstatic.com/steam/apps/1593500/header.jpg',
              discounted: true,
              discount_percent: 50,
              original_price: 4999,
              final_price: 2499,
              currency: 'USD'
            },
            {
              id: 'steam_6',
              name: 'Horizon Zero Dawn',
              header_image: 'https://cdn.akamai.steamstatic.com/steam/apps/1151640/header.jpg',
              discounted: true,
              discount_percent: 60,
              original_price: 4999,
              final_price: 1999,
              currency: 'USD'
            }
          ],
          specials: [
            {
              id: 'steam_special_1',
              name: 'Baldurs Gate 3',
              header_image: 'https://cdn.akamai.steamstatic.com/steam/apps/1086940/header.jpg',
              discounted: true,
              discount_percent: 20,
              original_price: 5999,
              final_price: 4799,
              currency: 'USD'
            },
            {
              id: 'steam_special_2',
              name: 'Starfield',
              header_image: 'https://cdn.akamai.steamstatic.com/steam/apps/1716740/header.jpg',
              discounted: true,
              discount_percent: 25,
              original_price: 6999,
              final_price: 5249,
              currency: 'USD'
            },
            {
              id: 'steam_special_3',
              name: 'Spider-Man Remastered',
              header_image: 'https://cdn.akamai.steamstatic.com/steam/apps/1817070/header.jpg',
              discounted: true,
              discount_percent: 40,
              original_price: 5999,
              final_price: 3599,
              currency: 'USD'
            }
          ]
        }
      });
    } catch (err) {
      setError('Network error');
      console.error('Sales fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price, currency = 'USD') => {
    if (!price) return 'Free';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(price / 100);
  };

  if (loading) {
    return (
      <div className="space-y-8">
        {/* Epic Games Loading */}
        <div className="bg-gradient-to-r from-purple-900/20 to-purple-800/10 rounded-2xl p-6 border border-purple-500/20">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center">
                <span className="text-xl font-bold text-white">E</span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Epic Games Sale</h2>
                <span className="bg-purple-600/80 text-white px-3 py-1 rounded-full text-sm font-medium">
                  Up to 75% OFF
                </span>
              </div>
            </div>
          </div>
          <div className="text-gray-400">Loading Epic sales...</div>
        </div>

        {/* Steam Loading */}
        <div className="bg-gradient-to-r from-blue-900/20 to-blue-800/10 rounded-2xl p-6 border border-blue-500/20">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                <span className="text-xl font-bold text-white">S</span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Steam Sale</h2>
                <span className="bg-blue-600/80 text-white px-3 py-1 rounded-full text-sm font-medium">
                  Weekend Deal
                </span>
              </div>
            </div>
          </div>
          <div className="text-gray-400">Loading Steam sales...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-500/20 rounded-2xl p-6">
        <div className="text-red-400">Error loading sales: {error}</div>
        <button 
          onClick={fetchSalesData}
          className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg transition"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Epic Games Section */}
      <div className="bg-gradient-to-r from-purple-900/20 to-purple-800/10 rounded-2xl p-6 border border-purple-500/20">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center">
              <span className="text-xl font-bold text-white">E</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Epic Games Sale</h2>
              <span className="bg-purple-600/80 text-white px-3 py-1 rounded-full text-sm font-medium">
                Up to 75% OFF
              </span>
            </div>
          </div>
          <Link 
            to="/epic-sale" 
            className="text-purple-400 hover:text-purple-300 flex items-center gap-2 transition"
          >
            See All
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {salesData.epic.free.slice(0, 6).map((game, index) => (
            <div key={game.id || index} className="group cursor-pointer">
              <div className="relative overflow-hidden rounded-lg bg-gray-800 aspect-[3/4]">
                <img 
                  src={game.keyImages?.find(img => img.type === 'DieselStoreFrontWide')?.url || 
                       game.keyImages?.[0]?.url || 
                       '/placeholder-game.jpg'} 
                  alt={game.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    e.target.src = '/placeholder-game.jpg';
                  }}
                />
                <div className="absolute top-2 left-2">
                  <span className="bg-green-600 text-white px-2 py-1 rounded text-xs font-bold">
                    FREE
                  </span>
                </div>
              </div>
              <div className="mt-2">
                <h3 className="text-white text-sm font-medium truncate">{game.title}</h3>
                <p className="text-gray-400 text-xs truncate">{game.seller?.name || 'Epic Games'}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Steam Section */}
      <div className="bg-gradient-to-r from-blue-900/20 to-blue-800/10 rounded-2xl p-6 border border-blue-500/20">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
              <span className="text-xl font-bold text-white">S</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Steam Sale</h2>
              <span className="bg-blue-600/80 text-white px-3 py-1 rounded-full text-sm font-medium">
                Weekend Deal
              </span>
            </div>
          </div>
          <Link 
            to="/steam-sale" 
            className="text-blue-400 hover:text-blue-300 flex items-center gap-2 transition"
          >
            See All
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {salesData.steam.featured.slice(0, 6).map((game, index) => (
            <div key={game.id || index} className="group cursor-pointer">
              <div className="relative overflow-hidden rounded-lg bg-gray-800 aspect-[3/4]">
                <img 
                  src={game.header_image || game.large_capsule_image || '/placeholder-game.jpg'} 
                  alt={game.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    e.target.src = '/placeholder-game.jpg';
                  }}
                />
                {game.discounted && (
                  <div className="absolute top-2 left-2">
                    <span className="bg-green-600 text-white px-2 py-1 rounded text-xs font-bold">
                      -{game.discount_percent}%
                    </span>
                  </div>
                )}
              </div>
              <div className="mt-2">
                <h3 className="text-white text-sm font-medium truncate">{game.name}</h3>
                <div className="flex items-center gap-2">
                  {game.discounted ? (
                    <>
                      <span className="text-gray-400 text-xs line-through">
                        {formatPrice(game.original_price, game.currency)}
                      </span>
                      <span className="text-green-400 text-xs font-bold">
                        {formatPrice(game.final_price, game.currency)}
                      </span>
                    </>
                  ) : (
                    <span className="text-gray-400 text-xs">
                      {formatPrice(game.final_price, game.currency)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* On Sale Section */}
      <div className="bg-gradient-to-r from-orange-900/20 to-red-800/10 rounded-2xl p-6 border border-orange-500/20">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
              <span className="text-xl">🔥</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">On Sale</h2>
              <span className="bg-red-600/80 text-white px-3 py-1 rounded-full text-sm font-medium">
                Limited Time
              </span>
            </div>
          </div>
          <Link 
            to="/sales" 
            className="text-orange-400 hover:text-orange-300 flex items-center gap-2 transition"
          >
            See All
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {salesData.steam.specials.slice(0, 6).map((game, index) => (
            <div key={game.id || index} className="group cursor-pointer">
              <div className="relative overflow-hidden rounded-lg bg-gray-800 aspect-[3/4]">
                <img 
                  src={game.header_image || game.large_capsule_image || '/placeholder-game.jpg'} 
                  alt={game.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    e.target.src = '/placeholder-game.jpg';
                  }}
                />
                {game.discounted && (
                  <div className="absolute top-2 left-2">
                    <span className="bg-red-600 text-white px-2 py-1 rounded text-xs font-bold">
                      -{game.discount_percent}%
                    </span>
                  </div>
                )}
              </div>
              <div className="mt-2">
                <h3 className="text-white text-sm font-medium truncate">{game.name}</h3>
                <div className="flex items-center gap-2">
                  {game.discounted ? (
                    <>
                      <span className="text-gray-400 text-xs line-through">
                        {formatPrice(game.original_price, game.currency)}
                      </span>
                      <span className="text-green-400 text-xs font-bold">
                        {formatPrice(game.final_price, game.currency)}
                      </span>
                    </>
                  ) : (
                    <span className="text-gray-400 text-xs">
                      {formatPrice(game.final_price, game.currency)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}