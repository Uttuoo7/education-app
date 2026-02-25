// Normalize: use env var if set, otherwise localhost. Always ensure /api suffix.
const _base = process.env.REACT_APP_API_BASE || 'http://localhost:8000';
const API_BASE = _base.endsWith('/api') ? _base : `${_base}/api`;

export default API_BASE;

