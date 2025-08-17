import { expect } from 'chai';
import sinon from 'sinon';
import argon2 from 'argon2';
import { changePassword } from '../controllers/usercontroller.js';
import { UnauthorizedError, BadRequestError } from '../errors.js';

describe('changePassword', () => {
    let req, res, next, mockAxios, mockGetUserPassword, mockChangePassword, changePasswordHandler;

    beforeEach(() => {
        mockAxios = { post: sinon.stub() };
        mockGetUserPassword = sinon.stub();
        mockChangePassword = sinon.stub();
        changePasswordHandler = changePassword({
            axiosInstance: mockAxios,
            getUserPassword: mockGetUserPassword,
            changePasswordDB: mockChangePassword,
        });

        req = {
            header: sinon.stub(),
            body: { oldPassword: 'mika13', newPassword: 'sima13' },
        };

        res = {
            status: sinon.stub().returnsThis(),
            json: sinon.stub(),
        };

        next = sinon.stub();
    });

    afterEach(() => {
        sinon.restore();
    });

    it('should return 201 when password is changed', async () => {
        const hashedOldPassword = await argon2.hash(req.body.oldPassword);
        const hashedNewPassword = await argon2.hash(req.body.newPassword);
        req.header.withArgs('Authorization').returns('Bearer validToken');
        mockAxios.post.resolves({ data: { user: { userId: '123' } } });
        mockGetUserPassword.resolves(hashedOldPassword);
        mockChangePassword.resolves({ id: '123', password: hashedNewPassword });
        await changePasswordHandler(req, res, next);

        expect(mockAxios.post.calledOnce).to.be.true;
        expect(mockGetUserPassword.calledWith('123')).to.be.true;
        expect(mockChangePassword.calledWith('123', sinon.match.string)).to.be.true;
        expect(res.status.calledWith(201)).to.be.true;
        expect(res.json.calledWithMatch({ success: true, message: "User's password changed" })).to.be.true;
    });

    it('should return 401 when token is missing', async () => {
        mockAxios.post.resolves(null); 
        await changePasswordHandler(req, res, next);
        expect(next.calledOnce).to.be.true;
        const error = next.firstCall.args[0];
        expect(error).to.be.instanceOf(UnauthorizedError);
        expect(error.message).to.equal("Access denied, no token provided");
    });

    it('should return 400 when old password is incorrect', async () => {
        const hashedOldPassword = await argon2.hash('wrongPassword'); 
        req.header.withArgs('Authorization').returns('Bearer validToken');
        mockAxios.post.resolves({ data: { user: { userId: '123' } } });
        mockGetUserPassword.resolves(hashedOldPassword); 
        await changePasswordHandler(req, res, next);
        console.log(next.firstCall.args[0]);
        expect(next.calledOnce).to.be.true;
        const error = next.firstCall.args[0];
        expect(error).to.be.instanceOf(BadRequestError);
        expect(error.message).to.equal("Old password is incorrect");
    });

    it('should call next(error) if an unexpected error occurs', async () => {
        req.header.withArgs('Authorization').returns('Bearer validToken');
        const unexpectedError = new Error("Unexpected error");
        mockAxios.post.rejects(unexpectedError); 
        await changePasswordHandler(req, res, next);
        expect(next.calledOnce).to.be.true;
        expect(next.firstCall.args[0]).to.equal(unexpectedError);
    });
});
