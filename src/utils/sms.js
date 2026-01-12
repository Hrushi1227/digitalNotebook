// MSG91 SMS Service via Vercel Serverless Function
// This avoids CORS issues by calling MSG91 from backend
// Setup: Add MSG91_AUTH_KEY to Vercel Environment Variables
// See: VERCEL_DEPLOYMENT_GUIDE.md for setup instructions

/**
 * Send SMS via Vercel serverless function (avoids CORS)
 * @param {string} phoneNumber - 10-digit mobile number (without +91)
 * @param {string} message - SMS content (max 160 chars for single SMS)
 * @returns {Promise<object>} Response from SMS service
 */
export const sendSMS = async (phoneNumber, message) => {
  try {
    // Always use the API endpoint (works with Vercel CLI in dev, or production)
    const url = "/api/send-sms";

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        phoneNumber: phoneNumber,
        message: message,
      }),
    });

    const data = await response.json();

    if (response.ok && data.success) {
      return {
        success: true,
        message: "SMS sent successfully",
        data: data,
      };
    } else {
      throw new Error(data.error || data.message || "Failed to send SMS");
    }
  } catch (error) {
    console.error("SMS Error:", error);
    return {
      success: false,
      message: error.message,
    };
  }
};

/**
 * Send payment notification SMS
 * @param {object} payment - Payment object
 * @param {object} worker - Worker object
 * @param {string} invoiceUrl - URL to download invoice (optional)
 */
export const sendPaymentSMS = async (payment, worker, invoiceUrl = null) => {
  const amount = payment.amount || 0;
  const date = new Date(payment.date).toLocaleDateString("en-IN");
  const workerName = worker.name || "Worker";

  let message = `Payment Added - Breeza Construction\n`;
  message += `Name: ${workerName}\n`;
  message += `Amount: ₹${amount}\n`;
  message += `Date: ${date}`;

  if (invoiceUrl) {
    message += `\nInvoice: ${invoiceUrl}`;
  }

  const phone = worker.phoneNumber || worker.phone;

  if (!phone) {
    throw new Error("Worker phone number not found");
  }

  return await sendSMS(phone, message);
};

/**
 * Format SMS preview
 * @param {object} payment - Payment object
 * @param {object} worker - Worker object
 * @param {string} invoiceUrl - Invoice URL (optional)
 * @returns {string} Formatted SMS text
 */
export const previewPaymentSMS = (payment, worker, invoiceUrl = null) => {
  const amount = payment.amount || 0;
  const date = new Date(payment.date).toLocaleDateString("en-IN");
  const workerName = worker.name || "Worker";

  let message = `Payment Added - Breeza Construction\n`;
  message += `Name: ${workerName}\n`;
  message += `Amount: ₹${amount}\n`;
  message += `Date: ${date}`;

  if (invoiceUrl) {
    message += `\nInvoice: ${invoiceUrl}`;
  }

  return message;
};

/**
 * Validate MSG91 configuration
 * @returns {boolean} True if configured
 */
export const isSMSConfigured = () => {
  const authKey = import.meta.env.VITE_MSG91_AUTH_KEY;
  return authKey && authKey !== "YOUR_MSG91_AUTH_KEY_HERE";
};

/**
 * Get SMS character count and parts
 * @param {string} message - SMS text
 * @returns {object} Character count, SMS parts, and cost estimate
 */
export const getSMSInfo = (message) => {
  const length = message.length;
  const parts = Math.ceil(length / 160);

  // MSG91 Utility route pricing for India: $0.00140 per SMS = ~₹0.12 per SMS
  const costPerSMS = 0.12; // INR
  const totalCost = parts * costPerSMS;

  return {
    characters: length,
    parts: parts,
    remaining: parts * 160 - length,
    costPerPart: costPerSMS,
    totalCost: totalCost,
  };
};
