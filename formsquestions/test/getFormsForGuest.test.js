import {expect} from 'chai';
import sinon from 'sinon';
import { getFormsForGuest } from '../controllers/formscontroller.js';
import {UnauthorizedError,ForbiddenError,BadRequestError,InternalServerError,NotFoundError} from '../errors.js'

describe('get forms for guest',()=>{
    let req,res,next;
    let mockTest,mockGetFormsForGuestDB;

    beforeEach(async ()=>{
        req={
            header: sinon.stub(),
            
        }
        res = {status: sinon.stub().returnsThis(),
                json: sinon.stub(),
                send: sinon.stub(), 
        };
        next=sinon.stub();
        mockGetFormsForGuestDB=sinon.stub();
        mockTest=await getFormsForGuest({getFormsForGuestDB: mockGetFormsForGuestDB});
    });

    afterEach(()=>{
        sinon.restore();
    })

    it('return 200', async () => {
        const fakeForms = [{ id: 1, name: 'Test Form' }];
        mockGetFormsForGuestDB.resolves(fakeForms);
        await mockTest(req, res, next);
        expect(mockGetFormsForGuestDB.calledOnce).to.be.true;
        expect(res.status.calledWith(200)).to.be.true;
        expect(res.json.calledWith({ success: true, forms: fakeForms })).to.be.true;
        expect(next.notCalled).to.be.true;
    });

    it('should call next with error when getFormsForGuestDB throws', async () => {
        const error = new Error('Database error');
        mockGetFormsForGuestDB.rejects(error);
        await mockTest(req, res, next);
        expect(mockGetFormsForGuestDB.calledOnce).to.be.true;
        expect(res.status.notCalled).to.be.true;
        expect(res.json.notCalled).to.be.true;
        expect(next.calledOnceWith(error)).to.be.true;
    });
   
})

