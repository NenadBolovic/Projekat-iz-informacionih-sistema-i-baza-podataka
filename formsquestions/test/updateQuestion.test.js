import {expect} from 'chai';
import sinon from 'sinon';
import {updateQuestion} from '../controllers/questionscontroller.js';
import {UnauthorizedError,ForbiddenError,BadRequestError,InternalServerError,NotFoundError} from '../errors.js'

describe('updateQuestion',()=>{
    let req,res,next;
    let mockAxios,mockGetQuestionById,mockUpdateQuestionDB,mockGetFormByIdDB,updateQuestionTest;

    beforeEach(async ()=>{
        req={
            header: sinon.stub(),
            body:{
                updateData:{
                    "questionId": "67b4ea4b9a23259515e004fa",
                    "updateData": {
                        "questionText": "Who is teacher?",
                        "questionType": "short-text"
                    }
                }
            }
        }
        res = {status: sinon.stub().returnsThis(),
                json: sinon.stub(),
                send: sinon.stub(), 
        };
        next=sinon.stub();
        mockAxios={post:sinon.stub(),get:sinon.stub()};
        mockGetQuestionById=sinon.stub();
        mockUpdateQuestionDB=sinon.stub();
        mockGetFormByIdDB=sinon.stub();
        updateQuestionTest=await updateQuestion({axiosInstance:mockAxios,getQuestionById:mockGetQuestionById,
            updateQuestionDB:mockUpdateQuestionDB,getFormByIdDB:mockGetFormByIdDB});
    });

    afterEach(()=>{
        sinon.restore();
    })

    it('No token return Unauthorized error',async()=>{
        req.header.returns(null);
        await updateQuestionTest(req, res,next);
        expect(next.firstCall.args[0]).to.be.instanceof(UnauthorizedError);
    });

    it('user with invalid token, unauthorized error', async()=>{
        req.header.returns('validToken');
        mockAxios.post.resolves({data:{}});
        await updateQuestionTest(req,res,next);
        expect(next.firstCall.args[0]).to.be.instanceOf(UnauthorizedError);
    });

    it('updateData is missing, bad request error', async()=>{
        req.header.returns('validToken');
        mockAxios.post.resolves({data: {user:{userId:1}}});
        req.body.updateData={};
        await updateQuestionTest(req,res,next);
        expect(next.firstCall.args[0]).to.be.instanceOf(BadRequestError);
    });

    it('Question not found, not found error', async()=>{
        req.header.returns('validToken');
        mockAxios.post.resolves({data: {user:{userId:1}}});
        mockGetQuestionById.resolves(null)
        await updateQuestionTest(req,res,next);
        expect(next.firstCall.args[0]).to.be.instanceOf(NotFoundError);
    });

    it('User is not owner neither collaborator, forbidden error', async()=>{
        req.header.returns('validToken');
        mockAxios.post.resolves({data: {user:{userId:5}}});
        mockGetQuestionById.resolves({questionId:"67b4ea4b9a23259515e004fa", questionText: "Koliko ima minuta u satu"});
        mockGetFormByIdDB.resolves({formId: 1234, authId: 1, collaborators: [2,3,4]});
        await updateQuestionTest(req,res,next);
        expect(next.firstCall.args[0]).to.be.instanceOf(ForbiddenError);
    })

    it('Successfully updated question',async()=>{
        req.header.returns('validToken');
        mockAxios.post.resolves({data: {user:{userId:5}}});
        mockGetQuestionById.resolves({questionId:"67b4ea4b9a23259515e004fa", questionText: "Koliko ima minuta u satu"});
        mockGetFormByIdDB.resolves({formId: 1234, authId: 5, collaborators: [2,3,4]});
        mockUpdateQuestionDB.resolves({questionId: "67b4ea4b9a23259515e004fa", questionText:"koliko ima sati u danu?" })
        await updateQuestionTest(req,res,next);
        expect(res.status.calledWith(200)).to.be.true;
    });

    it('failed to update question',async()=>{
        req.header.returns('validToken');
        mockAxios.post.resolves({data: {user:{userId:5}}});
        mockGetQuestionById.resolves({questionId:"67b4ea4b9a23259515e004fa", questionText: "Koliko ima minuta u satu"});
        mockGetFormByIdDB.resolves({formId: 1234, authId: 5, collaborators: [2,3,4]});
        mockUpdateQuestionDB.resolves(null);
        await updateQuestionTest(req,res,next);
        expect(next.firstCall.args[0]).to.be.instanceOf(InternalServerError);
    })


})