# SMS Payment Notifications Setup Guide

## ✅ What's Been Implemented:

1. **SMS Service** (`src/utils/sms.js`)

   - MSG91 integration for India
   - Send payment notifications
   - SMS preview with character count
   - Cost estimation per SMS

2. **Invoice Generator** (`src/utils/invoice.js`)

   - Generate PDF invoices using jsPDF
   - Company branding
   - Worker and payment details
   - Download functionality

3. **Payments Page Updates**
   - "Send SMS" checkbox when adding payments
   - Live SMS preview
   - Character count and cost estimate
   - Auto-sends SMS after payment recorded

## 🚀 Setup Instructions:

### Step 1: Create MSG91 Account (5 minutes)

1. Go to [https://msg91.com](https://msg91.com)
2. Click **"Sign Up"** (free account)
3. Verify your phone number and email
4. Complete registration

### Step 2: Get API Key

1. Login to MSG91 dashboard
2. Go to **API** section in left sidebar
3. Copy your **Auth Key** (starts with something like `123456ABC...`)
4. Keep this key safe!

### Step 3: Buy Credits

1. Go to **Settings** → **Add Credits**
2. Purchase ₹100 credits (gets you ~500-600 SMS)
3. Payment via UPI/Card/NetBanking

### Step 4: Configure Your App

1. Open `.env` file in your project root
2. Replace this line:
   ```
   VITE_MSG91_AUTH_KEY=YOUR_MSG91_AUTH_KEY_HERE
   ```
   With your actual key:
   ```
   VITE_MSG91_AUTH_KEY=123456ABCDEFGHIJK789012
   ```
3. Save the file
4. **Restart your dev server** (important!)
   ```
   Press Ctrl+C in terminal
   npm run dev
   ```

### Step 5: Test SMS Feature

1. Go to **Payments** page
2. Click **"Record New Payment"**
3. Select a worker with valid phone number
4. Enter amount
5. You'll see **"Send SMS notification to worker"** checkbox
6. Check the box → See SMS preview
7. Click **"Record Payment"**
8. SMS will be sent automatically!

## 📱 SMS Format:

```
Payment Added - Breeza Construction
Name: Ramesh Kumar
Amount: ₹5,000
Date: 12 Jan 2026
```

## 💰 Cost Information:

- **Per SMS**: ₹0.12 (MSG91 Utility route - $0.00140)
- **100 SMS**: ~₹12
- **₹100 credit**: ~833 SMS (lasts 8+ months for 50 workers!)
- **No monthly fees** - pay only when you send

### Pricing Breakdown:

- MSG91 Utility/Transactional route: $0.00140 per SMS
- In INR: ~₹0.12 per SMS (1 USD ≈ ₹83)
- Much cheaper than promotional SMS!
- Best for payment notifications, receipts, updates

## 🎯 Features:

✅ **On-Demand Only** - No recurring charges
✅ **SMS Preview** - See message before sending
✅ **Cost Estimate** - Shows approximate cost per SMS
✅ **Character Count** - Shows SMS parts (1 SMS = 160 chars)
✅ **Optional** - Checkbox to enable/disable per payment
✅ **Invoice Ready** - PDF invoice generated (future: can upload and share link)

## ⚙️ Customization:

### Change Sender ID (Company Name):

Edit `src/utils/sms.js`:

```javascript
const MSG91_SENDER_ID = "BREEZA"; // Change to your company name (max 6 chars)
```

### Change SMS Message:

Edit `previewPaymentSMS` function in `src/utils/sms.js` to customize message format.

## 🐛 Troubleshooting:

**SMS not sending?**

1. Check `.env` file has correct API key
2. Restart dev server after adding key
3. Check MSG91 dashboard for credits balance
4. Verify worker phone number is 10 digits

**Invalid phone number error?**

- Phone must be 10 digits (without +91)
- Format: 9876543210 ✅
- Not: +91 9876543210 ❌

**No SMS checkbox visible?**

- Make sure `.env` file has API key
- Restart server: `Ctrl+C` then `npm run dev`

## 📊 Monitoring:

- Check MSG91 dashboard for:
  - SMS delivery status
  - Remaining credits
  - Usage reports
  - Failed messages

## 🔐 Security:

- Never commit `.env` file to Git
- `.env` is in `.gitignore` by default
- Keep your API key secret
- For production, use environment variables on hosting platform (Vercel, etc.)

## 📝 Notes:

- SMS is sent **only for new payments** (not edits)
- Worker must have valid phone number
- Invoice PDF is generated but not uploaded to storage yet (can add this feature later)
- SMS costs ~₹0.15-0.25 each (very affordable!)

## 🎉 You're All Set!

Once you add your MSG91 API key, workers will receive instant SMS notifications when you record payments!
