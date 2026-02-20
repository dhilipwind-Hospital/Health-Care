const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function (app) {
  // In Docker, use 'backend:5000' (service name:internal port)
  // Outside Docker, use 'localhost:5001' (host:mapped port)
  const isDocker = process.env.NODE_ENV === 'development' && !process.env.REACT_APP_API_URL?.includes('localhost');
  // Strip trailing /api from REACT_APP_API_URL if present (proxy adds /api prefix itself)
  const rawUrl = process.env.REACT_APP_API_URL || (isDocker ? 'http://backend:5000' : 'http://localhost:5001');
  const backendUrl = rawUrl.replace(/\/api\/?$/, '') || 'http://localhost:5001';
  
  // For Docker environment, always use backend:5000
  const target = process.env.DOCKER_ENV === 'true' ? 'http://backend:5000' : backendUrl;
  
  console.log('[Proxy] Target backend URL:', target);
  
  app.use(
    '/api',
    createProxyMiddleware({
      target: target,
      changeOrigin: true,
      secure: false,
      pathRewrite: { '^/api': '/api' },
      onError: (err, req, res) => {
        console.error('Proxy error:', err, 'Target:', target);
        res.status(504).send({ message: 'Gateway Timeout - Backend service may be unavailable' });
      },
    })
  );
};
