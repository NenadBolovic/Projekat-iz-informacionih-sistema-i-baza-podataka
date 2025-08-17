import express from 'express';
import cors from 'cors';
import userRoute from './routes/userRoute.js';
import { errorHandler } from './middlewares/errorHandler.js';

const app=express();
app.use(express.json());
app.use(cors());
app.use('/users',userRoute);


app.use(errorHandler);

app.listen(3001,()=>{
    console.log('Server is running on port 3001');
})