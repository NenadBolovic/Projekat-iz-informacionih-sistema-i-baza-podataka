import { expect } from 'chai';
import sinon from 'sinon';
import { fetchUserById } from '../controllers/usercontroller.js';
import {NotFoundError} from '../errors.js';

describe('Get user by ID',()=>{
    let req,res,next,getUserStub,fetchUser;
    beforeEach(async ()=>{
        req={params: {id: '123'}};
        res={json: sinon.stub(),status:sinon.stub()};
        next=sinon.stub();
        getUserStub=sinon.stub();
        fetchUser=await fetchUserById({getUser:getUserStub});
    });
    afterEach(()=>{
        sinon.restore();
    });

    it('user found',async()=>{
        const mockUser={id:'123',username: 'user123'};
        getUserStub.resolves(mockUser);
        await fetchUser(req,res,next);
        expect(res.status.calledWith(200)).to.be.true;
    });

    it('return NotFoundError if user is not found', async()=>{
        getUserStub.resolves(null);
        await fetchUser(req,res,next);
        expect(next.firstCall.args[0]).to.be.instanceof(NotFoundError);
    });

    it('Some errors', async()=>{
        const errorMessage = 'Some error';
        getUserStub.rejects(new Error(errorMessage));
        await fetchUser(req, res, next);
        console.log(next);
        console.log(next.args);
        expect(next.firstCall.args[0]).to.be.instanceof(Error);
        expect(next.args[0][0].message).to.equal(errorMessage);
    })
});