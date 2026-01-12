// Vercel Serverless Function for MSG91 SMS
// This runs on Vercel's backend, avoiding CORS issues

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { phoneNumber, message } = req.body;

    // Validate input
    if (!phoneNumber || !message) {
      return res.status(400).json({ 
        error: 'Missing required fields: phoneNumber and message' 
      });
    }

    // Get MSG91 Auth Key from Vercel environment variables
    const MSG91_AUTH_KEY = process.env.MSG91_AUTH_KEY;
    
    if (!MSG91_AUTH_KEY) {
      return res.status(500).json({ 
        error: 'MSG91_AUTH_KEY not configured on server' 
      });
    }

    // Clean phone number (remove spaces, dashes, +91)
    const cleanPhone = phoneNumber.replace(/[\s\-\+]/g, '').replace(/^91/, '');

    // Validate phone number
    if (cleanPhone.length !== 10) {
      return res.status(400).json({ 
        error: 'Invalid phone number. Must be 10 digits.' 
      });
    }

    // MSG91 API configuration
    const MSG91_SENDER_ID = 'TXTIND';
    const MSG91_ROUTE = '4'; // Transactional

    // Call MSG91 Send HTTP API (simpler, no template needed)
    const url = `https://control.msg91.com/api/sendhttp.php?authkey=${MSG91_AUTH_KEY}&mobiles=${cleanPhone}&message=${encodeURIComponent(message)}&sender=${MSG91_SENDER_ID}&route=${MSG91_ROUTE}&country=91`;

    const response = await fetch(url, {
      method: 'GET'
    });

    const data = await response.text();

    // MSG91 returns text response like "5152464131461213134" (message ID) on success
    if (response.ok && !data.toLowerCase().includes('error')) {
      return res.status(200).json({
        success: true,
        message: 'SMS sent successfully',
        data: { messageId: data }
      });
    } else {
      throw new Error(data || 'Failed to send SMS');
    }

  } catch (error) {
    console.error('SMS Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to send SMS'
    });
  }
}
