// Run once with: node backend/scripts/generateVapidKeys.js
// Then copy both values into your backend/.env file. Never regenerate
// after deployment or all existing subscriptions will break.

const webpush = require('web-push');
const keys = webpush.generateVAPIDKeys();
console.log('VAPID_PUBLIC_KEY=', keys.publicKey);
console.log('VAPID_PRIVATE_KEY=', keys.privateKey);
