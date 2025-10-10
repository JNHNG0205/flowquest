# Mobile QR Scanner Troubleshooting Guide

## Common Issues & Solutions

### Issue 1: Camera Won't Open / Permission Denied

**Symptoms:**
- "Camera access denied" error
- Black screen where camera should be
- Permission popup doesn't appear

**Solutions:**

#### On iPhone (Safari/Chrome):
1. Go to **Settings** → **Safari** (or **Chrome**)
2. Scroll to **Camera**
3. Make sure it's set to **"Ask"** or **"Allow"**
4. Go back to the website and refresh
5. When prompted, tap **"Allow"**

Alternative:
- Tap the **AA** icon in Safari's address bar
- Select **Website Settings**
- Enable **Camera**

#### On Android (Chrome/Firefox):
1. Tap the **🔒 padlock** or **(i) info** icon in address bar
2. Find **Permissions** → **Camera**
3. Set to **"Allow"**
4. Refresh the page

Alternative:
- Go to **Chrome Settings** → **Site Settings** → **Camera**
- Find your site and set to **"Allow"**

---

### Issue 2: Camera Opens But Won't Scan QR Code

**Symptoms:**
- Camera is working but QR doesn't get recognized
- Scanner seems stuck or not responding

**Solutions:**

1. **Lighting Issues:**
   - Ensure QR code is well-lit
   - Avoid glare or shadows on the QR code
   - Try moving to a brighter area

2. **Distance:**
   - Move phone closer/further from QR code
   - Try 10-30cm (4-12 inches) distance
   - Ensure entire QR code is visible in frame

3. **Focus:**
   - Tap the screen to help camera focus
   - Hold phone steady for 2-3 seconds
   - Clean your camera lens

4. **QR Code Quality:**
   - Make sure QR code is printed clearly
   - Check QR code isn't damaged or blurry
   - Verify QR code is the correct size (not too small)

---

### Issue 3: Scanner Works on Desktop But Not Mobile

**Symptoms:**
- Works on computer browser
- Fails on phone browser

**Solutions:**

1. **Use HTTPS:**
   - Camera requires secure connection on mobile
   - Make sure URL starts with `https://`
   - HTTP won't work on most mobile browsers

2. **Browser Compatibility:**
   - **✅ Recommended:** Safari (iOS), Chrome (Android)
   - **⚠️ May have issues:** In-app browsers (Instagram, Facebook, TikTok)
   - **Solution:** Copy link and open in Safari/Chrome

3. **Update Browser:**
   - Ensure browser is up to date
   - Old browser versions may not support camera API

---

### Issue 4: Works Once Then Stops

**Symptoms:**
- First scan works
- Subsequent scans fail
- Need to reload page each time

**Current Status:**
✅ **Fixed!** Scanner now properly closes after each scan

If still occurring:
1. Close scanner modal completely
2. Wait 2 seconds before reopening
3. Clear browser cache if persistent

---

### Issue 5: "getUserMedia not supported" Error

**Symptoms:**
- Error message about getUserMedia
- Technical error about browser compatibility

**Solutions:**

1. **Update Browser:**
   - iOS: Update to iOS 14.3 or later
   - Android: Update Chrome to latest version

2. **Try Different Browser:**
   - iPhone: Use Safari (best support)
   - Android: Use Chrome (best support)

3. **Check Device Compatibility:**
   - Very old phones (5+ years) may not support camera API
   - Some budget phones have limited support

---

## Testing Checklist

Before reporting the issue, please verify:

- [ ] Using **HTTPS** (not HTTP)
- [ ] Camera permission is **allowed** in browser settings
- [ ] QR code is **clearly visible** and **well-lit**
- [ ] Tried **Safari** (iOS) or **Chrome** (Android)
- [ ] **Not using** in-app browser (Instagram, Facebook, etc.)
- [ ] Camera works in other apps (native camera, WhatsApp, etc.)
- [ ] Page has been **refreshed** after granting permissions
- [ ] No other app is using the camera

---

## Quick Diagnosis

Run these tests to identify the problem:

### Test 1: Camera Permission
Open the QR scanner. Do you see:
- ✅ **Live camera feed** → Camera working! Go to Test 2
- ❌ **Black screen or error** → Permission issue (see Issue 1)
- ⏳ **"Starting camera..." forever** → Browser/compatibility issue

