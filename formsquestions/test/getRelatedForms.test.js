import { expect } from 'chai';
import sinon from 'sinon';
import { MongoClient } from 'mongodb';
import { getRelatedForms } from '../controllers/formscontroller.js';
import {BadRequestError,ForbiddenError,UnauthorizedError,InternalServerError,NotFoundError} from '../errors.js';

describe('PATCH /forms', () => {
    let req, res, next;
    let  mockGetRelatedFormsDB,mockAxiosInstance, getRelatedFormsTest;

    beforeEach(async () => {
        req = {
            header: sinon.stub(),
        };

        res = {status: sinon.stub().returnsThis(),
            json: sinon.stub(),
            send: sinon.stub(), };
        sinon.stub(MongoClient.prototype, 'connect').resolves();
        mockGetRelatedFormsDB=sinon.stub();
        mockAxiosInstance = { delete:sinon.stub(),post: sinon.stub() };
        next=sinon.stub();
        getRelatedFormsTest= await getRelatedForms({
            axiosInstance: mockAxiosInstance,
            getRelatedFormsDB: mockGetRelatedFormsDB
        });
    });

    afterEach(() => {
        sinon.restore();
    });

    it('Token is not provided', async()=>{
        req.header.returns(null);
        await getRelatedFormsTest(req,res,next);
        expect(next.firstCall.args[0]).to.be.instanceOf(UnauthorizedError);
    });

    it('Invalid token,unauthorized error', async()=>{
        req.header.returns('validToken');
        mockAxiosInstance.post.resolves({data:{}});
        await getRelatedFormsTest(req,res,next);
        expect(next.firstCall.args[0]).to.be.instanceOf(UnauthorizedError);
    });

    it('Database error', async()=>{
        req.header.returns('validToken');
        mockAxiosInstance.post.resolves({data:{user:{userId:1}}});
        mockGetRelatedFormsDB.rejects(new InternalServerError('Database error'));
        await getRelatedFormsTest(req,res,next);
        expect(next.firstCall.args[0]).to.be.instanceOf(InternalServerError);
    });

    it('Form is not found', async()=>{
        req.header.returns('validToken');
        mockAxiosInstance.post.resolves({data:{user:{userId:1}}});
        mockGetRelatedFormsDB.resolves(null);
        await getRelatedFormsTest(req,res,next);
        expect(next.firstCall.args[0]).to.be.instanceOf(NotFoundError);
    });

    it('Success', async()=>{
        req.header.returns('validToken');
        mockAxiosInstance.post.resolves({data:{user:{userId:1}}});
        mockGetRelatedFormsDB.resolves({forms:{form1:{name: "forma1"},form2:{name: "forma2"}}});
        await getRelatedFormsTest(req,res,next);
        expect(res.status.calledWith(200)).to.be.true;
    });
    
});







