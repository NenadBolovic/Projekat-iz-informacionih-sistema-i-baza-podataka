import { expect } from 'chai';
import sinon from 'sinon';
import argon2, { hash } from 'argon2';
import { searchUser } from '../controllers/usercontroller.js';
import { UnauthorizedError, BadRequestError } from '../errors.js';

describe('searchUser', ()=>{
    let req,res,next;
    let mockAxios,mockSearchUserDB,searchUserTest;

    beforeEach(async()=>{
        mockAxios={post: sinon.stub()};
        mockSearchUserDB=sinon.stub();
        searchUserTest=await searchUser({axiosInstance:mockAxios,searchUserDB:mockSearchUserDB});
        req={
            header: sinon.stub(),
            params:{searchString: "user123"}
        };
        res={
            send:sinon.stub(),
            json:sinon.stub(),
            status:sinon.stub().returnsThis()
        };
        next=sinon.stub();

    });

    afterEach(()=>{
        sinon.restore();
    });

    it('return 200 if search successfull', async()=>{
        req.header.withArgs('Authorization').returns('Bearer validToken');
        mockAxios.post.resolves({ data: { user: { userId: '123' } } });
        mockSearchUserDB.resolves({username: "user123",firstname:"Bob",lastname:"Bobovic"});
        await searchUserTest(req,res,next);
        expect(res.status.calledWith(200)).to.be.true;
        
    });


    it('return UnauthorizedError',async()=>{
        mockAxios.post.resolves(null);
        await searchUserTest(req,res,next);
        const error=next.firstCall.args[0];
        expect(error).to.be.instanceOf(UnauthorizedError);
    });


    it('return Bad request', async()=>{
        req.header.withArgs('Authorization').returns('Bearer validToken');
        mockAxios.post.resolves({ data: { user: { userId: '123' } } });
        req.params.searchString="";
        await searchUserTest(req,res,next);
        const error=next.firstCall.args[0];
        expect(error).to.be.instanceOf(BadRequestError);
    })

    it('return Bad request', async()=>{
        req.header.withArgs('Authorization').returns(null);
        await searchUserTest(req,res,next);
        const error=next.firstCall.args[0];
        expect(error).to.be.instanceOf(UnauthorizedError);
    })

});