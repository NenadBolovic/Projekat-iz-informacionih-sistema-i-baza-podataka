import {expect} from 'chai';
import sinon from 'sinon';
import {cloneQuestion} from '../controllers/questionscontroller.js';
import {UnauthorizedError,ForbiddenError,BadRequestError,InternalServerError,NotFoundError} from '../errors.js'

describe('cloneQuestion',()=>{
    let req,res,next;
    let mockAxios,mockGetFormByIdDB,mockCloneQuestionDB,mockDeleteQuestionDB,cloneQuestionTest;

    beforeEach(async ()=>{
        req={
            header: sinon.stub(),
            body: {
                "formId": "683639198557e47d8870aa47",
                "uniqQuestionId": "683639198557e47d8870aa4c"
            },
        }
        res = {status: sinon.stub().returnsThis(),
                json: sinon.stub(),
                send: sinon.stub(), 
        };
        next=sinon.stub();
        mockAxios={post:sinon.stub(),get:sinon.stub()};
        mockGetFormByIdDB=sinon.stub();
        mockCloneQuestionDB=sinon.stub();
        mockDeleteQuestionDB=sinon.stub();
        cloneQuestionTest=await cloneQuestion({axios: mockAxios,getFormByIdDB:mockGetFormByIdDB,cloneQuestionDB:mockCloneQuestionDB,deleteQuestionDB:mockDeleteQuestionDB});

    });

    afterEach(()=>{
        sinon.restore();
    })

    it('No token return Unauthorized error',async()=>{
            req.header.returns(null);
            await cloneQuestionTest(req, res,next);
            expect(next.firstCall.args[0]).to.be.instanceof(UnauthorizedError);
        });
    
    it('user with invalid token, unauthorized error', async()=>{
        req.header.returns('validToken');
        mockAxios.post.resolves({data:{}});
        await cloneQuestionTest(req,res,next);
        expect(next.firstCall.args[0]).to.be.instanceOf(UnauthorizedError);
    });

    it('form is not found, not found error', async()=>{
        req.header.returns('validToken');
        mockAxios.post.resolves({data:{user:{userId:5}}});
        mockGetFormByIdDB.resolves(null);
        await cloneQuestionTest(req,res,next);
        expect(next.firstCall.args[0]).to.be.instanceOf(NotFoundError);
    });

    it('user is not author or collaborator, forbidden error', async()=>{
        req.header.returns('validToken');
        mockAxios.post.resolves({data:{user:{userId:5}}});
        mockGetFormByIdDB.resolves({formId: "6796aed9a5567a1c07977eea", authId:3,collaborators:[6,7,8]});
        await cloneQuestionTest(req,res,next);
        expect(next.firstCall.args[0]).to.be.instanceOf(ForbiddenError);
    });

    it('failed to clone question',async()=>{
        req.header.returns('validToken');
        mockAxios.post.resolves({data: {user:{userId:5}}});
        mockGetFormByIdDB.resolves({formId: 1234, authId: 5, collaborators: [2,3,4]});
        mockCloneQuestionDB.resolves(null);
        await cloneQuestionTest(req,res,next);
        expect(next.firstCall.args[0]).to.be.instanceOf(InternalServerError);
    });

    it('question is not cloned correctly',async()=>{
        req.header.returns('validToken');
        mockAxios.post.resolves({data: {user:{userId:5}}});
        mockGetFormByIdDB.resolves({formId: 1234, authId: 5, collaborators: [2,3,4]});
        mockCloneQuestionDB.resolves({questionToClone:{questionText: "Kako ste?",questionType:"short-text"},clone:{questionText: "Kako ste?",questionType:"long-text"}});
        await cloneQuestionTest(req,res,next);
        expect(next.firstCall.args[0]).to.be.instanceOf(Error);
    })

    it('Successfully cloned question',async()=>{
        req.header.returns('validToken');
        mockAxios.post.resolves({data: {user:{userId:5}}});
        mockGetFormByIdDB.resolves({formId: 1234, authId: 5, collaborators: [2,3,4]});
        mockCloneQuestionDB.resolves({questionToClone:{questionText: "Kako ste?",questionType:"short-text"},clone:{questionText: "Kako ste?",questionType:"short-text"}});
        await cloneQuestionTest(req,res,next);
        expect(res.status.calledWith(200)).to.be.true;
    });
})