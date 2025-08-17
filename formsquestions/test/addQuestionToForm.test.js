import {expect} from 'chai';
import sinon from 'sinon';
import {addQuestionsToForm} from '../controllers/questionscontroller.js';
import {UnauthorizedError,ForbiddenError,BadRequestError,InternalServerError,NotFoundError} from '../errors.js'

describe('addQuestions',()=>{
    let req,res,next;
    let mockAxios,mockGetHighestQuestionIdByFormId,mockAddQuestions,mockGetFormByIdDB,addQuestionToFormTest;

    beforeEach(async ()=>{
        req={
            header: sinon.stub(),
            body:{
                "formData": {
                    "formId": "67b4ea4b9a23259515e004f6",
                    "questions": [
                        {
                            "questionText": "Pitanje za LALALAND?",
                            "questionType": "short-text",
                            "options": []
                        },
                        {
                            "questionText": "RATATATATAiljene boje?",
                            "questionType": "multiple-choice-single",
                            "options": [
                                {"text": "Red"},
                                {"text": "Blue"},
                                {"text": "Magenta"}
                            ]
                        }
                    ]
                }
            }
        }
        res = {status: sinon.stub().returnsThis(),
                json: sinon.stub(),
                send: sinon.stub(), 
        };
        next=sinon.stub();
        mockAxios={post:sinon.stub(),get:sinon.stub()};
        mockGetHighestQuestionIdByFormId=sinon.stub();
        mockAddQuestions=sinon.stub();
        mockGetFormByIdDB=sinon.stub();
        addQuestionToFormTest=await addQuestionsToForm({axiosInstance:mockAxios,getHighestQuestionIdByFormIdDB:mockGetHighestQuestionIdByFormId,
            addQuestions:mockAddQuestions,getFormByIdDB:mockGetFormByIdDB});
    });

    afterEach(()=>{
        sinon.restore();
    })

    it('No token return Unauthorized error',async()=>{
        req.header.returns(null);
        await addQuestionToFormTest(req, res,next);
        expect(next.firstCall.args[0]).to.be.instanceof(UnauthorizedError);
    });

    it('user with invalid token, unauthorized error', async()=>{
        req.header.returns('validToken');
        mockAxios.post.resolves({data:{}});
        await addQuestionToFormTest(req,res,next);
        expect(next.firstCall.args[0]).to.be.instanceOf(UnauthorizedError);
    });

    it('formData is missing, bad request error', async()=>{
        req.header.returns('validToken');
        mockAxios.post.resolves({data: {user:{userId:1}}});
        req.body.formData={};
        await addQuestionToFormTest(req,res,next);
        expect(next.firstCall.args[0]).to.be.instanceOf(BadRequestError);
    });

    it('Form not found, not found error', async()=>{
        req.header.returns('validToken');
        mockAxios.post.resolves({data: {user:{userId:1}}});
        mockGetFormByIdDB.resolves(null);
        await addQuestionToFormTest(req,res,next);
        expect(next.firstCall.args[0]).to.be.instanceOf(NotFoundError);
    });

    it('User is not owner neither collaborator, forbidden error', async()=>{
        req.header.returns('validToken');
        mockAxios.post.resolves({data: {user:{userId:5}}});
        mockGetFormByIdDB.resolves({formId: 1234, authId: 1, collaborators: [2,3,4]});
        await addQuestionToFormTest(req,res,next);
        expect(next.firstCall.args[0]).to.be.instanceOf(ForbiddenError);
    })

    it('Successfully adds questions',async()=>{
        req.header.returns('validToken');
        mockAxios.post.resolves({data: {user:{userId:5}}});
        mockGetFormByIdDB.resolves({formId: 1234, authId: 5, collaborators: [2,3,4]});
        mockGetHighestQuestionIdByFormId.resolves(2);
        mockAddQuestions.resolves(
            [{questionText: 'Question3',questionType: 'shirt-text'},
             {questionText: 'Question4',questionType:'long-text'}
            ]
        );
        mockGetFormByIdDB.resolves({formId: 1234, authId: 5, collaborators: [2,3,4],
            questions: [{questionText: 'Question3',questionType: 'shirt-text'},
                {questionText: 'Question4',questionType:'long-text'}
               ]
        });
        await addQuestionToFormTest(req,res,next);
        expect(res.status.calledWith(201)).to.be.true;
    });

    it('failed to add new questions',async()=>{
        req.header.returns('validToken');
        mockAxios.post.resolves({data: {user:{userId:5}}});
        mockGetFormByIdDB.resolves({formId: 1234, authId: 5, collaborators: [2,3,4]});
        mockGetHighestQuestionIdByFormId.resolves(2);
        mockAddQuestions.resolves(null);
        await addQuestionToFormTest(req,res,next);
        expect(next.firstCall.args[0]).to.be.instanceOf(InternalServerError);
    })

    

})