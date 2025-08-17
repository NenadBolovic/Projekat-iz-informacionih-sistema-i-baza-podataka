import { expect } from 'chai';
import sinon from 'sinon';
import { createAddUser } from '../controllers/usercontroller.js';
import { BadRequestError } from '../errors.js';

describe('createAddUser', () => {
    let isUserUniqueStub, createUserStub, addUser;
    let req, res, next;

    beforeEach(() => {
        isUserUniqueStub = sinon.stub();
        createUserStub = sinon.stub();
        addUser = createAddUser({ isUserUnique: isUserUniqueStub, createUser: createUserStub });

        req = {
            body: {
                firstname: 'Bob',
                lastname: 'Bobic',
                username: 'bobbobic',
                password: 'password123',
                email: 'bob@gmail.com',
            },
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

    it('should return 201 when user is successfully registered', async () => {
        isUserUniqueStub.resolves(true);
        createUserStub.resolves({ id: 1, username: 'bobbobic' });
        await addUser(req, res, next);
        expect(createUserStub.called).to.be.true;
        expect(res.status.calledWith(201)).to.be.true;
        expect(res.json.calledWithMatch({ success: true, message: "User registered successfully" })).to.be.true;
    });

    it('should return 400 when required fields are missing', async () => {
        req.body.password = '';
        await addUser(req, res, next);
        expect(next.calledOnce).to.be.true;
        expect(next.args[0][0]).to.be.instanceOf(BadRequestError);
        expect(next.args[0][0].message).to.equal("All fields are required");
    });

    it('should return 400 when username or email already exists', async () => {
        isUserUniqueStub.resolves(false);
        await addUser(req, res, next);
        expect(next.calledOnce).to.be.true;
        console.log(next.args);
        expect(next.args[0][0]).to.be.instanceOf(BadRequestError);
        expect(next.args[0][0].message).to.equal("Username or email already exists");
    });

    it('should return 500 when there is an unexpected error', async () => {
        isUserUniqueStub.rejects(new Error("Database error"));
        await addUser(req, res, next);
        expect(next.calledOnce).to.be.true;
        expect(next.args[0][0]).to.be.instanceOf(Error);
        expect(next.args[0][0].message).to.equal("Database error");
    });
});
