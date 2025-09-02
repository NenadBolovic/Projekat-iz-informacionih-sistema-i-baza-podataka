import dotenv from 'dotenv';
import {deleteFile} from '../utils/deleteFile.js';
import {UnauthorizedError,ForbiddenError,BadRequestError,InternalServerError,NotFoundError} from '../errors.js'



const AUTH_SERVICE_URL=process.env.AUTH_SERVICE_URL;
const ANSWERS_SERVICE_URL=process.env.ANSWERS_SERVICE_URL;


export async function getForms(req, res) {
    try {
        const forms = await getFormsDB();
        res.json(forms);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching forms', error: err });
    }
}


export async function createForm({ axiosInstance, addForm, addQuestions }) {
    return async (req, res,next) => {
        try {
            
            const token = req.header('Authorization')?.replace('Bearer ', '');
            if (!token) {
                
                throw new UnauthorizedError('Access denied, no token provided');
            }
            //'http://authentication:3003/validateToken'
            const response = await axiosInstance.post(`${AUTH_SERVICE_URL}/validateToken`, {}, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if(!response.data.user || !response.data.user.userId){
                throw new UnauthorizedError('Invalid token.')
            }
            const authId = response.data.user.userId;
            if (!req.body.formData) {
                throw new BadRequestError('Missing form data');
            }
            const { name, description, indicator,locked, collaborators, observers, questions } = req.body.formData;
            
            if (!name || !description) {
                throw new BadRequestError('Form name and description are required');
            }

            if (indicator === undefined || locked === undefined) {
                throw new BadRequestError('Indicator and locked fields are required');
            }

            if (!Array.isArray(collaborators) || !Array.isArray(observers) || !Array.isArray(questions)) {
                throw new BadRequestError('Collaborators, observers and questions must be arrays');
            }

            const newForm = await addForm(name, description, indicator,locked, authId, collaborators, observers);
            if (!newForm || !newForm._id) {
                throw new InternalServerError('Failed to create form');
            }
            const formId = newForm._id;

            
            const existingQuestionCount=0;
            if (questions.length > 0) {
                const questionsWithFormId = questions.map((q, index) => ({
                    ...q,
                    formId,
                    questionId: existingQuestionCount + index,
                }));
            
                if (req.files && req.files.length > 0) {
                    req.files.forEach((file) => {
                        const { fieldname, path: filePath } = file;
            
                        if (fieldname.startsWith('questionImage-')) {
                            const questionIndex = parseInt(fieldname.split('-')[1], 10);
            
                            if (questionsWithFormId[questionIndex]) {
                                //questionsWithFormId[questionIndex].questionImage = filePath;
                                questionsWithFormId[questionIndex].questionImage = `/images/${file.filename}`;
                            }
                        } 
                    });
                }
            
                const newQuestions = await addQuestions(questionsWithFormId);
                if (!newQuestions) {
                    throw new InternalServerError('Failed to insert questions');
                }
            
                res.status(201).json({
                    success: true,
                    form: {
                        ...newForm,
                        questions: newQuestions,
                    },
                });
            } else {
                res.status(201).json({
                    success: true,
                    form: newForm,
                });
            }

            
        } catch (err) {
            console.error('Error creating form:', err);
            next(err);
        }
    };
}


export async function updateForm({axiosInstance,getFormByIdDB,updateFormDB}){
    return async(req,res,next) =>{
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
            const {formId,name,description,indicator,locked,collaborators,observers}=req.body;

            if(!formId || !name ){
                
                throw new BadRequestError("FormId and name not given.")
            }

            if (indicator === undefined || locked === undefined) {
                throw new BadRequestError('Indicator and locked fields are required');
            }

            if (!Array.isArray(collaborators) || !Array.isArray(observers)) {
                throw new BadRequestError('Collaborators, observers must be arrays');
            }

            const form=await getFormByIdDB(formId);
            if(!form){
                
                throw new InternalServerError('Form not found.');
            }
            const authId=form.authId;
            const collaboratorsId=form.collaborators;
            
            if(userId!=authId && !(collaboratorsId.includes(userId))){
                //return res.status(403).json({success: false, message: 'You do not have permission'});
                throw new ForbiddenError('You do not have permission');
            }
            const updateData={};
            if(name) updateData.name=name;
            if(description) updateData.description=description;
            if(indicator!==undefined) updateData.indicator=indicator;
            if(locked!==undefined) updateData.locked=locked;
            if(collaborators!==undefined) updateData.collaborators=collaborators;
            if(observers!==undefined) updateData.observers=observers;
            const updatedForm=await updateFormDB(formId,updateData);
            return res.status(200).json({success: true,form: updatedForm});
        }catch(err){
            console.error('Error updating form: ', err);
            next(err);
        }
    }
}

