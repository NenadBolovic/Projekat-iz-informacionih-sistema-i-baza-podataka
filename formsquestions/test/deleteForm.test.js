import { expect } from 'chai';
import sinon from 'sinon';
import { MongoClient } from 'mongodb';
import { deleteForm } from '../controllers/formscontroller.js';
import {BadRequestError,ForbiddenError,UnauthorizedError,InternalServerError,NotFoundError} from '../errors.js';

describe('PATCH /forms', () => {
    let req, res, next;
    let mockGetFormByIdDB,mockDeleteQuestionDB,mockDeleteFormDB, mockAxiosInstance, deleteFormTest;

    beforeEach(async () => {
        req = {
            header: sinon.stub(),
            body: {
                "formId": "67aa60d2948dbcbb65cdda25"
            },
        };

        res = {status: sinon.stub().returnsThis(),
            json: sinon.stub(),
            send: sinon.stub(), };
        sinon.stub(MongoClient.prototype, 'connect').resolves();
        mockGetFormByIdDB = sinon.stub();
        mockDeleteFormDB = sinon.stub();
        mockDeleteQuestionDB=sinon.stub();
        mockAxiosInstance = { delete:sinon.stub(),post: sinon.stub() };
        next=sinon.stub();
        deleteFormTest = await deleteForm({
            axiosInstance: mockAxiosInstance,
            getFormByIdDB: mockGetFormByIdDB,
            deleteQuestionDB: mockDeleteQuestionDB,
            deleteFormDB: mockDeleteFormDB,
        });
    });

    afterEach(() => {
        sinon.restore();
    });

    it('Token is not provided', async()=>{
        req.header.returns(null);
        await deleteFormTest(req,res,next);
        expect(next.firstCall.args[0]).to.be.instanceOf(UnauthorizedError);
    });

    it('Invalid token,unauthorized error', async()=>{
        req.header.returns('validToken');
        mockAxiosInstance.post.resolves({data:{}});
        await deleteFormTest(req,res,next);
        expect(next.firstCall.args[0]).to.be.instanceOf(UnauthorizedError);
    });

    it('Not given formId or name, bad request', async()=>{
        req.header.returns('validToken');
        req.body.formId=null;
        mockAxiosInstance.post.resolves({data:{user:{userId:1}}});
        await deleteFormTest(req,res,next);
        expect(next.firstCall.args[0]).to.be.instanceOf(BadRequestError);
    });

    it('Form not found, not found error', async()=>{
        req.header.returns('validToken');
        mockAxiosInstance.post.resolves({data:{user:{userId:1}}});
        mockGetFormByIdDB.resolves(null);
        await deleteFormTest(req,res,next);
        expect(next.firstCall.args[0]).to.be.instanceOf(NotFoundError);
    });

    it('Collaborators and author missing, internal server error', async()=>{
        req.header.returns('validToken');
        mockAxiosInstance.post.resolves({data:{user:{userId:1}}});
        mockGetFormByIdDB.resolves({collaborators: null, authId: null});
        await deleteFormTest(req,res,next);
        expect(next.firstCall.args[0]).to.be.instanceOf(InternalServerError);
    });

    it('User does not have permission, forbiden error', async()=>{
        req.header.returns('validToken');
        mockAxiosInstance.post.resolves({data:{user:{userId:1}}});
        mockGetFormByIdDB.resolves({collaborators: [2,3], authId: 4});
        await deleteFormTest(req,res,next);
        expect(next.firstCall.args[0]).to.be.instanceOf(ForbiddenError);
    });

    it('Answers are not deleted, internal server error', async()=>{
        req.header.returns('validToken');
        mockAxiosInstance.post.resolves({data:{user:{userId:1}}});
        mockGetFormByIdDB.resolves({collaborators: [2,3], authId: 1,questions:[
            {questionText: 'Question 1', options: [{ text: 'Option 1' }, { text: 'Option 2' }]},
            {questionText: 'Question 2', options: [{ text: 'Option 1' }]},
        ]});
        mockAxiosInstance.delete.resolves(null);
        await deleteFormTest(req,res,next);
        expect(next.firstCall.args[0]).to.be.instanceOf(InternalServerError);
    });

    it('Form is not deleted, internal server error', async()=>{
        req.header.returns('validToken');
        mockAxiosInstance.post.resolves({data:{user:{userId:1}}});
        mockGetFormByIdDB.resolves({collaborators: [2,3], authId: 1,questions:[
            {questionText: 'Question 1', options: [{ text: 'Option 1' }, { text: 'Option 2' }]},
            {questionText: 'Question 2', options: [{ text: 'Option 1' }]},
        ]});
        mockAxiosInstance.delete.resolves({data: 4});
        mockDeleteFormDB.rejects(new InternalServerError('Form not deleted'));
        await deleteFormTest(req,res,next);
        expect(next.firstCall.args[0]).to.be.instanceOf(InternalServerError);
    });

    it('Form is not deleted, internal server error', async()=>{
        req.header.returns('validToken');
        mockAxiosInstance.post.resolves({data:{user:{userId:1}}});
        mockGetFormByIdDB.resolves({collaborators: [2,3], authId: 1,questions:[
            {questionText: 'Question 1', options: [{ text: 'Option 1' }, { text: 'Option 2' }]},
            {questionText: 'Question 2', options: [{ text: 'Option 1' }]},
        ]});
        mockAxiosInstance.delete.resolves({data: 4});
        mockDeleteFormDB.resolves({deletedCount: 1});
        await deleteFormTest(req,res,next);
        expect(res.status.calledWith(200)).to.be.true;
    });

});






