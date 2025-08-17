import {expect} from 'chai';
import sinon from 'sinon';
import {deleteAnswers} from '../controllers/answercontroller.js';
import { UnauthorizedError,BadRequestError,ForbiddenError,InternalServerError} from '../errors.js';

describe('Get answers of form',()=>{
    let req,res,next;
    let mockAxios, mockGetAnswersOfFormDB,mockDeleteAnswersDB,deleteAnswersTest;

    beforeEach(async ()=>{
        req={
            header: sinon.stub(),
            body: {formId: 123}
        };
        res={json: sinon.stub(),status: sinon.stub().returnsThis()};
        next=sinon.stub();
        mockAxios={get:sinon.stub(),post:sinon.stub()};
        mockGetAnswersOfFormDB=sinon.stub();
        mockDeleteAnswersDB=sinon.stub();
        deleteAnswersTest=await deleteAnswers({axios: mockAxios,getAnswersOfFormDB:mockGetAnswersOfFormDB,deleteAnswersDB:mockDeleteAnswersDB});
        sinon.stub(console, 'error');
    });

    afterEach(()=>{
        sinon.restore();
    });

    
    it('Access denied, no token provided.', async()=>{
        req.header.returns(null);
        await deleteAnswersTest(req,res,next);
        expect(next.firstCall.args[0]).to.be.instanceof(UnauthorizedError);
    });

    it('Invalid token',async()=>{
        req.header.returns('invalidToken');
        mockAxios.post.resolves({data:{}});
        await deleteAnswersTest(req,res,next);
        expect(next.firstCall.args[0]).to.be.instanceof(UnauthorizedError);
    });

    it('formId not given', async()=>{
        req.header.returns('validToken');
        req.body={};
        mockAxios.post.resolves({data: {user:{userId:'123'}}});
        await deleteAnswersTest(req,res,next);
        expect(next.firstCall.args[0]).to.be.instanceOf(BadRequestError);
    });

    it('User is not authorized to delete answers', async () => {
        req.header.returns('Bearer validToken');
        mockAxios.post.resolves({ data: { user: { userId: 999 } } });
        mockAxios.get.resolves({ data: { form: { authId: 123, collaborators: [], observers: [] } } });

        await deleteAnswersTest(req, res, next);
        expect(next.firstCall.args[0]).to.be.instanceof(ForbiddenError);
    });

    it('user is the form owner delete answers', async () => {
        req.header.returns('Bearer validToken');
        mockAxios.post.resolves({ data: { user: { userId: '123' } } });
        mockAxios.get.resolves({ data: { form: { authId: '123', collaborators: [], observers: [] } } });
        mockGetAnswersOfFormDB.resolves([{ answer: 'Test Answer' }]);
        mockDeleteAnswersDB.resolves([{answer: 'Test Answer'}])
        await deleteAnswersTest(req, res, next);
        console.log('res.status called:', res.status.calledWith(200));
        console.log('res.json called with:', res.json.args);
        expect(res.status.calledWith(200)).to.be.true;
    });


})








