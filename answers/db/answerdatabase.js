
import dotenv from 'dotenv';
import mongoose from "mongoose";
import Answer from '../models/Answers.js';

dotenv.config();

if(process.env.NODE_ENV!=='test'){
    async function connectMongoose() {
        try {
            await mongoose.connect(process.env.MONGO_ANSWERS_URI);
            console.log('Mongoose connected to MongoDB');
        } catch (error) {
            console.error('Error connecting Mongoose to MongoDB:', error);
            process.exit(1); 
        }
    }
    connectMongoose();
}else{
    console.log("Test environment, skipping mongodb connection")
}



export async function getAnswersDB(){
    try{
        const answers=await Answer.find();
        return answers;
    }catch(error){
        console.error("Error getching answers: ",error);
        throw error;
    }
}


export async function getAnswersOfFormDB(formIdParam){
    try{
        const answers=await Answer.find({formId: formIdParam});
        return answers;
    }catch(error){
        console.error(`Error getting answers of form ${formId}: ${error}`);
        throw error;
    }
}

export async function addUserAnswers(userId,formId,answers){
    try{
        
        const answersToInsert=answers.map(answer=>({
            userId,
            formId,
            questionId: answer.questionId,
            questionType: answer.questionType,
            required: answer.required,
            answer: answer.answer,
            answerImage: answer.answerImage || null,
        }));
        

        try{
            const newAnswers=await Answer.insertMany(answersToInsert);
            
            return{
                insertedCount: newAnswers.length,
                answers: newAnswers,
            };
        }catch(err){
            if(err.name==='ValidationError'){
                console.error('Validation error: ',err.message);
                throw new Error('Invalid data for answers');
            }else{
                console.error("ERROR");
                throw err;
            }
        }

    }catch(err){
        console.error('Error adding answers:',err);
        throw err;
    }
}



        
export async function getAnswersByFIDQID(formIdParam,questionIdParam){
    try{
        if (!formIdParam || typeof formIdParam !== 'string') {
            throw new Error('Invalid or missing formId');
        }
        
            if (typeof questionIdParam !== 'number') {
                questionIdParam = Number(questionIdParam);
                if (isNaN(questionIdParam)) {
                    throw new Error('Invalid questionId');
                }
            }
        const answers=await Answer.find({formId: formIdParam, questionId: questionIdParam}).exec();
        return answers;
    }catch(err){
        console.error('Answer database: Error getting answers by questionId');
        throw err;
    }
}

export async function getAnswersByUserId(formIdParam,userIdParam){
    try{
        if(!formIdParam || typeof formIdParam !=='string'){
            throw new Error('Invalid or missing field');
        }
        if(typeof userIdParam!=='number'){
            userIdParam=Number(userIdParam);
            if(isNaN(userIdParam)){
                throw new Error('Invalid userIdParam');
            }
        }
        
        const answers=await Answer.find({formId: formIdParam, userId: userIdParam});
        
        return answers;

    }catch(err){
        console.error('Answer database: Error getting answers by userId');
        throw err;
    }
}

export async function deleteAnswersDB(formIdParam) {
    try {
        const response = await Answer.deleteMany({ formId: formIdParam });
        return { success: true, message: `${response.deletedCount} answers of form ${formIdParam}` };
    } catch (error) {  
        console.error('Answer database: Error deleting answers by formId', error);
        throw error;  
    }
}


