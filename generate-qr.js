const QRCode = require('qrcode');

const data = JSON.stringify({"type":"tile","position":0});

// Generate QR code in terminal
QRCode.toString(data, { type: 'terminal', errorCorrectionLevel: 'H' }, function (err, url) {
  if (err) throw err;
  console.log('\nQR Code for: ' + data + '\n');
  console.log(url);
});
