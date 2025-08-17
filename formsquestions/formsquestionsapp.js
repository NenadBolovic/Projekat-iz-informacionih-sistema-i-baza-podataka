import express from 'express';
import questionsRoute from './routes/questionsRoute.js';
import formsRoute from './routes/formsRoute.js';
import cors from 'cors';
import { errorHandler } from './middlewares/errorHandler.js';



const app=express();
const port=process.env.FORM_PORT;


app.use(cors());
app.use(express.json());

app.use('/forms', formsRoute);
app.use('/questions', questionsRoute);
app.use(errorHandler);


app.listen(port,()=>{
    console.log(`Server is running on port ${port}`);
})


