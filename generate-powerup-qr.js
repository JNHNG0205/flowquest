const QRCode = require('qrcode');

// Powerup tile data - these will trigger powerup scanning
const powerupTiles = [
  { position: 1, type: 'powerup', description: 'Powerup Tile 1' },
  { position: 2, type: 'powerup', description: 'Powerup Tile 2' },
  { position: 3, type: 'powerup', description: 'Powerup Tile 3' },
  { position: 4, type: 'powerup', description: 'Powerup Tile 4' },
  { position: 5, type: 'powerup', description: 'Powerup Tile 5' },
  { position: 6, type: 'powerup', description: 'Powerup Tile 6' },
  { position: 7, type: 'powerup', description: 'Powerup Tile 7' },
  { position: 8, type: 'powerup', description: 'Powerup Tile 8' },
  { position: 9, type: 'powerup', description: 'Powerup Tile 9' },
  { position: 10, type: 'powerup', description: 'Powerup Tile 10' },
];

// Regular question tiles for comparison
const questionTiles = [
  { position: 11, type: 'question', description: 'Question Tile 11' },
  { position: 12, type: 'question', description: 'Question Tile 12' },
  { position: 13, type: 'question', description: 'Question Tile 13' },
  { position: 14, type: 'question', description: 'Question Tile 14' },
  { position: 15, type: 'question', description: 'Question Tile 15' },
];

async function generateQRCode(data, filename) {
  try {
    // Generate QR code as terminal output
    const terminalQR = await QRCode.toString(data, { 
      type: 'terminal', 
      errorCorrectionLevel: 'H',
      width: 2
    });
    
    console.log(`\n${'='.repeat(50)}`);
    console.log(`QR Code: ${filename}`);
    console.log(`Data: ${data}`);
    console.log(`${'='.repeat(50)}`);
    console.log(terminalQR);
    console.log(`${'='.repeat(50)}\n`);
    
    // Also generate as PNG file
    const pngPath = `./qr-${filename}.png`;
    await QRCode.toFile(pngPath, data, {
      errorCorrectionLevel: 'H',
      type: 'png',
      quality: 0.92,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    
    console.log(`📁 PNG saved: ${pngPath}\n`);
    
  } catch (error) {
    console.error(`Error generating QR for ${filename}:`, error.message);
  }
}

async function generateAllQRCodes() {
  console.log('🎮 FlowQuest Powerup QR Code Generator');
  console.log('=====================================\n');
  
  console.log('📋 POWERUP TILES (30% chance to get powerup):');
  console.log('These tiles have a 30% chance to give you a random powerup!\n');
  
  // Generate powerup tiles
  for (const tile of powerupTiles) {
    const data = JSON.stringify(tile);
    const filename = `powerup-${tile.position}`;
    await generateQRCode(data, filename);
  }
  
  console.log('\n📋 QUESTION TILES (70% chance to get question):');
  console.log('These tiles will give you a quiz question.\n');
  
  // Generate question tiles
  for (const tile of questionTiles) {
    const data = JSON.stringify(tile);
    const filename = `question-${tile.position}`;
    await generateQRCode(data, filename);
  }
  
  console.log('\n🎯 USAGE INSTRUCTIONS:');
  console.log('1. Use your phone camera or QR scanner app to scan these codes');
  console.log('2. In the game, when it\'s your turn:');
  console.log('   - Roll the dice');
  console.log('   - Scan any of these QR codes');
  console.log('   - Powerup tiles have 30% chance to give you a powerup');
  console.log('   - Question tiles will give you a quiz question');
  console.log('3. You can hold maximum 3 powerups at once');
  console.log('4. Use powerups during your turn for strategic advantage!\n');
  
  console.log('🎉 All QR codes generated successfully!');
  console.log('Check the PNG files in your project directory for easy scanning.');
}

// Run the generator
generateAllQRCodes().catch(console.error);
