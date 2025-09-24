import express from 'express';
import {deleteQuestion, addQuestionsToForm,updateQuestion} from '../controllers/questionscontroller.js';
import { moveQuestion,cloneQuestion} from '../controllers/questionscontroller.js';
import { getFormByIdDB, addQuestions,getHighestQuestionIdByFormIdDB,getQuestionById,updateQuestionDB,deleteQuestionDB} from '../db/formsquestionsdatabase.js';//dodato
import { moveQuestionDown,moveQuestionUp,cloneQuestionDB} from '../db/formsquestionsdatabase.js';
import axios from 'axios';
import { uploadMiddleware } from '../middlewares/uploadMiddleware.js';
import { deleteFile } from '../utils/deleteFile.js';

const router=express.Router();

const addQuestionsHandler= addQuestionsToForm({
    axiosInstance: axios,
    getHighestQuestionIdByFormIdDB,
    addQuestions,
    getFormByIdDB,
});

const updateQuestionHandler= updateQuestion({
    axiosInstance: axios,
    getQuestionById,
    updateQuestionDB,
    getFormByIdDB
    });

const deleteQuestionHandler= deleteQuestion({
    axiosInstance: axios,
    getQuestionById,
    getFormByIdDB,
    deleteQuestionDB
});

const moveQuestionHandler= moveQuestion({
    axiosInstance: axios,
    moveQuestionUp,
    moveQuestionDown,
    getFormByIdDB
});

const cloneQuestionHandler= cloneQuestion({
    axios,
    getFormByIdDB,
    cloneQuestionDB,
    deleteQuestionDB
})

router.post('/cloneQuestion',cloneQuestionHandler);

router.post('/addQuestions', uploadMiddleware, async (req,res,next) => {
    try{
        req.body.formData=JSON.parse(req.body.formData);
        await addQuestionsHandler(req,res,next);
    }catch(error){
        console.error('Error in POST /forms/addQuestions: ',error);
        if(req.files || Array.isArray(req.files)){
            await Promise.all(
                req.files.map(file=> deleteFile(file.path))
            );
        }
        
        next(error);
    }
});



router.patch('/updateQuestion', uploadMiddleware, async(req,res,next)=>{
    try{
        req.body.updateData=JSON.parse(req.body.updateData);
        await updateQuestionHandler(req,res,next);
    }catch(error){
        console.error("APP: Error in updating question",error);
        if(req.files || Array.isArray(req.files)){
            await Promise.all(
                req.files.map(file=> deleteFile(file.path))
            );
        }
        
        next(error);
    }
});


router.patch('/move',moveQuestionHandler);
router.delete('/deleteQuestion',deleteQuestionHandler);

export default router;