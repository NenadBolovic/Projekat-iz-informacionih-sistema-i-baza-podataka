import { expect } from 'chai';
import sinon from 'sinon';
import axios from 'axios';
import { register } from '../controllers/authenticationcontroller.js';

describe('Register Function', () => {
    let req, res, next;
    let mockAxios,registerTest;

    beforeEach(async() => {
        req = {
            body: {
                username: 'newUser',
                password: 'securePassword'
            }
        };
        res = {
            status: sinon.stub().returnsThis(),
            send: sinon.stub(),
        };
        next = sinon.stub();
        mockAxios={post: sinon.stub()};
        registerTest=await register({axios:mockAxios});
    });

    afterEach(() => {
        sinon.restore();
    });

    it('should return the correct status and data on successful registration', async () => {
        const mockResponse = { status: 201, data: { message: 'User registered successfully' } };
        mockAxios.post.resolves(mockResponse);
        await registerTest(req, res, next);
        expect(res.status.calledWith(201)).to.be.true;
        expect(res.send.calledWith(mockResponse.data)).to.be.true;
    });

    it('should return the correct error response when the user service returns an error', async () => {
        const errorResponse = { response: { status: 400, data: { error: 'Username already taken' } } };
        mockAxios.post.rejects(errorResponse);
        await registerTest(req, res, next);
        expect(res.status.calledWith(400)).to.be.true;
        expect(res.send.calledWith({ error: 'Username already taken' })).to.be.true;
    });

    it('should call next with an error if an unexpected error occurs', async () => {
        const unexpectedError = new Error('Unexpected error');
        mockAxios.post.rejects(unexpectedError);
        await registerTest(req, res, next);
        expect(next.calledWith(unexpectedError)).to.be.true;
    });
});
