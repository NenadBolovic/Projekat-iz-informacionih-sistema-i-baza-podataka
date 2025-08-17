import {expect} from 'chai';
import sinon from 'sinon';
import {getAnswersByUser} from '../controllers/answercontroller.js';
import { UnauthorizedError,BadRequestError,ForbiddenError,InternalServerError} from '../errors.js';

describe('Get answers of form',()=>{
    let req,res,next;
    let mockAxios, mockGetAnswersByUserId,getAnswersByUserTest;

    beforeEach(async ()=>{
        req={
            header: sinon.stub(),
            params: {formId: 123,userAnswersId:1}
        };
        res={json: sinon.stub(),status: sinon.stub().returnsThis()};
        next=sinon.stub();
        mockAxios={get:sinon.stub(),post:sinon.stub()};
        mockGetAnswersByUserId=sinon.stub();
        getAnswersByUserTest=await getAnswersByUser({axios: mockAxios,getAnswersByUserId: mockGetAnswersByUserId});
        sinon.stub(console, 'error');
    });

    afterEach(()=>{
        sinon.restore();
    });

    it('Access denied, no token provided.', async()=>{
        req.header.returns(null);
        await getAnswersByUserTest(req,res,next);
        expect(next.firstCall.args[0]).to.be.instanceof(UnauthorizedError);
    });

    it('Invalid token',async()=>{
        req.header.returns('invalidToken');
        mockAxios.post.resolves({data:{}});
        await getAnswersByUserTest(req,res,next);
        expect(next.firstCall.args[0]).to.be.instanceof(UnauthorizedError);
    });

    it('formId not given', async()=>{
        req.header.returns('validToken');
        req.params={};
        mockAxios.post.resolves({data: {user:{userId:'123'}}});
        await getAnswersByUserTest(req,res,next);
        expect(next.firstCall.args[0]).to.be.instanceOf(BadRequestError);
    });

    it('User is not authorized to view answers', async () => {
        req.header.returns('Bearer validToken');
        mockAxios.post.resolves({ data: { user: { userId: 999 } } });
        mockAxios.get.resolves({ data: { form: { authId: 123, collaborators: [], observers: [] } } });

        await getAnswersByUserTest(req, res, next);
        expect(next.firstCall.args[0]).to.be.instanceof(ForbiddenError);
    });

    it('user is the form owner return answers', async () => {
        req.header.returns('Bearer validToken');
        mockAxios.post.resolves({ data: { user: { userId: '123' } } });
        mockAxios.get.resolves({ data: { form: { authId: '123', collaborators: [], observers: [] } } });
        mockGetAnswersByUserId.resolves([{ answer: 'Test Answer' }]);

        await getAnswersByUserTest(req, res, next);
        console.log('res.status called:', res.status.calledWith(200));
        console.log('res.json called with:', res.json.args);
        expect(res.status.calledWith(200)).to.be.true;
        expect(res.json.calledWith([{ answer: 'Test Answer' }])).to.be.true;
    });

    it('Internal error should return 500 error when getAnswersByFIDQID fails', async () => {
        req.header.returns('Bearer validToken');
        mockAxios.post.resolves({ data: { user: { userId: '123' } } });
        mockAxios.get.resolves({ data: { form: { authId: '123', collaborators: [], observers: [] } } });
        mockGetAnswersByUserId.rejects(new InternalServerError('Database error occurred'));
    
        await getAnswersByUserTest(req, res, next);
        expect(next.called).to.be.true;
        expect(next.firstCall.args[0]).to.be.instanceof(InternalServerError);
        expect(next.firstCall.args[0].message).to.equal('Database error occurred');
    });
})







