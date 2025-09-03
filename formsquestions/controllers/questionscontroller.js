import {deleteFile} from '../utils/deleteFile.js'
import dotenv from 'dotenv';
import {UnauthorizedError,ForbiddenError,BadRequestError,InternalServerError,NotFoundError} from '../errors.js'
import { getQuestionById } from '../db/formsquestionsdatabase.js';

const AUTH_SERVICE_URL=process.env.AUTH_SERVICE_URL;
const ANSWERS_SERVICE_URL=process.env.ANSWERS_SERVICE_URL;


export async function addQuestionsToForm({axiosInstance,getHighestQuestionIdByFormIdDB,addQuestions,getFormByIdDB}){
    return async(req,res,next) =>{
        try{
            const token = req.header('Authorization')?.replace('Bearer ', '');
            if (!token) {
                //return res.status(403).json({ success: false, message: 'Access denied, no token provided' });
                throw new UnauthorizedError('Access denied, no token provided');
            }
            const response = await axiosInstance.post(`${AUTH_SERVICE_URL}/validateToken`, {}, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if(!response.data.user || !response.data.user.userId){
                throw new UnauthorizedError('Invalid token.')
            }
            const userId = response.data.user.userId;
            const {formId,questions}=req.body.formData;
            if(!formId || !questions){
                
                throw new BadRequestError('FormId or questions are missing.');
            }
            const gotForm=await getFormByIdDB(formId);
            
            if(!gotForm){
                throw new NotFoundError('Form not found.');
            }
            const authId=gotForm.authId;
            const collaboratorsId=gotForm.collaborators;
            if(userId!=authId && !(collaboratorsId.includes(userId))){
                //return res.status(403).json({success: false, message: 'You do not have permission'});
                throw new ForbiddenError('You do not have permission');
            }
            const getOrderOfPreviousQuestion=await getHighestQuestionIdByFormIdDB(formId);
            let existingQuestionCount;
            if(getOrderOfPreviousQuestion==0){
                existingQuestionCount=0;
            }else{
                existingQuestionCount=getOrderOfPreviousQuestion+1;
            }
            //const existingQuestionCount=(await getHighestQuestionIdByFormIdDB(formId))+1;
            const questionsWithFormId = questions.map((q,index) => ({
                ...q, 
                formId,
            questionId: existingQuestionCount+index,
            }));

            if (req.files && req.files.length > 0) {
                req.files.forEach((file) => {
                    const { fieldname, path: filePath } = file;
            
                    if (fieldname.startsWith('questionImage-')) {
                        const questionIndex = parseInt(fieldname.split('-')[1], 10);
            
                        if (questionsWithFormId[questionIndex]) {
                            //questionsWithFormId[questionIndex].questionImage=filePath;
                            questionsWithFormId[questionIndex].questionImage=`/images/${file.filename}`;
                            console.log(`Atached image to questionId ${questionsWithFormId[questionIndex]}: ${filePath}`);
                        } else {
                            console.error(`No matching question found for questionImage`);
                        }
                    } 
                });
            }
            
            const newQuestions=await addQuestions(questionsWithFormId);
            const form=await getFormByIdDB(formId);

            if(!newQuestions || !form){
                throw new InternalServerError("Failed to add questions or get form.");
            }

            return res.status(201).json({
                success: true,
                message: "Questions successfully added.",
                data: form
            })
        
        }catch(err){
            console.error('Error adding new questions to form: ',err);
            next(err);
        }
    }
}


export async function updateQuestion({axiosInstance,getQuestionById,updateQuestionDB,getFormByIdDB}){
    return async (req,res,next) => {
        try{
            const token = req.header('Authorization')?.replace('Bearer ', '');
            if (!token) {
                
                throw new UnauthorizedError('Access denied, no token provided' );
            }
            const response = await axiosInstance.post(`${AUTH_SERVICE_URL}/validateToken`, {}, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if(!response.data.user || !response.data.user.userId){
                throw new UnauthorizedError('Invalid token.')
            }
            const userId = response.data.user.userId;
            const{questionId,updateData}=req.body.updateData;
            if (!updateData || !questionId) {
                throw new BadRequestError('Missing update data or questionId');
              }
            
            const question=await getQuestionById(questionId);
            if(!question){
                
                throw new NotFoundError('Question not found');
            }
            const formId=question.formId;
            const form=await getFormByIdDB(formId);
            const authId=form.authId;
            const collaboratorsId=form.collaborators;

            if(userId!=authId && !(collaboratorsId.includes(userId))){
                
                throw new ForbiddenError('You do not have permission');
            }
            if (req.files && req.files.length > 0) {
                req.files.forEach((file) => {
                    const { fieldname, path: filePath } = file;
            
                    if (fieldname.startsWith('questionImage')) {
                        //updateData.questionImage=filePath;
                        updateData.questionImage = `/images/${file.filename}`;
                    } 
                });
            }


            if(!updateData.questionImage && question.questionImage){
                    await deleteFile(question.questionImage);
                    updateData.questionImage=null;
                    question.questionImage=null;
            }


            if(question.questionImage && updateData.questionImage){
                await deleteFile(question.questionImage);
            }         

            const updatedQuestion=await updateQuestionDB(questionId,updateData);
            if(!updatedQuestion){
                throw new InternalServerError('Question is not updated');
            }
            res.status(200).json({
                success: true,
                message: 'Question updated successfully.',
                updatedQuestion
            });
            
        }catch(err){
            console.error('Eror updating questio: ', err);
            
            next(err);
        }
    }
}

export async function deleteQuestion({axiosInstance,getQuestionById,getFormByIdDB,deleteQuestionDB}){
    return async(req,res,next) =>{
        try{
            const token = req.header('Authorization')?.replace('Bearer ', '');
            if (!token) {
                //return res.status(403).json({ success: false, message: 'Access denied, no token provided' });
                throw new UnauthorizedError('Access denied, no token provided');
            }
            const response = await axiosInstance.post(`${AUTH_SERVICE_URL}/validateToken`, {}, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if(!response.data.user || !response.data.user.userId){
                throw new UnauthorizedError('Invalid token.')
            }
            const userId = response.data.user.userId;
            const questionId=req.body.questionId;
            if(!questionId){
                throw new BadRequestError('Question id is not provided.')
            }
            
            const question=await getQuestionById(questionId);
            if(!question){
                throw new NotFoundError('Question not found');
            }
            const formId=question.formId;
            
            const form=await getFormByIdDB(formId);
            const authId=form.authId;
            const collaboratorsId=form.collaborators;
            

            if(userId!=authId && !(collaboratorsId.includes(userId))){
                
                throw new ForbiddenError('You do not have permission');
            }

            if (question.questionImage) {
                await deleteFile(question.questionImage);
            }

            if (Array.isArray(question.options)) {
                for (const option of question.options) {
                    if (option.image) {
                        await deleteFile(option.image);
                    }
                }
            }

            const result=await deleteQuestionDB(questionId);
            
            if(!result || !result.deletedCount){
                throw new InternalServerError('Question is not deleted.')
            }

            await axiosInstance.post(`${ANSWERS_SERVICE_URL}/deleteByQuestion`, {
                formId: question.formId, 
                questionId: question.questionId 
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            return res.status(200).json({success: true, message: "Questions deleted",result:result});
        }catch(err){
            console.error("Error in deleting question ",err.message);
            
           next(err);
        }
    }
}

export async function moveQuestion({axiosInstance,moveQuestionUp,moveQuestionDown,getFormByIdDB}){
    return async(req,res,next)=>{
        try{
            const token = req.header('Authorization')?.replace('Bearer ', '');
            if (!token) {
                throw new UnauthorizedError('Access denied, no token provided');
            }
            const response = await axiosInstance.post(`${AUTH_SERVICE_URL}/validateToken`, {}, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if(!response.data.user || !response.data.user.userId){
                throw new UnauthorizedError('Invalid token.')
            }
            const userId = response.data.user.userId;
            const {formId,questionId,direction}=req.body;
            const form=await getFormByIdDB(formId);
            const authId=form.authId;
            const collaboratorsId=form.collaborators;
            if(userId!=authId && !(collaboratorsId.includes(userId))){
                throw new ForbiddenError('You do not have permission');
            }
            var response1
            if(direction==1){
                response1=await moveQuestionDown(formId,questionId);
            }
            if(direction==-1){
                response1=await moveQuestionUp(formId,questionId);
            }
            if(response1==0){
                return res.status(200).json({success: true,message:"Question can not be moved."});
            }
            res.status(200).json({success: true,message: "Questions moved"})
        }catch(error){
            console.error("Error in moving questions", error.message);
            return next(error);
        }
    }
}


export async function cloneQuestion({axios,getFormByIdDB,cloneQuestionDB,deleteQuestionDB}){
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
            };
            const userId = response.data.user.userId;
            const {formId,uniqQuestionId}=req.body;
            const form=await getFormByIdDB(formId);
            if(!form){
                throw new NotFoundError("Form is not found.")
            }
            
            const authId=form.authId;
            const collaboratorsId=form.collaborators;
            if(userId!=authId && !(collaboratorsId.includes(userId))){
                throw new ForbiddenError('You do not have permission');
            }
            const clonedQuestions= await cloneQuestionDB(formId,uniqQuestionId);
            
            if(!clonedQuestions){
                throw new InternalServerError("Error");
            }
            const {questionToClone,clone}=clonedQuestions;
            if((questionToClone.questionText!=clone.questionText) || (questionToClone.questionType!=clone.questionType)){
                await deleteQuestionDB(clone._id);
                throw new Error("Question is not cloned correctly.");
            }
            res.status(200).json({success: true,message: "Questions cloned",clonedQuestions: clonedQuestions})
        }catch(error){
            console.error("Error in cloning question ",error.message);
            next(error);
        }
    }
}