import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';

const app = express();

const services = {
    users: 'http://users:3001',
    formsquestions: 'http://formsquestions:3006',
    authentication: 'http://authentication:3003',
    answers: 'http://answers:3002',
};

Object.keys(services).forEach((service) => {
    app.use(
        `/api/${service}`,
        createProxyMiddleware({
            target: services[service],
            changeOrigin: true,
            pathRewrite: {
                [`^/api/${service}`]: '', 
            },
        })
    );
});

const PORT = 3005;
app.listen(PORT, () => {
    console.log(`API Gateway is running on port ${PORT}`);
});