export async function searchForms({axiosInstance,searchFormsDB}) {
    return async(req,res,next)=>{
        try {
            
            const token = req.header('Authorization')?.replace('Bearer ', '');
            let userId=null;
            if(token){
                const response = await axiosInstance.post(`${AUTH_SERVICE_URL}/validateToken`, {}, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (response?.data?.user?.userId) {
                        userId = response.data.user.userId;
                } 
            }
            const searchString = req.query.q.trim();
            
            if (!searchString || typeof searchString !== 'string') {
                //return res.status(400).json({ success: false, message: 'Invalid or missing search string' });
                throw new BadRequestError('Invalid or missing search string');
            }
            const forms = await searchFormsDB(searchString,userId);
            return res.status(200).json({ success: true, forms: forms }); 
        } catch (err) {
            console.error('Error searching form:', err);
            
            next(err);
        }
    }
}

export function createGetFormById({ axiosInstance,getFormByIdDB }) {
    return async (req, res, next) => {
        try {
            const form = await getFormByIdDB(req.params.id); 
            if (!form) {
                throw new NotFoundError('Form is not found.');
            }
            const token = req.header('Authorization')?.replace('Bearer ', '');
            
            if (!token) {
                if(form.indicator===1){
                    throw new UnauthorizedError('Access denied, no token provided');
                }
                if(form.locked===1){
                    throw new ForbiddenError("Form is locked");
                }
                return res.status(200).json({ success: true, form });
            }
            else if(token){
                const response = await axiosInstance.post(`${AUTH_SERVICE_URL}/validateToken`, {}, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if(!response.data.user || !response.data.user.userId){
                    throw new UnauthorizedError('Invalid token.')
                }
                const userId=response.data.user.userId;
                if(form.locked===1){
                    if(form.authId===userId || form.collaborators.includes(userId)){
                        return res.status(200).json({ success: true, form });
                    }
                    throw new ForbiddenError("Form is locked");
                }
                else{
                    return res.status(200).json({ success: true, form });
                }
            }
        } catch (error) {
            console.error("ERROR GETTING FORM")
            next(error);
        }
    };
}

export async function getRelatedForms({axiosInstance, getRelatedFormsDB}){
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
                throw new UnauthorizedError('Invalid token')
            }
            const userId = response.data.user.userId;
            
            let relatedForms;
            try{
                relatedForms=await getRelatedFormsDB(userId);
                
            }catch(error){
                throw new InternalServerError('Database error.')
            }
            if(!relatedForms){
                throw new NotFoundError('Related forms not found');
            }
            return res.status(200).json({success:true,forms: relatedForms})
        }catch(err){
            console.error("Error in deleting question ",err.message);
            next(err);
        }
    }
}

export async function deleteForm({axiosInstance,getFormByIdDB,deleteQuestionDB,deleteFormDB}){
    return async(req,res,next)=>{
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
            const formId=req.body.formId;
            if(!formId){
                throw new BadRequestError('FormId not provided');
            }
            
            const form=await getFormByIdDB(formId);
            if(!form){
                throw new NotFoundError('Form not found.');
            }
            
    
            const authId=form.authId;
            const collaboratorsId=form.collaborators;
            if(!authId || !collaboratorsId){
                throw new InternalServerError('AuthId and collaborators missing.');
            }
            

            if(userId!=authId &&  !(!Array.isArray(collaboratorsId) && collaboratorsId.includes(userId))){
                
                throw new ForbiddenError('User is neither author or collaborator.')
                //return res.status(403).json({success: false, message: 'You do not have permission'});
            }

            const questions=form.questions;
            
            for(const question of questions){
                if(question.questionImage){
                    await deleteFile(question.questionImage);
                }
                if(Array.isArray(question.options)){
                    for(const option of question.options){
                        if(option.image){
                            await deleteFile(option.image);
                        }
                    }
                }
                await deleteQuestionDB(question._id);
            }

            try {
                const deleteAnswers = await axiosInstance.delete(`${ANSWERS_SERVICE_URL}/delete`, {
                    headers: { Authorization: `Bearer ${token}` },
                    data: { formId }, 
                });
                console.log('Delete answers response:', deleteAnswers.data);
            } catch (error) {
                
                throw new InternalServerError('Answers not deleted.');
                
            }

            const result=await deleteFormDB(formId);
            
            if(!result || result.deletedCount===0){
                throw new InternalServerError('Form not deleted')
                
            }

            return res.status(200).json({success: true, message:"Form and questions deleted."});

        }catch(error){
            console.error("Error in deleteng form ",error.message);
            next(error);
            
        }
    }
}

export async function getFormsForGuest({getFormsForGuestDB}){
    return async(req,res,next)=>{
        try{
            const response=await getFormsForGuestDB();
            return res.status(200).json({success: true, forms: response});
        }catch(error){
            next(error);
        }
    }
}



