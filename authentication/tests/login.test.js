import { expect } from 'chai';
import sinon from 'sinon';
import { login } from '../controllers/authenticationcontroller.js';

describe('Login Function', () => {
    let req, res, next;
    let mockAxios,mockJwt,loginTest;


    beforeEach(async () => {
        req = {
            body: {
                username: 'testUser',
                password: 'testPassword'
            }
        };
        res = {
            status: sinon.stub().returnsThis(),
            json: sinon.stub(),
            send: sinon.stub(),
        };
        next = sinon.stub();
        mockAxios={post: sinon.stub()};
        mockJwt={sign: sinon.stub()};
        loginTest=await login({axios:mockAxios,jsonWebToken:mockJwt});
    });

    afterEach(() => {
        sinon.restore();
    });

    it('should return 200 and a token on successful login', async () => {
        const mockResponse = { data: { userId: 1, username: 'testUser' } };
        mockAxios.post.resolves(mockResponse);
        mockJwt.sign.returns('mockedToken');
        await loginTest(req, res, next);
        expect(res.status.calledWith(200)).to.be.true;
        expect(res.json.calledWithMatch({ success: true, token: 'mockedToken' })).to.be.true;
    });

    it('should return the correct error response when the user service returns an error', async () => {
        const errorResponse = { response: { status: 401, data: { error: 'Invalid credentials' } } };
        mockAxios.post.rejects(errorResponse);
        await loginTest(req, res, next);
        expect(res.status.calledWith(401)).to.be.true;
        expect(res.send.calledWith({ error: 'Invalid credentials' })).to.be.true;
    });

    it('should call next with an error if an unexpected error occurs', async () => {
        const unexpectedError = new Error('Unexpected error');
        mockAxios.post.rejects(unexpectedError);
        await loginTest(req, res, next);
        expect(next.calledWith(unexpectedError)).to.be.true;
    });

});

