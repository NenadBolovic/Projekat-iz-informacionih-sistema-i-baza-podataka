import { expect } from 'chai';
import sinon from 'sinon';
import { UnauthorizedError, TokenExpiredError, InvalidCredentialsError } from '../errors.js';
import { validateToken } from '../controllers/authenticationcontroller.js';

describe('validateToken', () => {
    let req, res, next;
    let mockJwt,validateTokenTest;

    beforeEach(async () => {
        req = {
            header: sinon.stub(),
        };
        res = {
            status: sinon.stub().returnsThis(),
            send: sinon.stub(),
        };
        next = sinon.stub();
        mockJwt={verify:sinon.stub()};
        validateTokenTest = await validateToken({jsonWebToken:mockJwt});
    });

    afterEach(() => {
        sinon.restore();
    });

    it('should return 200 if the token is valid', async () => {
        const decodedUser = { userId: 1, username: 'testUser' };
        req.header.withArgs('Authorization').returns('Bearer validToken');
        mockJwt.verify.returns(decodedUser);
        await validateTokenTest(req, res, next);
        expect(res.status.calledWith(200)).to.be.true;
        expect(res.send.calledWith({ success: true, user: decodedUser })).to.be.true;
    });

    it('should call next with UnauthorizedError if no token is provided', async () => {
        req.header.withArgs('Authorization').returns(null); 
        await validateTokenTest(req, res, next);
        expect(next.calledOnce).to.be.true;
        expect(next.calledWith(sinon.match.instanceOf(UnauthorizedError))).to.be.true;
    });

    it('should call next with TokenExpiredError if token is expired', async () => {
        req.header.withArgs('Authorization').returns('Bearer expiredToken');
        mockJwt.verify.throws({ name: 'TokenExpiredError' });
        await validateTokenTest(req, res, next);
        expect(next.calledOnce).to.be.true;
        expect(next.calledWith(sinon.match.instanceOf(TokenExpiredError))).to.be.true;
    });

    it('should call next with InvalidCredentialsError if token is invalid', async () => {
        req.header.withArgs('Authorization').returns('Bearer invalidToken');
        mockJwt.verify.throws(new Error());
        await validateTokenTest(req, res, next);
        expect(next.calledOnce).to.be.true;
        expect(next.calledWith(sinon.match.instanceOf(InvalidCredentialsError))).to.be.true;
    });
});
