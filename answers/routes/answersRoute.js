import express from 'express';
import { getAnswers,sendUsersAnswers,getAnswersOfForm,getAnswersByGroup,getAnswersByUser,exportQuestionsAndAnswers,deleteAnswers,deleteAnswersOfQuestion } from '../controllers/answercontroller.js';
import { addUserAnswers,deleteAnswersDB,getAnswersOfFormDB,getAnswersByUserId,getAnswersByFIDQID,deleteAnswersByQuestionDB} from '../db/answerdatabase.js';
import axios from 'axios';
import { uploadMiddleware } from '../middlewares/uploadMiddleware.js';
import { deleteFile } from '../utils/deleteFile.js';

const router=express.Router();

const getAnswersOfFormHandler= await getAnswersOfForm({
    axios: axios,
    getAnswersOfFormDB,
});

const addUserAnswersHandler=await sendUsersAnswers({
    axios: axios,
    addUserAnswers: addUserAnswers,
});

const deleteAnswersHandler=await deleteAnswers({
    axios:axios,
    getAnswersOfFormDB,
    deleteAnswersDB
});

const exportQuestionsAndAnswersHandler=await exportQuestionsAndAnswers({
    axios:axios,
    getAnswersOfFormDB
})

const getAnswersByUserHandler=await getAnswersByUser({
    axios:axios,
    getAnswersByUserId
})

const getAnswersByGroupHandler=await getAnswersByGroup({
    axios: axios,
    getAnswersByFIDQID
})

const deleteAnswersByQuestionHandler = await deleteAnswersOfQuestion({
    axios: axios,
    getAnswersByFIDQID,
    deleteAnswersByQuestionDB,
});



router.get("/", getAnswers);
router.get("/:formId", getAnswersOfFormHandler);
router.get("/getGroupedAnswers/:formId/:questionOrderId", getAnswersByGroupHandler);
router.get("/getUsersAnswers/:formId/:userAnswersId", getAnswersByUserHandler);
router.get("/export/:formId", exportQuestionsAndAnswersHandler);
router.delete("/delete", deleteAnswersHandler);
router.post("/deleteByQuestion", deleteAnswersByQuestionHandler); //dodato

router.post('/',uploadMiddleware,
    async(req,res,next)=>{
        try {
            if (req.body.answerData) {
                req.body.answerData = JSON.parse(req.body.answerData); 
            } else {
                return res.status(400).json({ message: 'No answerData provided' });
            }
            
            await addUserAnswersHandler(req,res,next);
        } catch (error) {
            console.error('Error in POST /answers:', error);
            if(req.files || Array.isArray(req.files)){
                await Promise.all(
                    req.files.map(file=> deleteFile(file.path))
                );
            }
            next(error);
        }
    }
)

export default router;