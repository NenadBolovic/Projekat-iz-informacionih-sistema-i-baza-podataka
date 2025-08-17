import { expect } from 'chai';
import sinon from 'sinon';
import { deleteUser} from '../controllers/usercontroller.js';
import { NotFoundError, UnauthorizedError } from '../errors.js';

describe('deleteUser', () => {
    let mockAxiosInstance, mockDeleteUserDB, deleteUserTest;
    let req, res, next;

    beforeEach(async () => {
        mockAxiosInstance={post: sinon.stub()};
        mockDeleteUserDB = sinon.stub();
        deleteUserTest = await deleteUser({ axiosInstance: mockAxiosInstance, deleteUserDB: mockDeleteUserDB });

        req={
            header: sinon.stub(),
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

    it('return UnauthorizedError',async()=>{
        mockAxiosInstance.post.resolves(null);
        await deleteUserTest(req,res,next);
        const error=next.firstCall.args[0];
        expect(error).to.be.instanceOf(UnauthorizedError);
    });

    it('return UnauthorizedError',async()=>{
        mockAxiosInstance.post.resolves({response:{data:null}});
        await deleteUserTest(req,res,next);
        const error=next.firstCall.args[0];
        expect(error).to.be.instanceOf(UnauthorizedError);
    });

    it('return NotFoundError',async()=>{
        req.header.withArgs('Authorization').returns('Bearer validToken');
        mockAxiosInstance.post.resolves({data:{user:{userId:1}}});
        mockDeleteUserDB.resolves({affectedRows: 0});
        await deleteUserTest(req,res,next);
        const error=next.firstCall.args[0];
        expect(error).to.be.instanceOf(NotFoundError);
    });

    it('success status 200',async()=>{
        req.header.withArgs('Authorization').returns('Bearer validToken');
        mockAxiosInstance.post.resolves({data:{user:{userId:1}}});
        mockDeleteUserDB.resolves({affectedRows: 1});
        await deleteUserTest(req,res,next);
        expect(res.status.calledWith(200)).to.be.true;
    });
});
