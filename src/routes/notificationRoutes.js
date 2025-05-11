const express = require('express');
const router = express.Router();
const admin = require('../../firebase-admin-setup');
const { sendNotification } = require('../services/notification.service');
const { setToken, getToken } = require('../../tokenStorage');

// Endpoint to receive and store FCM token
router.post('/store-token', (req, res) => {
  const { token } = req.body;
  if (!token) {
    return res.status(400).json({ error: 'Token is required' });
  }
  setToken(token);
  console.log(token)
  res.json({ success: true });
});

// Endpoint to send notification
router.post('/send-notification', (req, res) => {
  const { token, title, body, data } = req.body;
  
  const message = {
    notification: { title, body },
    data: data || {},
    token
  };

  admin.messaging().send(message)
    .then(response => {
      res.json({ success: true, response });
    })
    .catch(error => {
      console.error('Error sending message:', error);
      res.status(500).json({ error: 'Failed to send notification' });
    });
});

router.post('/some-route', async (req, res) => {
    const receievedToken = getToken();
    console.log(receievedToken)
    try {
      await sendNotification(
        getToken(), 
        'Action Completed', 
        'Your request was processed',
      );
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

module.exports = router;