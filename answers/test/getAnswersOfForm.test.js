import {expect} from 'chai';
import sinon from 'sinon';
import {getAnswersOfForm} from '../controllers/answercontroller.js';
import { UnauthorizedError,BadRequestError,ForbiddenError, InternalServerError } from '../errors.js';

describe('Get answers of form',()=>{
    let req,res,next;
    let mockAxios, mockGetAnswersOfFormDB,getAnswersOfFormTest;

    beforeEach(async ()=>{
        req={
            header: sinon.stub(),
            params: {formId: 123}
        };
        res={json: sinon.stub(),status: sinon.stub().returnsThis()};
        next=sinon.stub();
        mockAxios={get:sinon.stub(),post:sinon.stub()};
        mockGetAnswersOfFormDB=sinon.stub();
        getAnswersOfFormTest=await getAnswersOfForm({axios: mockAxios,getAnswersOfFormDB: mockGetAnswersOfFormDB});
        sinon.stub(console, 'error');
    });

    afterEach(()=>{
        sinon.restore();
    });

    it('Access denied, no token provided.', async()=>{
        req.header.returns(null);
        await getAnswersOfFormTest(req,res,next);
        expect(next.firstCall.args[0]).to.be.instanceof(UnauthorizedError);
    });

    it('Invalid token',async()=>{
        req.header.returns('invalidToken');
        mockAxios.post.resolves({data:{}});
        await getAnswersOfFormTest(req,res,next);
        expect(next.firstCall.args[0]).to.be.instanceof(UnauthorizedError);
    });

    it('formId not provided', async()=>{
        req.header.returns('validToken');
        req.params={};
        mockAxios.post.resolves({data: {user:{userId:'123'}}});

        await getAnswersOfFormTest(req,res,next);
        expect(next.firstCall.args[0]).to.be.instanceOf(BadRequestError);
    });

    it('User is not authorized to view answers', async () => {
        req.header.returns('Bearer validToken');
        mockAxios.post.resolves({ data: { user: { userId: '999' } } });
        mockAxios.get.resolves({ data: { form: { authId: 123, collaborators: [], observers: [] } } });

        await getAnswersOfFormTest(req, res, next);
        expect(next.firstCall.args[0]).to.be.instanceof(ForbiddenError);
    });


    it('User is the form owner, should return answers', async () => {
        req.header.returns('Bearer validToken');
        mockAxios.post.resolves({ data: { user: { userId: '123' } } });
        mockAxios.get.resolves({ data: { form: { authId: '123', collaborators: [], observers: [] } } });
        mockGetAnswersOfFormDB.resolves([{ answer: 'Test Answer' }]);

        await getAnswersOfFormTest(req, res, next);
        console.log('res.status called:', res.status.calledWith(200));
        console.log('res.json called with:', res.json.args);
        expect(res.status.calledWith(200)).to.be.true;
        expect(res.json.calledWith([{ answer: 'Test Answer' }])).to.be.true;
    });

    it('Could not get answers from database.', async () => {
        req.header.returns('Bearer validToken');
        mockAxios.post.resolves({ data: { user: { userId: '123' } } });
        mockAxios.get.resolves({ data: { form: { authId: '123', collaborators: [], observers: [] } } });
        mockGetAnswersOfFormDB.resolves(null);

        await getAnswersOfFormTest(req, res, next);
        console.log('res.status called:', res.status.calledWith(200));
        expect(next.firstCall.args[0]).to.be.instanceof(InternalServerError);
    });


})

