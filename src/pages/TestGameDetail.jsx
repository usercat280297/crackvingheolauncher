import { useParams, Link } from 'react-router-dom';

export default function TestGameDetail() {
  const { id } = useParams();
  
  return (
    <div className="min-h-screen bg-black text-white p-8">
      <Link to="/" className="inline-flex items-center gap-2 mb-8 px-4 py-2 bg-gray-800 rounded-lg hover:bg-gray-700">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </Link>

      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Test Game Detail Page</h1>
        
        <div className="bg-gray-900 rounded-xl p-8 space-y-4">
          <div>
            <span className="text-gray-400">Game ID:</span>
            <span className="ml-4 text-cyan-400 text-2xl font-bold">{id}</span>
          </div>
          
          <div>
            <span className="text-gray-400">Route:</span>
            <span className="ml-4 text-green-400">/game/{id}</span>
          </div>
          
          <div>
            <span className="text-gray-400">Status:</span>
            <span className="ml-4 text-green-400">✅ Routing works!</span>
          </div>

          <div className="mt-8 p-4 bg-green-900/20 border border-green-500/30 rounded-lg">
            <p className="text-green-400">
              ✅ If you see this, React Router is working correctly!
            </p>
          </div>

          <div className="mt-4 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
            <p className="text-blue-400 mb-2">Next steps:</p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Check if API is responding</li>
              <li>Check if SteamNameService is loaded</li>
              <li>Check browser console for errors</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
