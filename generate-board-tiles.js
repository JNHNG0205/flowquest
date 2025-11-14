const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

// Board configuration - 10x10 perimeter = 36 positions
const TOTAL_POSITIONS = 36;
const OUTPUT_DIR = './board-tiles';

// Create output directory if it doesn't exist
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Generate random tile types for each position (consistent seed for reproducibility)
function getTileType(position) {
  // Use position as seed for consistent randomness
  // This ensures same position always gets same type
  const seed = position * 12345;
  const random = (seed % 100) / 100;
  return random > 0.5 ? 'question' : 'powerup';
}

async function generateTileWithLabel(position, tileType) {
  try {
    // Create QR code data
    const tileData = {
      type: tileType,
      position: position,
      description: `${tileType === 'question' ? 'Question' : 'Powerup'} Tile ${position}`
    };
    
    const qrData = JSON.stringify(tileData);
    
    // Generate QR code as buffer (larger size for better printing)
    const qrBuffer = await QRCode.toBuffer(qrData, {
      errorCorrectionLevel: 'H',
      type: 'png',
      width: 500, // Larger size for better printing and scanning
      margin: 3,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    
    const filename = `tile-${position.toString().padStart(2, '0')}-${tileType}.png`;
    const filepath = path.join(OUTPUT_DIR, filename);
    
    fs.writeFileSync(filepath, qrBuffer);
    
    // Also create a simple text file with position info
    const infoFile = path.join(OUTPUT_DIR, `tile-${position.toString().padStart(2, '0')}-info.txt`);
    fs.writeFileSync(infoFile, `
Position: ${position}
Type: ${tileType === 'question' ? 'Question' : 'Powerup'}
QR Data: ${qrData}
File: ${filename}
    `.trim());
    
    return { position, tileType, filename, qrData };
  } catch (error) {
    console.error(`Error generating tile ${position}:`, error.message);
    return null;
  }
}

async function generatePrintableHTML(tiles) {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>FlowQuest Board Tiles - Printable</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: Arial, sans-serif;
      padding: 20px;
      background: #f5f5f5;
    }
    
    .header {
      text-align: center;
      margin-bottom: 30px;
      padding: 20px;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    
    .header h1 {
      color: #333;
      margin-bottom: 10px;
    }
    
    .header p {
      color: #666;
    }
    
    .tiles-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }
    
    .tile-card {
      background: white;
      border: 2px solid #ddd;
      border-radius: 8px;
      padding: 15px;
      text-align: center;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      page-break-inside: avoid;
    }
    
    .tile-card h3 {
      font-size: 18px;
      margin-bottom: 10px;
      color: #333;
    }
    
    .tile-card .position-number {
      font-size: 24px;
      font-weight: bold;
      color: #2563eb;
      margin-bottom: 10px;
    }
    
    .tile-card .tile-type {
      font-size: 12px;
      color: #666;
      margin-bottom: 10px;
      padding: 4px 8px;
      background: #f3f4f6;
      border-radius: 4px;
      display: inline-block;
    }
    
    .tile-card .tile-type.question {
      background: #dbeafe;
      color: #1e40af;
    }
    
    .tile-card .tile-type.powerup {
      background: #fef3c7;
      color: #92400e;
    }
    
    .tile-card img {
      width: 100%;
      max-width: 180px;
      height: auto;
      border: 1px solid #ddd;
      border-radius: 4px;
      margin: 10px 0;
    }
    
    .instructions {
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      margin-top: 30px;
    }
    
    .instructions h2 {
      margin-bottom: 15px;
      color: #333;
    }
    
    .instructions ol {
      margin-left: 20px;
    }
    
    .instructions li {
      margin-bottom: 8px;
      color: #666;
    }
    
    @media print {
      body {
        background: white;
        padding: 10px;
      }
      
      .header {
        margin-bottom: 20px;
      }
      
      .tiles-grid {
        grid-template-columns: repeat(4, 1fr);
        gap: 15px;
      }
      
      .tile-card {
        border: 1px solid #000;
      }
      
      .instructions {
        display: none;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>🎮 FlowQuest Board Tiles</h1>
    <p>Print this page and cut out each tile. Label with position number clearly.</p>
  </div>
  
  <div class="tiles-grid">
${tiles.map(tile => {
  const typeClass = tile.tileType === 'question' ? 'question' : 'powerup';
  const typeLabel = tile.tileType === 'question' ? '❓ Question' : '⚡ Powerup';
  return `    <div class="tile-card">
      <div class="position-number">Position ${tile.position}</div>
      <div class="tile-type ${typeClass}">${typeLabel}</div>
      <img src="${tile.filename}" alt="Tile ${tile.position} QR Code" />
      <div style="font-size: 10px; color: #999; margin-top: 5px;">Write position ${tile.position} clearly</div>
    </div>`;
}).join('\n')}
  </div>
  
  <div class="instructions">
    <h2>📋 Printing Instructions</h2>
    <ol>
      <li>Print this page (or individual PNG files from the board-tiles folder)</li>
      <li>Cut out each tile along the border</li>
      <li>Write the position number (1-36) clearly and prominently on each tile</li>
      <li>Optionally write the tile type (Question/Powerup) if desired</li>
      <li>Laminate each tile for durability</li>
      <li>Arrange tiles on your physical board in order (1-36 around the perimeter)</li>
      <li>Test scanning before final setup</li>
    </ol>
    
    <h2 style="margin-top: 20px;">📍 Board Layout Reference</h2>
    <ul style="margin-left: 20px; color: #666;">
      <li><strong>Positions 1-10:</strong> Top row (left to right)</li>
      <li><strong>Positions 11-18:</strong> Right column (top to bottom, excluding corners)</li>
      <li><strong>Positions 19-28:</strong> Bottom row (right to left)</li>
      <li><strong>Positions 29-36:</strong> Left column (bottom to top, excluding corners)</li>
    </ul>
  </div>
</body>
</html>`;

  const htmlPath = path.join(OUTPUT_DIR, 'printable-tiles.html');
  fs.writeFileSync(htmlPath, html);
  return htmlPath;
}

async function generateAllTiles() {
  console.log('🎮 FlowQuest Board Tiles QR Generator');
  console.log('====================================\n');
  console.log(`Generating ${TOTAL_POSITIONS} board tiles...\n`);
  
  const tiles = [];
  
  // Generate all tiles
  for (let position = 1; position <= TOTAL_POSITIONS; position++) {
    const tileType = getTileType(position);
    const tile = await generateTileWithLabel(position, tileType);
    
    if (tile) {
      tiles.push(tile);
      console.log(`✓ Generated: Position ${position} (${tileType}) - ${tile.filename}`);
    }
  }
  
  // Create summary file
  const summaryPath = path.join(OUTPUT_DIR, 'SUMMARY.txt');
  let summary = 'FlowQuest Board Tiles Summary\n';
  summary += '=============================\n\n';
  summary += `Total Tiles: ${TOTAL_POSITIONS}\n`;
  summary += `Output Directory: ${OUTPUT_DIR}\n\n`;
  summary += 'Tile List:\n';
  summary += '----------\n';
  
  tiles.forEach(tile => {
    summary += `Position ${tile.position.toString().padStart(2, ' ')}: ${tile.tileType.padEnd(8)} - ${tile.filename}\n`;
  });
  
  summary += '\n\nPrinting Instructions:\n';
  summary += '----------------------\n';
  summary += '1. Print each tile PNG file\n';
  summary += '2. Cut out the QR code\n';
  summary += '3. Write the position number clearly on the tile\n';
  summary += '4. Optionally write the tile type (Question/Powerup)\n';
  summary += '5. Laminate for durability\n';
  summary += '6. Arrange on your physical board in order (1-36 around the perimeter)\n';
  summary += '\n';
  summary += 'Board Layout:\n';
  summary += '-------------\n';
  summary += 'Positions 1-10:   Top row (left to right)\n';
  summary += 'Positions 11-18: Right column (top to bottom, excluding corners)\n';
  summary += 'Positions 19-28: Bottom row (right to left)\n';
  summary += 'Positions 29-36: Left column (bottom to top, excluding corners)\n';
  
  fs.writeFileSync(summaryPath, summary);
  
  // Generate printable HTML file
  const htmlPath = await generatePrintableHTML(tiles);
  
  console.log(`\n📁 All tiles saved to: ${OUTPUT_DIR}/`);
  console.log(`📄 Summary saved to: ${summaryPath}`);
  console.log(`🌐 Printable HTML saved to: ${htmlPath}\n`);
  console.log('🎯 Next Steps:');
  console.log('1. Open printable-tiles.html in your browser');
  console.log('2. Print the page (or print individual PNG files)');
  console.log('3. Cut out each tile and write the position number clearly');
  console.log('4. Laminate for durability');
  console.log('5. Arrange on your physical board in order (1-36)');
  console.log('6. Test scanning before final setup\n');
  console.log('🎉 Board tiles generated successfully!');
}

// Run the generator
generateAllTiles().catch(console.error);

