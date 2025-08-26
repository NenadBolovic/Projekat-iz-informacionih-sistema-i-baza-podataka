import { expect } from 'chai';
import sinon from 'sinon';
import { MongoClient } from 'mongodb';
import { searchForms } from '../controllers/formscontroller.js';
import {BadRequestError,ForbiddenError,UnauthorizedError,InternalServerError,NotFoundError} from '../errors.js';

describe('PATCH /forms', () => {
    let req, res, next;
    let  mockSearchFormDB,mockAxiosInstance, searchFormTest;

    beforeEach(async () => {
        req = {
            header: sinon.stub(),
            query: {},
        };

        res = {status: sinon.stub().returnsThis(),
            json: sinon.stub(),
            send: sinon.stub(), };
        sinon.stub(MongoClient.prototype, 'connect').resolves();
        mockSearchFormDB=sinon.stub();
        mockAxiosInstance = { delete:sinon.stub(),post: sinon.stub() };
        next=sinon.stub();
        searchFormTest = await searchForms({
            axiosInstance: mockAxiosInstance,
            searchFormsDB: mockSearchFormDB
        });
    });

    afterEach(() => {
        sinon.restore();
    });

    

    it('Not given formId or name, bad request', async()=>{
        req.header.returns('validToken');
        req.query.q='';
        mockAxiosInstance.post.resolves({data:{user:{userId:1}}});
        await searchFormTest(req,res,next);
        expect(next.firstCall.args[0]).to.be.instanceOf(BadRequestError);
    });

    it('Success', async()=>{
        req.header.returns('validToken');
        req.query.q='forma1';
        mockAxiosInstance.post.resolves({data:{user:{userId:1}}});
        mockSearchFormDB.resolves({forms:{forma1:{},forma2:{}}})
        await searchFormTest(req,res,next);
        expect(res.status.calledWith(200)).to.be.true;
    });

    it('Success', async()=>{
        req.header.returns('validToken');
        req.query.q='forma1';
        mockAxiosInstance.post.resolves({data:{user:{userId:1}}});
        mockSearchFormDB.rejects(new InternalServerError('Database error'));
        await searchFormTest(req,res,next);
        expect(next.firstCall.args[0]).to.be.instanceOf(InternalServerError);
    });

});






