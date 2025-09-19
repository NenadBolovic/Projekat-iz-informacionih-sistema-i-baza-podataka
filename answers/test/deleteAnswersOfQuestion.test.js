import {expect} from 'chai';
import sinon from 'sinon';
import {deleteAnswersOfQuestion} from '../controllers/answercontroller.js';
import { UnauthorizedError,BadRequestError,ForbiddenError,InternalServerError} from '../errors.js';

describe('Delete answers of question',()=>{
    let req,res,next;
    let mockAxios, mockGetAnswersByFIDQID,mockDeleteAnswersByQuestionDB,deleteAnswersOfQuestionTest;

    beforeEach(async ()=>{
        req={
            header: sinon.stub(),
            
        };
        res={json: sinon.stub(),status: sinon.stub().returnsThis()};
        next=sinon.stub();
        mockAxios={get:sinon.stub(),post:sinon.stub()};
        mockGetAnswersByFIDQID=sinon.stub();
        mockDeleteAnswersByQuestionDB=sinon.stub();
        deleteAnswersOfQuestionTest=await deleteAnswersOfQuestion({axios: mockAxios,getAnswersByFIDQID:mockGetAnswersByFIDQID,deleteAnswersByQuestionDB:mockDeleteAnswersByQuestionDB});
        sinon.stub(console, 'error');
    });

    afterEach(()=>{
        sinon.restore();
    });

    
    it('Access denied, no token provided.', async()=>{
        req.header.returns(null);
        await deleteAnswersOfQuestionTest(req,res,next);
        expect(next.firstCall.args[0]).to.be.instanceof(UnauthorizedError);
    });

    it('Invalid token',async()=>{
        req.header.returns('invalidToken');
        mockAxios.post.resolves({data:{}});
        await deleteAnswersOfQuestionTest(req,res,next);
        expect(next.firstCall.args[0]).to.be.instanceof(UnauthorizedError);
    });

    it('formId not given', async()=> {
        req.header.returns('Bearer validToken');
        mockAxios.post.resolves({data:{ user:{ userId: 1 }}});
        req.body={}; 
        await deleteAnswersOfQuestionTest(req,res,next);
        expect(next.firstCall.args[0]).to.be.instanceOf(BadRequestError);
    });

    it('formId not given', async()=> {
        req.header.returns('Bearer validToken');
        mockAxios.post.resolves({data:{ user:{ userId: 1 }}});
        req.body={formId: 1, questionId: 2}; 
        mockGetAnswersByFIDQID.resolves([{answerId:1, answer: "PISBP"},{answerId:1, answer: "1389"}]);
        mockDeleteAnswersByQuestionDB.resolves({deletedCount: 2});
        await deleteAnswersOfQuestionTest(req,res,next);
        expect(res.status.calledWith(200)).to.be.true;
    });

    

})








