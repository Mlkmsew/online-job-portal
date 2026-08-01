// ============================================
// Get Local Network IP Address
// ============================================
const os = require('os');

/**
 * Get the local network IP address of the current machine
 * Useful for accessing the app from other devices on the same network
 * @returns {string|null} The local IP address or null if not found
 */
function getLocalIP() {
  try {
    const interfaces = os.networkInterfaces();
    
    // Look for the first non-internal IPv4 address
    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name]) {
        // Skip internal and non-IPv4 addresses
        if (iface.family === 'IPv4' && !iface.internal) {
          return iface.address;
        }
      }
    }
  } catch (err) {
    console.error('Error getting local IP:', err.message);
  }
  
  return null;
}

/**
 * Build a client URL using the network IP if CLIENT_URL contains localhost
 * This allows password reset links to work on mobile devices on the same network
 * @param {string} clientUrl - The CLIENT_URL from environment
 * @returns {string} The resolved client URL
 */
function resolveClientURL(clientUrl = process.env.CLIENT_URL) {
  if (!clientUrl) {
    return 'http://localhost:5173'; // Fallback default
  }

  // If CLIENT_URL doesn't contain localhost, use it as-is
  if (!clientUrl.includes('localhost') && !clientUrl.includes('127.0.0.1')) {
    return clientUrl;
  }

  // If CLIENT_URL contains localhost, replace it with the local network IP
  const localIP = getLocalIP();
  if (localIP) {
    // Replace localhost or 127.0.0.1 with the local IP
    const resolvedUrl = clientUrl
      .replace(/localhost/g, localIP)
      .replace(/127\.0\.0\.1/g, localIP);
    
    console.log(`🌐 Resolved CLIENT_URL from "${clientUrl}" to "${resolvedUrl}"`);
    return resolvedUrl;
  }

  // If we can't get the local IP, return the original URL
  console.warn('⚠️  Could not detect local IP. Using CLIENT_URL as-is: ' + clientUrl);
  return clientUrl;
}

module.exports = { getLocalIP, resolveClientURL };
