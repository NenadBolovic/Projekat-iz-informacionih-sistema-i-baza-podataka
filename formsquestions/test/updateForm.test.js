import { expect } from 'chai';
import sinon from 'sinon';
import { MongoClient } from 'mongodb';
import { updateForm } from '../controllers/formscontroller.js';
import {BadRequestError,ForbiddenError,UnauthorizedError,InternalServerError} from '../errors.js';

describe('PATCH /forms', () => {
    let req, res, next;
    let mockGetFormByIdDB, mockUpdateFormDB, mockAxiosInstance, updateFormTest;

    beforeEach(async () => {
        req = {
            header: sinon.stub(),
            body: {
                "formId": "67aa60d2948dbcbb65cdda25",
                "name": "Promenjena forma",
                "description": "Brate promenio sam deskripciju",
                "indicator": 1,
                "locked": 1,
                "collaborators": [6],
                "observers": []
            },
            files: [],
        };

        res = {status: sinon.stub().returnsThis(),
            json: sinon.stub(),
            send: sinon.stub(), };
        sinon.stub(MongoClient.prototype, 'connect').resolves();
        mockGetFormByIdDB = sinon.stub();
        mockUpdateFormDB = sinon.stub();
        mockAxiosInstance = { post: sinon.stub() };
        next=sinon.stub();
        updateFormTest = await updateForm({
            axiosInstance: mockAxiosInstance,
            getFormByIdDB: mockGetFormByIdDB,
            updateFormDB: mockUpdateFormDB,
        });
    });

    afterEach(() => {
        sinon.restore();
    });

    it('Token is not provided', async()=>{
        req.header.returns(null);
        await updateFormTest(req,res,next);
        expect(next.firstCall.args[0]).to.be.instanceOf(UnauthorizedError);
    });

    it('Invalid token,unauthorized error', async()=>{
        req.header.returns('validToken');
        mockAxiosInstance.post.resolves({data:{}});
        await updateFormTest(req,res,next);
        expect(next.firstCall.args[0]).to.be.instanceOf(UnauthorizedError);
    });

    it('Not given formId or name, bad request', async()=>{
        req.header.returns('validToken');
        req.body.formId=null;
        mockAxiosInstance.post.resolves({data:{user:{userId:1}}});
        await updateFormTest(req,res,next);
        expect(next.firstCall.args[0]).to.be.instanceOf(BadRequestError);
    });

    it('Not given locked or indicator, bad request', async()=>{
        req.header.returns('validToken');
        req.body.formId=null;
        mockAxiosInstance.post.resolves({data:{user:{userId:1}}});
        await updateFormTest(req,res,next);
        expect(next.firstCall.args[0]).to.be.instanceOf(BadRequestError);
    });
    
    it('Collaborators and observers are not array, bad request', async()=>{
        req.header.returns('validToken');
        req.body.collaborators="lalala";
        mockAxiosInstance.post.resolves({data:{user:{userId:1}}});
        await updateFormTest(req,res,next);
        expect(next.firstCall.args[0]).to.be.instanceOf(BadRequestError);
    });

    it('Error getting form from database, bad request', async()=>{
        req.header.returns('validToken');
        mockAxiosInstance.post.resolves({data:{user:{userId:1}}});
        mockGetFormByIdDB.rejects(new InternalServerError('Database error'));
        await updateFormTest(req,res,next);
        expect(next.firstCall.args[0]).to.be.instanceOf(InternalServerError);
    });

    it('User is forbidden to change attributes of form, bad request', async()=>{
        req.header.returns('validToken');
        mockAxiosInstance.post.resolves({data:{user:{userId:1}}});
        mockGetFormByIdDB.resolves({
            "authId": 2,
            "formId": "67aa60d2948dbcbb65cdda25",
            "name": "Promenjena forma",
            "description": "Brate promenio sam deskripciju",
            "indicator": 1,
            "locked": 1,
            "collaborators": [6],
            "observers": []
        });
        await updateFormTest(req,res,next);
        expect(next.firstCall.args[0]).to.be.instanceOf(ForbiddenError);
    });

    it('Error updating form, bad request', async()=>{
        req.header.returns('validToken');
        mockAxiosInstance.post.resolves({data:{user:{userId:1}}});
        mockGetFormByIdDB.resolves({
            "authId": 1,
            "formId": "67aa60d2948dbcbb65cdda25",
            "name": "Originalna forma",
            "description": "Originalna deskripcija",
            "indicator": 1,
            "locked": 1,
            "collaborators": [6],
            "observers": []
        });
        mockUpdateFormDB.rejects(new InternalServerError('Database error.'));
        await updateFormTest(req,res,next);
        expect(next.firstCall.args[0]).to.be.instanceOf(InternalServerError);
    });
    
    it('Updated form successfully.', async()=>{
        req.header.returns('validToken');
        mockAxiosInstance.post.resolves({data:{user:{userId:1}}});
        mockGetFormByIdDB.resolves({
            "authId": 1,
            "formId": "67aa60d2948dbcbb65cdda25",
            "name": "Originalna forma",
            "description": "Originalna deskripcija",
            "indicator": 1,
            "locked": 1,
            "collaborators": [6],
            "observers": []
        });
        mockUpdateFormDB.resolves({
                "authId": 1,
                "formId": "67aa60d2948dbcbb65cdda25",
                "name": "Promenjena forma",
                "description": "Brate promenio sam deskripciju",
                "indicator": 1,
                "locked": 1,
                "collaborators": [6],
                "observers": []
        });
        await updateFormTest(req,res,next);
        expect(res.status.calledWith(200)).to.be.true;
    });
});




