const QRCode = require('qrcode');

// Test tiles for easy testing
const testTiles = [
  // Powerup tiles - guaranteed powerups
  { position: 1, type: 'powerup', description: 'Powerup Tile 1' },
  { position: 2, type: 'powerup', description: 'Powerup Tile 2' },
  { position: 3, type: 'powerup', description: 'Powerup Tile 3' },
  
  // Question tiles - guaranteed questions
  { position: 4, type: 'question', description: 'Question Tile 4' },
  { position: 5, type: 'question', description: 'Question Tile 5' },
  { position: 6, type: 'question', description: 'Question Tile 6' },
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

async function generateTestTiles() {
  console.log('🎮 FlowQuest Test Tiles QR Generator');
  console.log('===================================\n');
  
  console.log('🎯 These are test tiles for easy testing:');
  console.log('• Powerup tiles (type: "powerup") → ALWAYS give powerup');
  console.log('• Question tiles (type: "question") → ALWAYS give question\n');
  
  // Generate test tiles
  for (const tile of testTiles) {
    const data = JSON.stringify(tile);
    const filename = `test-${tile.type}-${tile.position}`;
    await generateQRCode(data, filename);
  }
  
  console.log('🎯 USAGE INSTRUCTIONS:');
  console.log('1. Scan any of these QR codes in the game when it\'s your turn');
  console.log('2. Powerup tiles will ALWAYS give you a random powerup');
  console.log('3. Question tiles will ALWAYS give you a quiz question');
  console.log('4. No more random percentages - the QR code type determines the outcome!\n');
  
  console.log('🎉 Test tiles generated successfully!');
  console.log('📱 Use your phone camera to scan the QR codes above or the PNG files.');
}

// Run the generator
generateTestTiles().catch(console.error);
