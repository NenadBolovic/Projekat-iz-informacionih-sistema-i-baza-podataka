import {expect} from 'chai';
import sinon from 'sinon';
import {deleteQuestion} from '../controllers/questionscontroller.js';
import {UnauthorizedError,ForbiddenError,BadRequestError,InternalServerError,NotFoundError} from '../errors.js'

describe('updateQuestion',()=>{
    let req,res,next;
    let mockAxios,mockGetQuestionById,mockDeleteQuestionDB,mockGetFormByIdDB,deleteQuestionTest;

    beforeEach(async ()=>{
        req={
            header: sinon.stub(),
            body:{
                "questionId": "6793a3b1e5d6f8aa6d28373b"
            }
        }
        res = {status: sinon.stub().returnsThis(),
                json: sinon.stub(),
                send: sinon.stub(), 
        };
        next=sinon.stub();
        mockAxios={post:sinon.stub(),get:sinon.stub()};
        mockGetQuestionById=sinon.stub();
        mockDeleteQuestionDB=sinon.stub();
        mockGetFormByIdDB=sinon.stub();
        deleteQuestionTest=await deleteQuestion({axiosInstance:mockAxios,getQuestionById:mockGetQuestionById,
            deleteQuestionDB:mockDeleteQuestionDB,getFormByIdDB:mockGetFormByIdDB});
    });

    afterEach(()=>{
        sinon.restore();
    })

    it('No token return Unauthorized error',async()=>{
        req.header.returns(null);
        await deleteQuestionTest(req, res,next);
        expect(next.firstCall.args[0]).to.be.instanceof(UnauthorizedError);
    });

    it('user with invalid token, unauthorized error', async()=>{
        req.header.returns('validToken');
        mockAxios.post.resolves({data:{}});
        await deleteQuestionTest(req,res,next);
        expect(next.firstCall.args[0]).to.be.instanceOf(UnauthorizedError);
    });

    it('QuestionId is missing, bad request error', async()=>{
        req.header.returns('validToken');
        mockAxios.post.resolves({data: {user:{userId:1}}});
        req.body={};
        await deleteQuestionTest(req,res,next);
        expect(next.firstCall.args[0]).to.be.instanceOf(BadRequestError);
    });

    it('Question not found, not found error', async()=>{
        req.header.returns('validToken');
        mockAxios.post.resolves({data: {user:{userId:1}}});
        mockGetQuestionById.resolves(null)
        await deleteQuestionTest(req,res,next);
        expect(next.firstCall.args[0]).to.be.instanceOf(NotFoundError);
    });

    it('User is not owner neither collaborator, forbidden error', async()=>{
        req.header.returns('validToken');
        mockAxios.post.resolves({data: {user:{userId:5}}});
        mockGetQuestionById.resolves({questionId:"67b4ea4b9a23259515e004fa", questionText: "Koliko ima minuta u satu"});
        mockGetFormByIdDB.resolves({formId: 1234, authId: 1, collaborators: [2,3,4]});
        await deleteQuestionTest(req,res,next);
        expect(next.firstCall.args[0]).to.be.instanceOf(ForbiddenError);
    })

    it('Successfully updated question',async()=>{
        req.header.returns('validToken');
        mockAxios.post.resolves({data: {user:{userId:5}}});
        mockGetQuestionById.resolves({questionId:"67b4ea4b9a23259515e004fa", questionText: "Koliko ima minuta u satu"});
        mockGetFormByIdDB.resolves({formId: 1234, authId: 5, collaborators: [2,3,4]});
        mockDeleteQuestionDB.resolves({deletedCount: 1 })
        await deleteQuestionTest(req,res,next);
        expect(res.status.calledWith(200)).to.be.true;
    });

    it('failed to update question',async()=>{
        req.header.returns('validToken');
        mockAxios.post.resolves({data: {user:{userId:5}}});
        mockGetQuestionById.resolves({questionId:"67b4ea4b9a23259515e004fa", questionText: "Koliko ima minuta u satu"});
        mockGetFormByIdDB.resolves({formId: 1234, authId: 5, collaborators: [2,3,4]});
        mockDeleteQuestionDB.resolves(null);
        await deleteQuestionTest(req,res,next);
        expect(next.firstCall.args[0]).to.be.instanceOf(InternalServerError);
    })


})