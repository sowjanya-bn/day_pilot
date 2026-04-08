const DEV_API = 'http://127.0.0.1:8000';
const PROD_API = 'https://daypilot-api.onrender.com';

export const API_BASE = __DEV__ ? DEV_API : PROD_API;
