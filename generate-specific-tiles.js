const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

// Specific positions to generate with question type
const QUESTION_POSITIONS = [7, 9, 10, 16, 20, 23, 27, 30, 33, 36];
const OUTPUT_DIR = './board-tiles';

// Create output directory if it doesn't exist
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function generateTileWithLabel(position) {
  try {
    // Create QR code data with question type
    const tileData = {
      type: 'question',
      position: position,
      description: `Question Tile ${position}`
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
    
    const filename = `tile-${position.toString().padStart(2, '0')}-question.png`;
    const filepath = path.join(OUTPUT_DIR, filename);
    
    fs.writeFileSync(filepath, qrBuffer);
    
    // Also create a simple text file with position info
    const infoFile = path.join(OUTPUT_DIR, `tile-${position.toString().padStart(2, '0')}-info.txt`);
    fs.writeFileSync(infoFile, `
Position: ${position}
Type: Question
QR Data: ${qrData}
File: ${filename}
    `.trim());
    
    return { position, tileType: 'question', filename, qrData };
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
  <title>FlowQuest Specific Question Tiles - Printable</title>
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
    
    .positions-list {
      text-align: center;
      margin-bottom: 20px;
      font-size: 18px;
      color: #2563eb;
      font-weight: bold;
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
    
    .tile-card .position-number {
      font-size: 24px;
      font-weight: bold;
      color: #2563eb;
      margin-bottom: 10px;
    }
    
    .tile-card .tile-type {
      font-size: 12px;
      color: #1e40af;
      margin-bottom: 10px;
      padding: 4px 8px;
      background: #dbeafe;
      border-radius: 4px;
      display: inline-block;
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
    <h1>🎮 FlowQuest Question Tiles</h1>
    <p>Print this page and cut out each tile. Label with position number clearly.</p>
    <div class="positions-list">
      Positions: ${tiles.map(t => t.position).join(', ')}
    </div>
  </div>
  
  <div class="tiles-grid">
${tiles.map(tile => {
  return `    <div class="tile-card">
      <div class="position-number">Position ${tile.position}</div>
      <div class="tile-type">❓ Question</div>
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
      <li>Write the position number clearly and prominently on each tile</li>
      <li>Laminate each tile for durability</li>
      <li>Place tiles on your physical board at positions: ${tiles.map(t => t.position).join(', ')}</li>
      <li>Test scanning before final setup</li>
    </ol>
  </div>
</body>
</html>`;

  const htmlPath = path.join(OUTPUT_DIR, 'specific-question-tiles.html');
  fs.writeFileSync(htmlPath, html);
  return htmlPath;
}

async function generateSpecificTiles() {
  console.log('🎮 FlowQuest Specific Question Tiles Generator');
  console.log('============================================\n');
  console.log(`Generating ${QUESTION_POSITIONS.length} question tiles...\n`);
  console.log(`Positions: ${QUESTION_POSITIONS.join(', ')}\n`);
  
  const tiles = [];
  
  // Generate all specified tiles
  for (const position of QUESTION_POSITIONS) {
    const tile = await generateTileWithLabel(position);
    
    if (tile) {
      tiles.push(tile);
      console.log(`✓ Generated: Position ${position} (question) - ${tile.filename}`);
    }
  }
  
  // Create summary file
  const summaryPath = path.join(OUTPUT_DIR, 'SPECIFIC_TILES_SUMMARY.txt');
  let summary = 'FlowQuest Specific Question Tiles Summary\n';
  summary += '==========================================\n\n';
  summary += `Total Tiles: ${tiles.length}\n`;
  summary += `Positions: ${QUESTION_POSITIONS.join(', ')}\n`;
  summary += `Output Directory: ${OUTPUT_DIR}\n\n`;
  summary += 'Tile List:\n';
  summary += '----------\n';
  
  tiles.forEach(tile => {
    summary += `Position ${tile.position.toString().padStart(2, ' ')}: Question - ${tile.filename}\n`;
  });
  
  summary += '\n\nPrinting Instructions:\n';
  summary += '----------------------\n';
  summary += '1. Print each tile PNG file\n';
  summary += '2. Cut out the QR code\n';
  summary += '3. Write the position number clearly on the tile\n';
  summary += '4. Laminate for durability\n';
  summary += '5. Place on your physical board at the correct positions\n';
  summary += '6. Test scanning before final setup\n';
  
  fs.writeFileSync(summaryPath, summary);
  
  // Generate printable HTML file
  const htmlPath = await generatePrintableHTML(tiles);
  
  console.log(`\n📁 All tiles saved to: ${OUTPUT_DIR}/`);
  console.log(`📄 Summary saved to: ${summaryPath}`);
  console.log(`🌐 Printable HTML saved to: ${htmlPath}\n`);
  console.log('🎯 Generated Tiles:');
  tiles.forEach(tile => {
    console.log(`   - Position ${tile.position}: ${tile.filename}`);
  });
  console.log('\n🎯 Next Steps:');
  console.log('1. Open specific-question-tiles.html in your browser');
  console.log('2. Print the page (or print individual PNG files)');
  console.log('3. Cut out each tile and write the position number clearly');
  console.log('4. Laminate for durability');
  console.log('5. Place on your physical board at the correct positions');
  console.log('6. Test scanning before final setup\n');
  console.log('🎉 Specific question tiles generated successfully!');
}

// Run the generator
generateSpecificTiles().catch(console.error);

