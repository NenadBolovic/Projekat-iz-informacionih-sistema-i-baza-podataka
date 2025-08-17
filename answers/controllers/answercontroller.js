import { getAnswersDB } from '../db/answerdatabase.js';
import { validateAnswers } from '../utils/validateAnswers.js';
import {deleteFile} from '../utils/deleteFile.js';
import { createExcelFile } from '../utils/createExcelFile.js';
import {UnauthorizedError, BadRequestError,ForbiddenError,InternalServerError } from '../errors.js';
import dotenv from 'dotenv';



const USERS_SERVICE_URL=process.env.USERS_SERVICE_URL;
const AUTH_SERVICE_URL=process.env.AUTH_SERVICE_URL;
const FORMS_SERVICE_URL=process.env.FORMS_SERVICE_URL;

export async function getAnswers(req,res,next){
    try{
        const answers=await getAnswersDB();
        return res.json(answers);
    }catch(err){
        next(err);
    }
}

export async function getAnswersOfForm({axios,getAnswersOfFormDB}) {
    return async (req,res,next) =>{
        try {
            const token = req.header('Authorization')?.replace('Bearer ', '');

            if (!token) {
                
                throw new UnauthorizedError('Access denied, no token provided');
            }
            const response = await axios.post(`${AUTH_SERVICE_URL}/validateToken`, {}, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if(!response.data.user || !response.data.user.userId){
                throw new UnauthorizedError('Invalid token.')
            }
            const userId = response.data.user.userId;
            const { formId } = req.params;
            if (!formId) {
                
                throw new BadRequestError('formId not provided');
            }
            const gotForm = await axios.get(`${FORMS_SERVICE_URL}/${formId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const authId=gotForm.data.form.authId;
            const collaboratorsId=gotForm.data.form.collaborators;
            const observersId=gotForm.data.form.observers;
            let answers;
            if (userId==authId || collaboratorsId.includes(userId) || observersId.includes(userId)) {
                answers = await getAnswersOfFormDB(formId);
                if(!answers){
                    throw new InternalServerError("DB error.")
                }
                console.log(answers);
                return res.status(200).json(answers);
            }
            
            else{
                throw new ForbiddenError('User is not authorized to view answers');
            }
        } catch (err) {
            console.error("Error getting answers of form:", err);
            next(err);
        }
    }
}


export async function getAnswersByGroup({axios,getAnswersByFIDQID}){
    return async(req,res,next)=>{
        try{
            const token = req.header('Authorization')?.replace('Bearer ', '');

            if (!token) {
                
                throw new UnauthorizedError('Access denied, no token provided');
            }

            const response = await axios.post(`${AUTH_SERVICE_URL}/validateToken`, {}, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if(!response.data.user || !response.data.user.userId){
                throw new UnauthorizedError('Invalid token.')
            }

            const userId = response.data.user.userId;

            const { formId, questionOrderId } = req.params;

            if (!formId || !questionOrderId) {
                
                throw new BadRequestError('formId not provided');
            }


            const gotForm = await axios.get(`${FORMS_SERVICE_URL}/${formId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const authId=gotForm.data.form.authId;
            const collaboratorsId=gotForm.data.form.collaborators;
            const observersId=gotForm.data.form.observers;

            if (userId === authId || collaboratorsId.includes(userId) || observersId.includes(userId)) {
                try {
                    const answers = await getAnswersByFIDQID(formId, questionOrderId);
                    return res.status(200).json(answers);
                } catch (err) {
                    console.error("Database error in getAnswersByGroup:", err);
                    next(err instanceof Error ? err : new InternalServerError('Database error occurred'));
                    return;
                }
            }

            
            throw new ForbiddenError('User is not authorized to view answers');
        }catch(err){
            console.error("ANSWER CONTROLLER:Error gettin grouped answers");
            next(err);
        }
    }
}

export async function getAnswersByUser({axios,getAnswersByUserId}){
    return async(req,res,next)=>{
        try{
            const token = req.header('Authorization')?.replace('Bearer ', '');
            if (!token) {
                
                throw new UnauthorizedError('Access denied, no token provided');
            }
            const response = await axios.post(`${AUTH_SERVICE_URL}/validateToken`, {}, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if(!response.data.user || !response.data.user.userId){
                throw new UnauthorizedError('Invalid token.')
            }
            const userId = response.data.user.userId;
            const { formId, userAnswersId } = req.params;
            if (!formId || !userAnswersId) {
                
                throw new BadRequestError('formId or userAnswersId not provided');
            }
            const gotForm = await axios.get(`${FORMS_SERVICE_URL}/${formId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const authId=gotForm.data.form.authId;
            const collaboratorsId=gotForm.data.form.collaborators;
            const observersId=gotForm.data.form.observers;

            if(userId==authId || collaboratorsId.includes(userId) || observersId.includes(userId)){
                try{
                    const answers=await getAnswersByUserId(formId,userAnswersId);
                    return res.status(200).json(answers);
                }catch(error){
                    console.error("Error getAnswersByUser: ",error);
                    next(error instanceof Error ? error : new InternalServerError("Database error occured"));
                    return;
                }
            }
            
            throw new ForbiddenError('User is not authorized to view answers');
        }catch(err){
            console.error("ANSWER CONTROLLER: errror getting answers of user");
            next(err);
        }
    }
}

export async function sendUsersAnswers({axios,addUserAnswers}) {
    return async (req,res,next) =>{
        try {
            const { formId, answers } = req.body.answerData;
            const token = req.header('Authorization')?.replace('Bearer ', '');
            const axiosConfig = token ? {
                headers: { Authorization: `Bearer ${token}` }
            } : {};
            const form = await axios.get(`${FORMS_SERVICE_URL}/${formId}`, axiosConfig);
            if(!form){
                throw new UnauthorizedError("Acces denied.")
            }
            const indicator = form.data.form.indicator;
            if(indicator===null){
                throw new BadRequestError("Form does not exist.");
            }
            if(form.data.form.locked===1){
                throw new ForbiddenError("Form is locked");
            }
            answers.forEach(ans => {
                if (ans.questionType === 'date' && typeof ans.answer === 'string') {
                    const parsed = new Date(ans.answer);
                    if (!isNaN(parsed)) {
                        ans.answer = parsed;
                    }
                }
            });
            let authId = 0;
            if (token) {
                try {
                    const response = await axios.post(`${AUTH_SERVICE_URL}/validateToken`, {}, {
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    authId = response.data?.user?.userId || 0;  
                    
                } catch (err) {
                    console.warn("Token validation failed:", err.response?.data?.message || err.message);
                    authId = 0; 
                }
            }
            

            if(indicator==1 && authId==0){
                throw new ForbiddenError('Access denied, authentication required.')
            }

            const questions=form.data.form.questions;

            const questionsTypes=questions.map(question=>{
                return question.questionType;
            });
            const questionsRequired=questions.map(question=>{
                return question.required;
            });
            
            if(authId!=0 || indicator===0){
                console.log(req.files);
                if (req.files && req.files.length > 0) {
                    req.files.forEach((file) => {
                        const { fieldname, path: filePath } = file;
                        if (fieldname.startsWith('questionImage-')) {
                            const questionId = parseInt(fieldname.split('-')[1], 10);
                            const answer = answers.find((a) => a.questionId === questionId);
                            if (answer) {
                                answer.answerImage = filePath; 
                                console.log(`Atached image to questionId ${questionId}:`, filePath);
                            } else {
                                console.warn(`No answer found for  qID ${questionId}`);
                            }
                        } else {
                            console.warn(`Unexpected file fieldname: ${fieldname}`);
                        }
                    });
                }
                const answersTransformed=answers.map((answer,index)=>({
                    ...answer,
                    questionType: questionsTypes[index],
                    required: questionsRequired[index],
                }));
                
                const isValid = validateAnswers(answers);
                
                if (isValid === 0) {
                    console.error('Validation failed for some answers');
                    throw new Error('Invalid answer format');
                }
                const newAnswers = await addUserAnswers(authId, formId, answersTransformed);
                return res.status(201).json(newAnswers);
            }

        } catch (err) {
            console.error('Error creating answers:', err);
            next(err);
        }
    }
}



export async function exportQuestionsAndAnswers({axios,getAnswersOfFormDB}){
    return async(req,res)=>{
        try{
            const token = req.header('Authorization')?.replace('Bearer ', '');

            if (!token) {
                return res.status(403).json({ success: false, message: 'Access denied, no token provided' });
            }

            const response = await axios.post(`${AUTH_SERVICE_URL}/validateToken`, {}, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const userId = response.data.user.userId;
            
            const { formId } = req.params;
            
            if (!formId) {
                return res.status(400).json({ message: 'formId not provided' });
            }

            const gotForm = await axios.get(`${FORMS_SERVICE_URL}/${formId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            
            const authId=gotForm.data.form.authId;
            
            const collaboratorsId=gotForm.data.form.collaborators;
            
            const observersId=gotForm.data.form.observers;
            
            if(userId==authId || collaboratorsId.includes(userId) || observersId.includes(userId)){
                
                const form=gotForm.data.form;
                const answers=await getAnswersOfFormDB(formId);
                
                const userIds = [...new Set(answers.map(answer => answer.userId).filter(id => id !== 0))];
                
                try {
                    const usernames = await Promise.all(
                        userIds.map(async (userId) => {
                            const response = await axios.get(`${USERS_SERVICE_URL}/${userId}`);
                            
                            return { userId, username: response.data.username };
                        })
                    );

                    const questions=form.questions;
                    
                
                    const answersWithUsernames = answers.map(a => {
                        const user = usernames.find(u => u.userId === a.userId);
                        const question= questions.find(q=> q.questionId===a.questionId);
                        const questionText=question.questionText;
                        const {userId,formId,questionId,answer,answerImage,id}=a;
                        return {
                            username: user ? user.username : "Nepoznati",
                            questionText,
                            answer,
                        };
                    });
                    const downloadPath=createExcelFile(formId,answersWithUsernames);

                    res.download(downloadPath, `answers${formId}.xlsx`, (err) => {
                        if (err) {
                            console.error('Error downloading ', err);
                            res.status(500).send('Error downloading file');
                        } else {
                            console.log("success");
                        }
                    });
                } catch (error) {
                    console.error("SOMETHING WENT WRONG:", error);
                    res.status(500).json({message: 'Error retrieving usedname', error: error.message});
                }
                
                
            }

            
        }catch(err){
            console.error('Error exporting answers ',err.message);
            res.status(500).json({message: 'Error exporting answers ', error:err.message})
        }
    }
}


export async function deleteAnswers({axios,getAnswersOfFormDB,deleteAnswersDB}){
    return async(req,res,next)=>{
        try{
            const token = req.header('Authorization')?.replace('Bearer ', '');
            if (!token) {
                throw new UnauthorizedError('Access denied, no token provided');
            }
            const responseAxios = await axios.post(`${AUTH_SERVICE_URL}/validateToken`, {}, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if(!responseAxios.data.user || !responseAxios.data.user.userId){
                throw new UnauthorizedError('Invalid token.')
            }
            const userId = responseAxios.data.user.userId;
            const {formId}=req.body;
            if (!formId) {
                throw new BadRequestError('formId or userAnswersId not provided');
            }
            const gotForm = await axios.get(`${FORMS_SERVICE_URL}/${formId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const authId=gotForm.data.form.authId;
            const collaboratorsId=gotForm.data.form.collaborators;
            const observersId=gotForm.data.form.observers;

            if(userId==authId || collaboratorsId.includes(userId) || observersId.includes(userId)){
                const answers=await getAnswersOfFormDB(formId);
                

                for(const answer of answers){
                    if(answer.answerImage){
                        await deleteFile(answer.answerImage);
                    }
                }
                const response=await deleteAnswersDB(formId);
                
                res.status(200).json({success:true,message: 'Answers deleted'});
            }else{
                throw new ForbiddenError('User do not have permission.')
            }

        }catch(error){
            console.error('Error deleting answers');
            next(error);
        }
    }
}


