import { expect } from 'chai';
import sinon from 'sinon';
import { MongoClient } from 'mongodb';
import { createGetFormById } from '../controllers/formscontroller.js';
import {BadRequestError,ForbiddenError,UnauthorizedError,InternalServerError,NotFoundError} from '../errors.js';

describe('GET /form/:id', () => {
    let req, res, next;
    let  mockGetFormByIdDB,mockAxiosInstance, getFormTest;

    beforeEach(async () => {
        req = {
            header: sinon.stub(),
            params: {
                id: "123"
            }
        };

        res = {status: sinon.stub().returnsThis(),
            json: sinon.stub(),
            send: sinon.stub(), };
        sinon.stub(MongoClient.prototype, 'connect').resolves();
        mockGetFormByIdDB=sinon.stub();
        mockAxiosInstance = { delete:sinon.stub(),post: sinon.stub() };
        next=sinon.stub();
        getFormTest = await createGetFormById({
            axiosInstance: mockAxiosInstance,
            getFormByIdDB: mockGetFormByIdDB
        });
    });

    afterEach(() => {
        sinon.restore();
    });

    it('Form not found', async()=>{
        req.header.returns(null);
        mockGetFormByIdDB.resolves(null);
        await getFormTest(req,res,next);
        expect(next.firstCall.args[0]).to.be.instanceOf(NotFoundError);
    });

    it('Form is for logged in users.', async()=>{
        req.header.returns(null);
        mockAxiosInstance.post.resolves({data:{}});
        mockGetFormByIdDB.resolves({formId: "123",indicator: 1});
        await getFormTest(req,res,next);
        expect(next.firstCall.args[0]).to.be.instanceOf(UnauthorizedError);
    });
    
    it('Form is locked for users.', async()=>{
        req.header.returns(null);
        mockAxiosInstance.post.resolves({data:{}});
        mockGetFormByIdDB.resolves({formId: "123",indicator: 0,locked:1});
        await getFormTest(req,res,next);
        expect(next.firstCall.args[0]).to.be.instanceOf(ForbiddenError);
    });

    it('User is not authorized.', async()=>{
        req.header.returns('token');
        mockAxiosInstance.post.resolves({data:{user:{}}});
        mockGetFormByIdDB.resolves({formId: "123",indicator: 1,locked:1,owner: 1, collaborators:[2,3,4]});
        await getFormTest(req,res,next);
        expect(next.firstCall.args[0]).to.be.instanceOf(UnauthorizedError);
    });

    it('User is authorized but form is locked.', async()=>{
        req.header.returns('token');
        mockAxiosInstance.post.resolves({data:{user:{userId:5}}});
        mockGetFormByIdDB.resolves({formId: "123",indicator: 1,locked:1,owner: 1, collaborators:[2,3,4]});
        await getFormTest(req,res,next);
        expect(next.firstCall.args[0]).to.be.instanceOf(ForbiddenError);
    });

    it('User is owner or collaborator', async()=>{
        req.header.returns('token');
        mockAxiosInstance.post.resolves({data:{user:{userId:1}}});
        mockGetFormByIdDB.resolves({formId: "123",indicator: 1,locked:1,authId: 1, collaborators:[2,3,4]});
        await getFormTest(req,res,next);
        expect(res.status.calledWith(200)).to.be.true;
    });
    
});







