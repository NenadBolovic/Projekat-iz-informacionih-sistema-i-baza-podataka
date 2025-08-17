import { MongoClient, ObjectId } from "mongodb";
import dotenv from 'dotenv';
import Form from '../models/Forms.js';
import Question from '../models/Questions.js';
import mongoose from 'mongoose';

dotenv.config();



if(process.env.NODE_ENV!=='test'){
    async function connectMongoose() {
        try {
            await mongoose.connect(process.env.MONGO_FORMQUESTIONS_URI);
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

export async function getFormByIdDB(formIdParam) {
    try {
        const form = await Form.findById(formIdParam);

        if (!form) {
            throw new Error(`Form with ID ${formIdParam} not found`);
        }
        const formsQuestions = await Question.find({ formId: formIdParam })
            .sort({ questionId: 1 }) 
            .exec(); 
        
        const formWithQuestions = {
            ...form.toObject(), 
            questions: formsQuestions,
        };
        
        return formWithQuestions;
    } catch (error) {
        console.error("Error fetching form with questions:", error);
        throw error;
    }
}

export async function getQuestionById(questionIdParam){
    try{
        
        const question=await Question.findById(questionIdParam);
        if (!question) {
            throw new Error('Question not found');
        }
        return question;
    }catch(error){
        console.error("Error geting question: ",error);
        throw error;
    }
}

export async function addForm(name, description, indicator,locked, authId,collaborators,observers) {
    try {
        const form=new Form({name,description,indicator,locked,authId,collaborators,observers});
        const savedForm=await form.save();
        return await getFormByIdDB(savedForm._id); 
    } catch (err) {
        console.error("Error creating form:", err);
        throw err;  
    }
}

export async function addQuestions(questionsWithFormId) {
    try {
        
        const questionsWithObjectId=questionsWithFormId.map((question)=>({
            ...question,
            formId: question.formId,
        }));
        
        const insertedQuestions = await Question.insertMany(questionsWithObjectId);

        return {
            insertedCount: insertedQuestions.length,
            insertedQuestions,
        };
    } catch (err) {
        console.error("Error adding questions in form:", err);
        throw err;
    }
}

export async function searchFormsDB(searchString){
    try{
        const forms = await Form.find({
            name: { $regex: searchString, $options: 'i' }
        });
        
        return forms;
    }catch(err){
        console.error("Error searching form: ", err);
        throw err;
    }
}


export async function updateQuestionDB(questionId, updateData) {
    try {
        const currentQuestion= await Question.findById(questionId);
        const updatedData={...updateData};
        
        Object.keys(currentQuestion.toObject()).forEach((key)=>{
            if(!updateData.hasOwnProperty(key)){
                updatedData[key]=null;
            }
        });
        const updatedDataWithFormId={
            ...updatedData,
            formId: currentQuestion.formId,
            questionId: currentQuestion.questionId,
            required: updatedData.required==null? currentQuestion.required : updateData.required,
        }
        delete updatedDataWithFormId._id;
        const result = await Question.findOneAndUpdate(
            { _id: new ObjectId(questionId) },
            { $set: updatedDataWithFormId },
            { new: true }
        );
        
        if (!result) {
            throw new Error('Question not found or update failed.');
        }
        return result;
    } catch (err) {
        console.error('Error updating question: ', err);
        throw err;
    }
}

export async function updateFormDB(formId,updateData){
    try{
        const updatedForm=await Form.findOneAndUpdate({_id: new ObjectId(formId)},
            {$set: updateData},
            {returnDocument: 'after'});
        
        if (!updatedForm) {
            throw new Error('Form not found or update failed.');
        }
        return updatedForm;
    }catch(err){
        console.error('Error locking form: ',err);
        throw err;
    }
}


export async function deleteQuestionDB(questionIdParam){
    try{
        
        const result= await Question.deleteOne({_id: questionIdParam});
        return result;
    }catch(error){
        console.error("Error deleting questions: ",error);
        throw error;
    }
}

export async function deleteFormDB(formId){
    try{
        const response = await Form.deleteOne({ _id: formId });
        if(response.deletedCount===1){
            console.log(`Obrisna forma ${formId}`);
            return {success: true, message: 'Form deleted'}
        }else{
            console.warn(`nIje obrisana forma ${formId}`);
            return {success:false,message: 'Form not deleted'}
        }
    }catch(error){
        console.error("FQDB error deleting form ",error);
        throw error;
    }
}


export async function getHighestQuestionIdByFormIdDB(formIdParam){
    try{
        const highestQuestion=await Question.find({formId: formIdParam})
            .sort({questionId: -1})
            .limit(1)
            .exec();
        return highestQuestion.length > 0 ? highestQuestion[0].questionId : 0;
    }catch(err){
        console.error("Error fetching the highest questionId: ", err);
        throw err;
    }
}


export async function getRelatedFormsDB(userIdParam){
    try{
        const userId=parseInt(userIdParam);
        
        const relatedForms=await Form.find({$or:
            [{authId: userId},
                {collaborators: {$in:[userId]}},
                {observers: {$in:[userId]}},
            ]
        }).exec();
        
        return relatedForms;
    }catch(error){
        console.error("FQDB error getting related forms: ",error);
        throw error;
    }
}

export async function getFormsForGuestDB(){
    try{
        const response=await Form.find({indicator: 0, locked: 0}).exec();
        
        return response;
    }catch(error){
        console.error("Error getting forms for user");
        throw error;
    }
}

export async function cloneQuestionDB(formIdParam,uniqIdParam){
    try{
        const questionToClone=await Question.findOne({_id: uniqIdParam});
        const questionToCloneOrderId=questionToClone.questionId;
        const clonedQuestion = questionToClone.toObject();
        delete clonedQuestion._id;
        delete clonedQuestion.questionImage;
        delete clonedQuestion.createdAt;
        delete clonedQuestion.updatedAt;
        clonedQuestion.questionId = questionToCloneOrderId + 1;
        const updateQuestionsBelow=await Question.updateMany(
            {formId: formIdParam,questionId: {$gt: questionToCloneOrderId}},
            {$inc: {questionId: 1}}
        );
        const clone=await Question.create(clonedQuestion);
        return {
            questionToClone: questionToClone,
            clone: clone
        };
    }catch(error){
        console.error("Error cloning questions.");
        throw error;
    }
}


export async function moveQuestionUp(formIdParam,questionId){
    try{
        
        const currentQuestion=await Question.findOne({
            formId: formIdParam,
            questionId: questionId,
        });

        if(!currentQuestion){
            throw new Error("Question not found.");
        }

        const questionAbove=await Question
            .findOne({
                formId: formIdParam,
                questionId: {$lt: questionId},
            })
            .sort({questionId: -1})
            .exec();
        if(!questionAbove){
            console.log("Question is on top.");
            return 0;
        }
        
        const currentQuestionId=currentQuestion.questionId;
        const aboveQuestionId= questionAbove.questionId;

        currentQuestion.questionId=aboveQuestionId;
        questionAbove.questionId=currentQuestionId;

        await currentQuestion.save();
        await questionAbove.save();

        console.log("Moved up succesfully.");
        return 1;
    
    }catch(error){
        console.error("Error moving question up.",error);
        throw error;
    }
}


export async function moveQuestionDown(formIdParam,questionId){
    try{
        
        const currentQuestion=await Question.findOne({
            formId: formIdParam,
            questionId: questionId,
        });

        if(!currentQuestion){
            throw new Error("Question not found.");
        }

        const questionBelow=await Question
            .findOne({
                formId: formIdParam,
                questionId: {$gt: questionId},
            })
            .sort({questionId: 1})
            .exec();
        if(!questionBelow){
            console.log("Question is below.");
            return 0;
        }
        const currentId=currentQuestion.questionId;
        const belowId=questionBelow.questionId;

        currentQuestion.questionId=belowId;
        questionBelow.questionId=currentId;

        await currentQuestion.save();
        await questionBelow.save();

        console.log("Moved down succesfully.")
        return 1;
    
    }catch(error){
        console.error("Error moving question up.",error);
        throw error;
    }
}



