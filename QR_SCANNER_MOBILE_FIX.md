# QR Scanner Mobile Fix - Troubleshooting Guide

## Changes Made

### 1. Replaced QR Scanner Library
**Old**: `html5-qrcode` - Has compatibility issues on mobile devices
**New**: `react-qr-reader` - Better mobile support and simpler API

### 2. Improved UI/UX
- ✅ Added visual scanning frame overlay
- ✅ Better error messages with troubleshooting tips
- ✅ Clear instructions for users
- ✅ Larger scanning area (square aspect ratio)
- ✅ Cancel button for easy exit

### 3. Better Error Handling
- Shows specific camera errors
- Provides guidance on fixing permission issues
- Prevents duplicate scans with `hasScanned` flag

## Testing the QR Scanner

### On Mobile Device:

1. **Test Camera Permissions**:
   - Open the game on your phone
   - Roll the dice
   - Tap to open scanner
   - When prompted, **Allow Camera Access**

2. **If Camera Doesn't Open**:
   - Check browser settings → Site permissions → Camera
   - Make sure camera is enabled for your site
   - Try reloading the page

3. **Scan a QR Code**:
   - Position QR code in the blue frame
   - Keep phone steady
   - Ensure good lighting
   - Scanner should detect within 1-2 seconds

### Browser Compatibility:

**✅ Recommended Browsers**:
- Safari (iOS) - Best performance
- Chrome (Android) - Works well
- Firefox (Android) - Good support

**⚠️ May Have Issues**:
- In-app browsers (Instagram, Facebook, etc.)
- Old browser versions
- WebView components

### If Scanner Still Doesn't Work:

1. **Try HTTPS**: QR scanner requires HTTPS in production
   ```
   Camera access requires secure context (HTTPS)
   ```

2. **Check Camera Availability**:
   - Close other apps using camera
   - Restart browser
   - Test camera in native camera app

3. **Browser Developer Mode**:
   - Open browser console (F12 or inspect)
   - Look for camera/permission errors
   - Check console logs: "QR Scanner error:"

4. **Alternative: Manual Input** (Future Enhancement):
   ```typescript
   // Add manual tile position input as fallback
   <input 
     type="number" 
     placeholder="Enter tile position manually"
     onChange={(e) => handleTileScan(JSON.stringify({position: e.target.value}))}
   />
   ```

## Common Errors & Solutions

### Error: "Camera access denied"
**Solution**: Go to browser settings → Clear site data → Reload → Allow camera

### Error: "Camera not available"
**Solution**: 
- Check if camera is blocked by another app
- Restart browser
- Check device camera works in other apps

### Error: "getUserMedia not supported"
**Solution**: 
- Update browser to latest version
- Use Chrome or Safari
- Enable camera in browser flags

### QR Code Not Detected
**Solution**:
- Improve lighting
- Hold phone closer/further
- Clean camera lens
- Ensure QR code is printed clearly

## Local Development Setup

For local testing with camera on mobile:

1. **Use HTTPS in dev**:
   ```bash
   # Install mkcert for local SSL
   brew install mkcert
   mkcert -install
   mkcert localhost
   
   # Run Next.js with HTTPS
   npm run dev -- --experimental-https
   ```

2. **Or use ngrok for external access**:
   ```bash
   # Install ngrok
   brew install ngrok
   
   # Expose local server
   ngrok http 3000
   
   # Use the https URL on your phone
   ```

3. **Or test on same network**:
   ```bash
   # Find your local IP
   ifconfig | grep "inet "
   
   # Access from phone using IP
   https://192.168.1.XXX:3000
   ```

## Vercel Deployment Notes

✅ Vercel automatically provides HTTPS
✅ Camera should work on production URL
✅ Test on actual device after deployment

## Code Reference

### New QRScanner Component Features:

```typescript
// Auto-detects and closes after successful scan
const [hasScanned, setHasScanned] = useState(false);

// Uses react-qr-reader with environment camera
<QrReader
  onResult={handleScan}
  constraints={{
    facingMode: 'environment', // Back camera
  }}
/>

// Visual scanning guide
<div className="w-64 h-64 border-4 border-blue-500 rounded-lg" />
```

### Game Page Integration:

```typescript
// Opens scanner after dice roll
const handleDiceRoll = async (value: number) => {
  // ... update position
  setTimeout(() => {
    setShowScanner(true); // Opens QR scanner modal
  }, 1000);
};

// Processes scanned QR data
const handleTileScan = async (data: string) => {
  setShowScanner(false); // Closes scanner
  const parsedData = JSON.parse(data);
  // Fetch question for tile...
};
```

## Next Steps

After deploying:
1. ✅ Test on actual mobile device (not emulator)
2. ✅ Verify HTTPS is enabled
3. ✅ Grant camera permissions when prompted
4. ✅ Scan a test QR code
5. ✅ Verify question loads correctly

If issues persist, check browser console for specific error messages.
