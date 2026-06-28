const axios = require('axios');
const crypto = require('crypto');

// Initialize Midtrans client (sandbox)
const MIDTRANS_API_URL = 'https://app.sandbox.midtrans.com/api/v1';
const SERVER_KEY = process.env.MIDTRANS_SERVER_KEY;

const createPaymentLink = async (orderId, amount, description, metadata = {}) => {
  try {
    const response = await axios.post(
      `${MIDTRANS_API_URL}/payment_links`,
      {
        transaction_details: {
          order_id: orderId,
          gross_amount: amount
        },
        credit_card: {
          secure: true
        },
        usage_limit: 1,
        expiry: {
          duration: 24,
          unit: 'hours'
        },
        item_details: [{
          id: orderId,
          name: description,
          price: amount,
          quantity: 1
        }]
      },
      {
        auth: {
          username: SERVER_KEY,
          password: ''
        }
      }
    );

    return response.data.payment_url;
  } catch (err) {
    console.error('Midtrans error:', err.response?.data || err.message);
    throw err;
  }
};

const verifyPayment = async (transactionId) => {
  try {
    const response = await axios.get(
      `${MIDTRANS_API_URL}/transactions/${transactionId}/status`,
      {
        auth: {
          username: SERVER_KEY,
          password: ''
        }
      }
    );

    const transaction = response.data;
    const status = transaction.transaction_status;

    // Valid payment statuses
    const validStatuses = ['settlement', 'capture', 'pending'];
    return validStatuses.includes(status);
  } catch (err) {
    console.error('Payment verification error:', err.response?.data || err.message);
    return false;
  }
};

module.exports = { createPaymentLink, verifyPayment };
