import express from 'express';
import answersRoute from './routes/answersRoute.js';
import cors from 'cors';
import { errorHandler } from './middlewares/errorHandler.js';
import path from 'path';

const app=express();

app.use(cors());
app.use(express.json());
app.use("/images", express.static(path.join("/usr/src/app/uploads")));
app.use('/answers',answersRoute);

app.use(errorHandler);

app.listen(3002,()=>{
    console.log('Answer server in running on port 3002');
})


