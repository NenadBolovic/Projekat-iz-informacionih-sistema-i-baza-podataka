import {expect} from 'chai';
import sinon from 'sinon';
import {moveQuestion} from '../controllers/questionscontroller.js';
import {UnauthorizedError,ForbiddenError,BadRequestError,InternalServerError,NotFoundError} from '../errors.js'

describe('moveQuestion',()=>{
    let req,res,next;
    let mockAxios,mockMoveQuestionUp,mockMoveQuestionDown,moveQuestionTest,mockGetFormById;

    beforeEach(async ()=>{
        req={
            header: sinon.stub(),
            body: {
                "formId" : "6796aed9a5567a1c07977eea",
                "questionId": 2,
                "direction": 1
            },
        }
        res = {status: sinon.stub().returnsThis(),
                json: sinon.stub(),
                send: sinon.stub(), 
        };
        next=sinon.stub();
        mockAxios={post:sinon.stub(),get:sinon.stub()};
        mockMoveQuestionUp=sinon.stub();
        mockMoveQuestionDown=sinon.stub();
        mockGetFormById=sinon.stub();
        moveQuestionTest=await moveQuestion({axiosInstance:mockAxios,moveQuestionDown:mockMoveQuestionDown,moveQuestionUp:mockMoveQuestionUp,getFormByIdDB:mockGetFormById});
    });

    afterEach(()=>{
        sinon.restore();
    })

    
    it('should return 401 if no token is provided', async () => {
        req.header.withArgs('Authorization').returns(undefined); 
        await moveQuestionTest(req, res,next);
        expect(next.firstCall.args[0]).to.be.instanceof(UnauthorizedError);
    });


    it('should return 401 if token is invalid', async () => {
        req.header.withArgs('Authorization').returns(' faketoken');
        mockAxios.post.resolves({ data: { user: null } });
        mockGetFormById.resolves({authId: 1})
        moveQuestionTest = await moveQuestion({
            axiosInstance: mockAxios,
            moveQuestionDown: mockMoveQuestionDown,
            moveQuestionUp: mockMoveQuestionUp,
            getFormByIdDB: mockGetFormById
        });

        await moveQuestionTest(req, res,next);
        expect(next.firstCall.args[0]).to.be.instanceof(UnauthorizedError);
    });


    it('should return 403 if user is not authId nor collaborator', async () => {
        req.header.withArgs('Authorization').returns('Bearer valid-token');

        mockAxios.post.resolves({ data: { user: { userId: '1' } } });
        mockGetFormById.resolves({
            authId: '0',
            collaborators: [] 
        });

        moveQuestionTest = await moveQuestion({
            axiosInstance: mockAxios,
            moveQuestionDown: mockMoveQuestionDown,
            moveQuestionUp: mockMoveQuestionUp,
            getFormByIdDB: mockGetFormById 
        });

        await moveQuestionTest(req, res, next);
        expect(next.firstCall.args[0]).to.be.instanceof(ForbiddenError);
    });


    it('should return 200 if question moved 2', async()=>{
        req.header.withArgs('Authorization').returns('Bearer valid-token');

        mockAxios.post.resolves({ data: { user: { userId: '1' } } });
        mockGetFormById.resolves({
            authId: '1',
            collaborators: [] 
        });
        mockMoveQuestionDown.resolves(1);
        moveQuestionTest = await moveQuestion({
            axiosInstance: mockAxios,
            moveQuestionDown: mockMoveQuestionDown,
            moveQuestionUp: mockMoveQuestionUp,
            getFormByIdDB: mockGetFormById 
        });
        await moveQuestionTest(req,res,next);
        expect(res.status.calledOnceWith(200)).to.be.true;
        expect(res.json.calledOnceWith({
            success: true,
            message: "Questions moved"
        }))
    });
})



