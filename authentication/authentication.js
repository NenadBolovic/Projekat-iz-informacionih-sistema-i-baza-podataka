import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authenticationRoute.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

app.use(express.json());
app.use(cors());


app.use(authRoutes);
app.use(errorHandler);

const PORT = 3003;
app.listen(PORT, () => {
    console.log(`Authentication service running on port ${PORT}`);
});