### Test 2: QR Detection  
Point camera at QR code. Does it:
- ✅ **Scan immediately** → Working perfectly!
- ⏳ **Takes 5+ seconds** → Lighting/distance issue (see Issue 2)
- ❌ **Never scans** → QR code or focus issue (see Issue 2)

### Test 3: Browser Test
Open this in your browser: `https://qr.io`
- ✅ **Works there** → Issue with our QR codes (check format)
- ❌ **Doesn't work there either** → Browser/permission issue

---

## Code Improvements Made

### v2.0 - Mobile Optimization
✅ Changed `qrbox` from object to number (better mobile support)
✅ Added `disableFlip: false` for more scanning angles
✅ Added explicit permission check before starting
✅ Better error messages with platform-specific instructions
✅ Visual feedback when camera is active
✅ Improved cleanup to prevent "camera in use" issues

### Key Changes:
```typescript
// Old (less compatible)
qrbox: { width: 250, height: 250 }

// New (mobile-friendly)
qrbox: 250
disableFlip: false
```

---

## For Developers

### Local Testing with HTTPS

Mobile devices require HTTPS for camera access. For local testing:

```bash
# Method 1: Use ngrok (easiest)
pnpm dev
# In another terminal:
ngrok http 3000
# Use the https://xxx.ngrok.io URL on your phone

# Method 2: Use mkcert for local SSL
brew install mkcert
mkcert -install
mkcert localhost
# Configure Next.js to use the certificates

# Method 3: Deploy to Vercel
vercel --prod
# Test on the production HTTPS URL
```

### Debug Logging

Add to game page to see what's happening:

```typescript
const handleTileScan = async (data: string) => {
  console.log('Raw QR data:', data);
  console.log('Data type:', typeof data);
  console.log('Data length:', data.length);
  
  try {
    const parsed = JSON.parse(data);
    console.log('Parsed QR data:', parsed);
  } catch (e) {
    console.error('Failed to parse QR:', e);
  }
  
  // ... rest of function
};
```

### Check Browser Console

On mobile:
1. **iOS Safari:** Settings → Safari → Advanced → Web Inspector → Enable
2. **Android Chrome:** chrome://inspect on desktop, connect phone via USB

Look for:
- Camera permission errors
- QR parsing errors  
- Network errors when fetching questions

---

## Expected Behavior

✅ **Normal Flow:**
1. Player rolls dice
2. Scanner modal opens automatically
3. "Starting camera..." shows briefly
4. Camera feed appears with red scanning box
5. Green "Camera Active" message shows
6. Point at QR code
7. Scans within 1-2 seconds
8. Modal closes automatically
9. Question appears

---

## Still Not Working?

If you've tried everything above and it's still not working:

1. **Check Your Setup:**
   - Are you on Vercel/production with HTTPS?
   - Have you run the SQL scripts (QUICK_FIX.sql, sample_questions.sql)?
   - Is Supabase Realtime enabled?

2. **Try Test QR Code:**
   Generate a simple test QR at https://qr.io with text: `{"type":"tile","position":5}`
   
3. **Check Console Logs:**
   - Any errors in browser console?
   - Does "QR Code decoded:" appear in logs?
   - Any network errors?

4. **Report Issue:**
   If truly broken, provide:
   - Device & OS version (e.g., "iPhone 13, iOS 17")
   - Browser & version (e.g., "Safari 17.2")
   - Exact error message or screenshot
   - Console logs
   - Whether HTTPS is enabled

---

## Production Deployment Checklist

Before going live, verify:

- [ ] Deployed to Vercel (automatic HTTPS)
- [ ] Tested on actual mobile device (not emulator)
- [ ] Camera permissions work
- [ ] QR codes are generated correctly
- [ ] Questions load after scanning
- [ ] Turn advances after answering
- [ ] Works on both iOS and Android
- [ ] Works in Safari and Chrome
- [ ] Error messages are helpful

---

## Contact

If issues persist after trying all solutions:
1. Check GitHub issues
2. Review browser console for errors
3. Verify SQL tables are populated
4. Test with different QR code generators
