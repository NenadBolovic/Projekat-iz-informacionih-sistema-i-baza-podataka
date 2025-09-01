import express from 'express';
//import cors from 'cors';
import {getForms,createForm,searchForms,
    updateForm,createGetFormById,deleteForm,getRelatedForms,
    getFormsForGuest} from '../controllers/formscontroller.js'; 
import {getFormByIdDB,addForm,addQuestions,deleteQuestionDB,updateFormDB,deleteFormDB,
    getRelatedFormsDB,getFormsForGuestDB,searchFormsDB,} from '../db/formsquestionsdatabase.js';
import axios from 'axios';
import { uploadMiddleware } from '../middlewares/uploadMiddleware.js';
import { deleteFile } from '../utils/deleteFile.js';


const router=express.Router();

const getFormById = createGetFormById({ axiosInstance:axios,getFormByIdDB }); //dodato



const createFormHandler = await createForm({
    axiosInstance: axios,
    addForm,
    addQuestions,
});

const updateFormHandler= await updateForm({
    axiosInstance: axios,
    getFormByIdDB,
    updateFormDB
});

const deleteFormHandler=await deleteForm({
    axiosInstance: axios,
    getFormByIdDB,
    deleteQuestionDB,
    deleteFormDB
})

const getRelatedFormsHandler= await getRelatedForms({
    axiosInstance: axios,
    getRelatedFormsDB
})

const getFormsForGuestHandler= await getFormsForGuest({
    getFormsForGuestDB
});

const searchFormsHandler= await searchForms({
    axiosInstance: axios,
    searchFormsDB
});


router.post(
    '/',
    uploadMiddleware, 
    async (req, res,next) => {
        try {
            
            req.body.formData = JSON.parse(req.body.formData);
            
            req.files = req.files || [];
            await createFormHandler(req, res,next); 
        } catch (error) {
            console.error('Error in POST /forms:', error);
            if(req.files || Array.isArray(req.files)){
                await Promise.all(
                    req.files.map(file=> deleteFile(file.path))
                );
            }
            res.status(500).json({ message: 'Internal Server Error', error });
        }
    }
);

router.get('/', getForms);
router.patch('/updateForm',updateFormHandler);
router.get('/forGuest',getFormsForGuestHandler);
router.get('/search', searchFormsHandler);
router.get('/related',getRelatedFormsHandler);
router.get('/:id',getFormById);
router.delete('/deleteForm',deleteFormHandler);

export default router;