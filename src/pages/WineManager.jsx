export default function WineManager() {
  const versions = [
    { name: 'Wine-GE-Proton 8.25', installed: true, size: '450 MB' },
    { name: 'Wine-GE-Proton 8.24', installed: false, size: '445 MB' },
    { name: 'Proton 9.0', installed: true, size: '520 MB' },
  ];

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Wine Manager</h1>
        <button className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700">
          Install New Version
        </button>
      </div>
      
      <div className="grid gap-4">
        {versions.map((v, i) => (
          <div key={i} className="bg-gray-900/50 rounded-xl p-6 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold">{v.name}</h3>
              <p className="text-sm text-gray-400">{v.size}</p>
            </div>
            <div className="flex gap-2">
              {v.installed ? (
                <>
                  <span className="px-4 py-2 bg-green-600/20 text-green-400 rounded-lg">Installed</span>
                  <button className="px-4 py-2 bg-red-600 rounded-lg hover:bg-red-700">Uninstall</button>
                </>
              ) : (
                <button className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700">Install</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
