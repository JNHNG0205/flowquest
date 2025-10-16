const QRCode = require('qrcode');

// 100% Powerup tile - guaranteed to give you a powerup
const guaranteedPowerupTile = {
  position: 999,
  type: 'powerup',
  description: 'GUARANTEED POWERUP TILE - 100% chance!',
  guaranteed: true
};

async function generateQRCode(data, filename) {
  try {
    // Generate QR code as terminal output
    const terminalQR = await QRCode.toString(data, { 
      type: 'terminal', 
      errorCorrectionLevel: 'H',
      width: 2
    });
    
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🎉 GUARANTEED POWERUP QR CODE`);
    console.log(`📱 Data: ${data}`);
    console.log(`${'='.repeat(60)}`);
    console.log(terminalQR);
    console.log(`${'='.repeat(60)}\n`);
    
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

async function generateGuaranteedPowerupQR() {
  console.log('🎮 FlowQuest GUARANTEED POWERUP QR Generator');
  console.log('============================================\n');
  
  console.log('🎯 This QR code will ALWAYS give you a powerup!');
  console.log('💎 Perfect for testing the powerup system\n');
  
  const data = JSON.stringify(guaranteedPowerupTile);
  const filename = 'guaranteed-powerup';
  
  await generateQRCode(data, filename);
  
  console.log('🎯 USAGE INSTRUCTIONS:');
  console.log('1. Scan this QR code in the game when it\'s your turn');
  console.log('2. This tile will ALWAYS give you a random powerup');
  console.log('3. You can hold maximum 3 powerups at once');
  console.log('4. Use powerups during your turn for strategic advantage!');
  console.log('5. If you already have 3 powerups, you\'ll get a question instead\n');
  
  console.log('🎉 Guaranteed powerup QR code generated successfully!');
  console.log('📱 Use your phone camera to scan the QR code above or the PNG file.');
}

// Run the generator
generateGuaranteedPowerupQR().catch(console.error);
