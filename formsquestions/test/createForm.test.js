import { expect } from 'chai';
import sinon from 'sinon';
import { MongoClient } from 'mongodb';
import { createForm } from '../controllers/formscontroller.js';
import {BadRequestError,ForbiddenError,UnauthorizedError,InternalServerError} from '../errors.js';

describe('POST /forms', () => {
    let req, res, next;
    let mockAddForm, mockAddQuestions, mockAxiosInstance, createFormTest;

    beforeEach(async () => {
        req = {
            header: sinon.stub(),
            body: {
                formData: {
                    name: 'Test Form',
                    description: 'Testiramo dodavanje',
                    indicator: 1,
                    locked: 0,
                    collaborators: [2,3],
                    observers: [4,5],
                    questions: [
                        { questionText: 'Question 1', options: [{ text: 'Option 1' }, { text: 'Option 2' }] },
                        { questionText: 'Question 2', options: [{ text: 'Option 1' }] },
                    ],
                },
            },
            files: [],
        };

        res = {status: sinon.stub().returnsThis(),
            json: sinon.stub(),
            send: sinon.stub(), };
        sinon.stub(MongoClient.prototype, 'connect').resolves();
        mockAddForm = sinon.stub();
        mockAddQuestions = sinon.stub();
        mockAxiosInstance = { post: sinon.stub() };
        next=sinon.stub();
        createFormTest = await createForm({
            axiosInstance: mockAxiosInstance,
            addForm: mockAddForm,
            addQuestions: mockAddQuestions,
        });
    });

    afterEach(() => {
        sinon.restore();
    });

    it('user is not logged in, unauthorized error', async () => {
        req.header.returns(null);
        await createFormTest(req, res,next);
        expect(next.firstCall.args[0]).to.be.instanceof(UnauthorizedError);
    });

    it('user with invalid token, unauthorized error', async()=>{
        req.header.returns('validToken');
        mockAxiosInstance.post.resolves({data:{}});
        await createFormTest(req,res,next);
        expect(next.firstCall.args[0]).to.be.instanceOf(UnauthorizedError);
    });

    it('formData is missing, bad request error', async()=>{
        req.header.returns('validToken');
        mockAxiosInstance.post.resolves({data: {user:{userId:1}}});
        req.body.formData={};
        await createFormTest(req,res,next);
        expect(next.firstCall.args[0]).to.be.instanceOf(BadRequestError);
    });

    it('questions are missing, bad request error', async()=>{
        req.header.returns('validToken');
        mockAxiosInstance.post.resolves({data: {user:{userId:1}}});
        req.body.formData.questions={};
        await createFormTest(req,res,next);
        expect(next.firstCall.args[0]).to.be.instanceOf(BadRequestError);
    });

    it('indicator is missing, bad request error', async()=>{
        req.header.returns('validToken');
        mockAxiosInstance.post.resolves({data: {user:{userId:1}}});
        req.body.formData.indicator=undefined;
        await createFormTest(req,res,next);
        expect(next.firstCall.args[0]).to.be.instanceOf(BadRequestError);
    });

    it('failed to create form, internal error', async()=>{
        req.header.returns('validToken');
        mockAxiosInstance.post.resolves({data: {user:{userId:1}}});
        mockAddForm.rejects(new InternalServerError('Failed to create form'))
        await createFormTest(req,res,next);
        expect(next.firstCall.args[0]).to.be.instanceOf(InternalServerError);
    });


    it('falied to insert questions, internal error', async()=>{
        req.header.returns('validToken');
        mockAxiosInstance.post.resolves({data: {user:{userId:1}}});
        mockAddForm.resolves({id: 123});
        mockAddQuestions.rejects(new InternalServerError('Failed to insert questions'));
        await createFormTest(req,res,next);
        expect(next.firstCall.args[0]).to.be.instanceOf(InternalServerError);
    });

    it('successfuly created form with questions', async()=>{
        req.header.returns('validToken');
        mockAxiosInstance.post.resolves({data: {user:{userId:1}}});
        mockAddForm.resolves({_id: 123});
        mockAddQuestions.resolves({questions: [
            { questionText: 'Question 1', options: [{ text: 'Option 1' }, { text: 'Option 2' }] },
            { questionText: 'Question 2', options: [{ text: 'Option 1' }] },
        ]});
        await createFormTest(req,res,next);
        expect(res.status.calledWith(201)).to.be.true;
    });

    it('successfuly created form without questions', async()=>{
        req.header.returns('validToken');
        req.body.formData.questions=[];
        mockAxiosInstance.post.resolves({data: {user:{userId:1}}});
        mockAddForm.resolves({_id: 123});
        await createFormTest(req,res,next);
        expect(res.status.calledWith(201)).to.be.true;
    });

    
});




