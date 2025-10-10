'use client';

import { useState } from 'react';
import { QRCodeDisplay } from '@/components/QRCodeDisplay';

export default function GenerateTilesPage() {
  const [numTiles, setNumTiles] = useState(20);
  const [tiles, setTiles] = useState<number[]>([]);

  const generateTiles = () => {
    setTiles(Array.from({ length: numTiles }, (_, i) => i + 1));
  };

  const downloadTile = (tileNumber: number) => {
    const canvas = document.getElementById(`tile-${tileNumber}`) as HTMLCanvasElement;
    if (canvas) {
      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `tile-${tileNumber}.png`;
      link.href = url;
      link.click();
    }
  };

  const downloadAll = () => {
    tiles.forEach((tile, index) => {
      setTimeout(() => {
        downloadTile(tile);
      }, index * 500); // Stagger downloads
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Generate Board Tiles</h1>
          <p className="text-white/80">Create QR codes for your physical board tiles</p>
        </div>

        <div className="bg-white rounded-xl shadow-2xl p-8 mb-8">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-gray-700 font-semibold mb-2">
                Number of Tiles
              </label>
              <input
                type="number"
                value={numTiles}
                onChange={(e) => setNumTiles(parseInt(e.target.value) || 20)}
                min="1"
                max="100"
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
              />
            </div>
            <button
              onClick={generateTiles}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Generate
            </button>
            {tiles.length > 0 && (
              <button
                onClick={downloadAll}
                className="px-6 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
              >
                Download All
              </button>
            )}
          </div>
        </div>

        {tiles.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {tiles.map((tileNumber) => (
              <div key={tileNumber} className="bg-white rounded-lg shadow-lg p-4">
                <div className="text-center mb-4">
                  <h3 className="text-2xl font-bold text-gray-900">
                    Tile {tileNumber}
                  </h3>
                </div>
                
                <div id={`tile-container-${tileNumber}`}>
                  <QRCodeDisplay
                    data={JSON.stringify({ type: 'tile', position: tileNumber })}
                    size={200}
                  />
                </div>

                <button
                  onClick={() => downloadTile(tileNumber)}
                  className="w-full mt-4 px-4 py-2 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition-colors text-sm"
                >
                  Download
                </button>
              </div>
            ))}
          </div>
        )}

        {tiles.length === 0 && (
          <div className="bg-white rounded-xl shadow-2xl p-12 text-center">
            <div className="text-6xl mb-4">📦</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              No Tiles Generated Yet
            </h2>
            <p className="text-gray-600">
              Enter the number of tiles you need and click Generate
            </p>
          </div>
        )}

        <div className="mt-8 bg-white/10 rounded-lg p-6 text-white">
          <h3 className="text-xl font-bold mb-4">Instructions</h3>
          <ol className="list-decimal list-inside space-y-2">
            <li>Enter the number of tiles you want to create</li>
            <li>Click "Generate" to create QR codes</li>
            <li>Download individual tiles or all at once</li>
            <li>Print the QR codes</li>
            <li>Laminate for durability (recommended)</li>
            <li>Arrange them on your board in order</li>
          </ol>

          <div className="mt-4 p-4 bg-white/10 rounded-lg">
            <p className="font-semibold mb-2">💡 Tips:</p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Use high-quality paper or cardstock</li>
              <li>Make tiles at least 3x3 inches for easy scanning</li>
              <li>Include the tile number printed below the QR code</li>
              <li>Test scanning before final lamination</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
