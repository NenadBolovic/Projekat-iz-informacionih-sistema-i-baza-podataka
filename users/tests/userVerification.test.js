import { expect } from 'chai';
import sinon from 'sinon';
import argon2, { hash } from 'argon2';
import { userVerification } from '../controllers/usercontroller.js';
import { UnauthorizedError, BadRequestError } from '../errors.js';

describe('userVerification',()=>{
    let req,res,next;
    let mockCheckUser,userVerificationTest;

    beforeEach(()=>{
        mockCheckUser=sinon.stub();
        userVerificationTest=userVerification({checkUser:mockCheckUser});

        req={
            body: {
                username: 'bob',
                password: 'bob123',
            }
        };

        res={
            status: sinon.stub().returnsThis(),
            json: sinon.stub(),
        }
        
        next=sinon.stub();
    });

    afterEach(()=>{
        sinon.restore();
    });

    it('should return 200 when user is verified', async()=>{
        const hashedPassword=await argon2.hash(req.body.password);
        mockCheckUser.resolves({username: "bob",password: hashedPassword });
        const verifyStub = sinon.stub(argon2, 'verify').resolves(true);
        await userVerificationTest(req,res,next);
        expect(verifyStub.calledOnce).to.be.true;
        expect(res.status.calledWith(200)).to.be.true;
    });

    it('should throw UnauthorizedError', async()=>{
        mockCheckUser.resolves(null);
        await userVerificationTest(req,res,next);
        const error=next.firstCall.args[0];
        expect(error).to.be.instanceOf(UnauthorizedError);
    });

    it('should throw UnauthorizedError when password is incorrect', async () => {
        const hashedPassword = await argon2.hash('wrongPassword'); 
        mockCheckUser.resolves({ username: "bob", password: hashedPassword });
        const verifyStub = sinon.stub(argon2, 'verify').resolves(false); 
        await userVerificationTest(req, res, next);
        const error = next.firstCall.args[0];
        expect(error).to.be.instanceOf(UnauthorizedError);
        verifyStub.restore();
    });
    
})