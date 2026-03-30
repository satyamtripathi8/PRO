const apiUrl = import.meta.env.VITE_API_URL || '';

// If apiUrl is empty (e.g. during local dev without .env), default to localhost:3000
// Otherwise use the provided VITE_API_URL
export const API_BASE_URL = apiUrl || 'http://localhost:3000';

// Derive WebSocket URL from API URL
// http://1.2.3.4:3000 -> ws://1.2.3.4:3000/ws
// https://api.example.com -> wss://api.example.com/ws
// Derive WebSocket URL from API URL
// http://1.2.3.4:3000 -> ws://1.2.3.4:3000/ws
// https://api.example.com -> wss://api.example.com/ws
export const WS_BASE_URL = API_BASE_URL.replace(/^http/, 'ws') + '/ws';

console.log('[Config] API Base:', API_BASE_URL);
console.log('[Config] WS Base:', WS_BASE_URL);
