import {expect} from 'chai';
import sinon from 'sinon';
import {sendUsersAnswers} from '../controllers/answercontroller.js';
import { UnauthorizedError,BadRequestError,ForbiddenError,InternalServerError} from '../errors.js';

describe('Send answers of form',()=>{
    let req,res,next;
    let mockAxios, mockAddUserAnswers,addUserAnswersTest;

    beforeEach(async ()=>{
        req={
            header: sinon.stub(),
            body: {answerData:{
                formId: "67bf9970bd9b7eddc7df039e",
                answers: [
                  {
                    "questionId": 0,
                    "questionType": "short-text",
                    "answer": "John Doe"
                  },
                  {
                    "questionId": 1,
                    "questionType": "multiple-choice-single",
                    "answer": "Red"
                  }
                ]
            }      
            }
        };
        res={json: sinon.stub(),status: sinon.stub().returnsThis()};
        next=sinon.stub();
        mockAxios={get:sinon.stub(),post:sinon.stub()};
        mockAddUserAnswers=sinon.stub();
        addUserAnswersTest=await sendUsersAnswers({axios: mockAxios,addUserAnswers: mockAddUserAnswers});
        sinon.stub(console, 'error');
    });

    afterEach(()=>{
        sinon.restore();
    });

    it('User can not get form.', async()=>{
        req.header.returns(null);
        mockAxios.get.resolves(null);
        await addUserAnswersTest(req, res, next);
        expect(next.firstCall.args[0]).to.be.instanceOf(UnauthorizedError);
    });

    
    it('form indicator not given', async()=>{
        mockAxios.get.resolves({data:{
            "success": true,
            "form": {
                "_id": "67bf9970bd9b7eddc7df039e",
                "name": "LALALAND4",
                "description": "This is a sample form description.",
                "indicator": null,
                "locked": 0,
                "authId": 1,
                "collaborators": [],
                "observers": [],
                "createdAt": "2025-02-26T22:45:04.350Z",
                "updatedAt": "2025-02-26T22:45:04.350Z",
                "__v": 0,
                "questions": [
                    {
                        "numericAttributes": {
                            "min": null,
                            "max": null,
                            "step": 1
                        },
                        "_id": "67bf9970bd9b7eddc7df03a2",
                        "formId": "67bf9970bd9b7eddc7df039e",
                        "questionId": 0,
                        "questionText": "Sta radi luka",
                        "questionType": "short-text",
                        "required": true,
                        "options": [],
                        "questionImage": "/usr/src/app/uploads/1740609904202-354947153-apple.jpg",
                        "__v": 0,
                        "createdAt": "2025-02-26T22:45:04.434Z",
                        "updatedAt": "2025-02-26T22:45:04.434Z"
                    },
                    {
                        "numericAttributes": {
                            "min": null,
                            "max": null,
                            "step": 1
                        },
                        "_id": "67bf9970bd9b7eddc7df03a3",
                        "formId": "67bf9970bd9b7eddc7df039e",
                        "questionId": 1,
                        "questionText": "Select your favorite color.",
                        "questionType": "multiple-choice-single",
                        "required": true,
                        "options": [
                            {
                                "text": "Red"
                            },
                            {
                                "text": "Blue"
                            }
                        ],
                        "questionImage": "/usr/src/app/uploads/1740609904203-547314768-banana.jpg",
                        "__v": 0,
                        "createdAt": "2025-02-26T22:45:04.435Z",
                        "updatedAt": "2025-02-26T22:45:04.435Z"
                    }
                ]
            }
        }});
        await addUserAnswersTest(req, res, next);
        expect(next.firstCall.args[0]).to.be.instanceOf(BadRequestError);
    });

    it('form is locked', async()=>{
        mockAxios.get.resolves({data:{
            "success": true,
            "form": {
                "_id": "67bf9970bd9b7eddc7df039e",
                "name": "LALALAND4",
                "description": "This is a sample form description.",
                "indicator": 0,
                "locked": 1,
                "authId": 1,
                "collaborators": [],
                "observers": [],
                "createdAt": "2025-02-26T22:45:04.350Z",
                "updatedAt": "2025-02-26T22:45:04.350Z",
                "__v": 0,
                "questions": [
                    {
                        "numericAttributes": {
                            "min": null,
                            "max": null,
                            "step": 1
                        },
                        "_id": "67bf9970bd9b7eddc7df03a2",
                        "formId": "67bf9970bd9b7eddc7df039e",
                        "questionId": 0,
                        "questionText": "Sta radi luka",
                        "questionType": "short-text",
                        "required": true,
                        "options": [],
                        "questionImage": "/usr/src/app/uploads/1740609904202-354947153-apple.jpg",
                        "__v": 0,
                        "createdAt": "2025-02-26T22:45:04.434Z",
                        "updatedAt": "2025-02-26T22:45:04.434Z"
                    },
                    {
                        "numericAttributes": {
                            "min": null,
                            "max": null,
                            "step": 1
                        },
                        "_id": "67bf9970bd9b7eddc7df03a3",
                        "formId": "67bf9970bd9b7eddc7df039e",
                        "questionId": 1,
                        "questionText": "Select your favorite color.",
                        "questionType": "multiple-choice-single",
                        "required": true,
                        "options": [
                            {
                                "text": "Red"
                            },
                            {
                                "text": "Blue"
                            }
                        ],
                        "questionImage": "/usr/src/app/uploads/1740609904203-547314768-banana.jpg",
                        "__v": 0,
                        "createdAt": "2025-02-26T22:45:04.435Z",
                        "updatedAt": "2025-02-26T22:45:04.435Z"
                    }
                ]
            }
        }});
        await addUserAnswersTest(req, res, next);
        expect(next.firstCall.args[0]).to.be.instanceOf(ForbiddenError);
    });

    it('form indicator is 1 but user is not logged in', async()=>{
        mockAxios.get.resolves({data:{
            "success": true,
            "form": {
                "_id": "67bf9970bd9b7eddc7df039e",
                "name": "LALALAND4",
                "description": "This is a sample form description.",
                "indicator": 1,
                "locked": 0,
                "authId": 1,
                "collaborators": [],
                "observers": [],
                "createdAt": "2025-02-26T22:45:04.350Z",
                "updatedAt": "2025-02-26T22:45:04.350Z",
                "__v": 0,
                "questions": [
                    {
                        "numericAttributes": {
                            "min": null,
                            "max": null,
                            "step": 1
                        },
                        "_id": "67bf9970bd9b7eddc7df03a2",
                        "formId": "67bf9970bd9b7eddc7df039e",
                        "questionId": 0,
                        "questionText": "Sta radi luka",
                        "questionType": "short-text",
                        "required": true,
                        "options": [],
                        "questionImage": "/usr/src/app/uploads/1740609904202-354947153-apple.jpg",
                        "__v": 0,
                        "createdAt": "2025-02-26T22:45:04.434Z",
                        "updatedAt": "2025-02-26T22:45:04.434Z"
                    },
                    {
                        "numericAttributes": {
                            "min": null,
                            "max": null,
                            "step": 1
                        },
                        "_id": "67bf9970bd9b7eddc7df03a3",
                        "formId": "67bf9970bd9b7eddc7df039e",
                        "questionId": 1,
                        "questionText": "Select your favorite color.",
                        "questionType": "multiple-choice-single",
                        "required": true,
                        "options": [
                            {
                                "text": "Red"
                            },
                            {
                                "text": "Blue"
                            }
                        ],
                        "questionImage": "/usr/src/app/uploads/1740609904203-547314768-banana.jpg",
                        "__v": 0,
                        "createdAt": "2025-02-26T22:45:04.435Z",
                        "updatedAt": "2025-02-26T22:45:04.435Z"
                    }
                ]
            }
        }});
        mockAxios.post.resolves({data:{user:{userId:null}}});
        await addUserAnswersTest(req, res, next);
        expect(next.firstCall.args[0]).to.be.instanceOf(ForbiddenError);
    });
    
    it('User send answers sucessfuly', async()=>{
        req.header.returns('validToken');
        mockAxios.get.resolves({data:{
            "success": true,
            "form": {
                "_id": "67bf9970bd9b7eddc7df039e",
                "name": "LALALAND4",
                "description": "This is a sample form description.",
                "indicator": 1,
                "locked": 0,
                "authId": 1,
                "collaborators": [],
                "observers": [],
                "createdAt": "2025-02-26T22:45:04.350Z",
                "updatedAt": "2025-02-26T22:45:04.350Z",
                "__v": 0,
                "questions": [
                    {
                        "numericAttributes": {
                            "min": null,
                            "max": null,
                            "step": 1
                        },
                        "_id": "67bf9970bd9b7eddc7df03a2",
                        "formId": "67bf9970bd9b7eddc7df039e",
                        "questionId": 0,
                        "questionText": "Sta radi luka",
                        "questionType": "short-text",
                        "required": true,
                        "options": [],
                        "questionImage": "/usr/src/app/uploads/1740609904202-354947153-apple.jpg",
                        "__v": 0,
                        "createdAt": "2025-02-26T22:45:04.434Z",
                        "updatedAt": "2025-02-26T22:45:04.434Z"
                    },
                    {
                        "numericAttributes": {
                            "min": null,
                            "max": null,
                            "step": 1
                        },
                        "_id": "67bf9970bd9b7eddc7df03a3",
                        "formId": "67bf9970bd9b7eddc7df039e",
                        "questionId": 1,
                        "questionText": "Select your favorite color.",
                        "questionType": "multiple-choice-single",
                        "required": true,
                        "options": [
                            {
                                "text": "Red"
                            },
                            {
                                "text": "Blue"
                            }
                        ],
                        "questionImage": "/usr/src/app/uploads/1740609904203-547314768-banana.jpg",
                        "__v": 0,
                        "createdAt": "2025-02-26T22:45:04.435Z",
                        "updatedAt": "2025-02-26T22:45:04.435Z"
                    }
                ]
            }
        }});
        mockAxios.post.resolves({data:{user:{userId:1}}});
        mockAddUserAnswers.resolves({
            "insertedCount": 2,
            "answers": [
                {
                    "userId": 1,
                    "formId": "67d55643a7411e540b46be76",
                    "questionId": 0,
                    "questionType": "short-text",
                    "required": true,
                    "answer": "John Doe",
                    "answerImage": "/usr/src/app/uploads/1742038546318-815958456-questionmark.png",
                    "_id": "67d56612a6dca56b4b82f561",
                    "__v": 0,
                    "createdAt": "2025-03-15T11:35:46.950Z",
                    "updatedAt": "2025-03-15T11:35:46.950Z"
                },
                {
                    "userId": 1,
                    "formId": "67d55643a7411e540b46be76",
                    "questionId": 1,
                    "questionType": "multiple-choice-single",
                    "required": true,
                    "answer": "Red",
                    "answerImage": null,
                    "_id": "67d56612a6dca56b4b82f562",
                    "__v": 0,
                    "createdAt": "2025-03-15T11:35:46.951Z",
                    "updatedAt": "2025-03-15T11:35:46.951Z"
                }
            ]
        });
        await addUserAnswersTest(req, res, next);
        expect(res.status.calledWith(201)).to.be.true;
    });
    
    it('User send answers sucessfuly', async()=>{
        req.header.returns('validToken');
        mockAxios.get.resolves({data:{
            "success": true,
            "form": {
                "_id": "67bf9970bd9b7eddc7df039e",
                "name": "LALALAND4",
                "description": "This is a sample form description.",
                "indicator": 1,
                "locked": 0,
                "authId": 1,
                "collaborators": [],
                "observers": [],
                "createdAt": "2025-02-26T22:45:04.350Z",
                "updatedAt": "2025-02-26T22:45:04.350Z",
                "__v": 0,
                "questions": [
                    {
                        "numericAttributes": {
                            "min": null,
                            "max": null,
                            "step": 1
                        },
                        "_id": "67bf9970bd9b7eddc7df03a2",
                        "formId": "67bf9970bd9b7eddc7df039e",
                        "questionId": 0,
                        "questionText": "Sta radi luka",
                        "questionType": "short-text",
                        "required": true,
                        "options": [],
                        "questionImage": "/usr/src/app/uploads/1740609904202-354947153-apple.jpg",
                        "__v": 0,
                        "createdAt": "2025-02-26T22:45:04.434Z",
                        "updatedAt": "2025-02-26T22:45:04.434Z"
                    },
                    {
                        "numericAttributes": {
                            "min": null,
                            "max": null,
                            "step": 1
                        },
                        "_id": "67bf9970bd9b7eddc7df03a3",
                        "formId": "67bf9970bd9b7eddc7df039e",
                        "questionId": 1,
                        "questionText": "Select your favorite color.",
                        "questionType": "multiple-choice-single",
                        "required": true,
                        "options": [
                            {
                                "text": "Red"
                            },
                            {
                                "text": "Blue"
                            }
                        ],
                        "questionImage": "/usr/src/app/uploads/1740609904203-547314768-banana.jpg",
                        "__v": 0,
                        "createdAt": "2025-02-26T22:45:04.435Z",
                        "updatedAt": "2025-02-26T22:45:04.435Z"
                    }
                ]
            }
        }});
        mockAxios.post.resolves({data:{user:{userId:1}}});
        mockAddUserAnswers.rejects(new InternalServerError('Database error occurred'));
        await addUserAnswersTest(req, res, next);
        expect(next.firstCall.args[0]).to.be.instanceof(InternalServerError);
    });

    it('Not logged in user form indicator is 0 send answers sucessfuly', async()=>{
        mockAxios.get.resolves({data:{
            "success": true,
            "form": {
                "_id": "67bf9970bd9b7eddc7df039e",
                "name": "LALALAND4",
                "description": "This is a sample form description.",
                "indicator": 0,
                "locked": 0,
                "authId": 1,
                "collaborators": [],
                "observers": [],
                "createdAt": "2025-02-26T22:45:04.350Z",
                "updatedAt": "2025-02-26T22:45:04.350Z",
                "__v": 0,
                "questions": [
                    {
                        "numericAttributes": {
                            "min": null,
                            "max": null,
                            "step": 1
                        },
                        "_id": "67bf9970bd9b7eddc7df03a2",
                        "formId": "67bf9970bd9b7eddc7df039e",
                        "questionId": 0,
                        "questionText": "Sta radi luka",
                        "questionType": "short-text",
                        "required": true,
                        "options": [],
                        "questionImage": "/usr/src/app/uploads/1740609904202-354947153-apple.jpg",
                        "__v": 0,
                        "createdAt": "2025-02-26T22:45:04.434Z",
                        "updatedAt": "2025-02-26T22:45:04.434Z"
                    },
                    {
                        "numericAttributes": {
                            "min": null,
                            "max": null,
                            "step": 1
                        },
                        "_id": "67bf9970bd9b7eddc7df03a3",
                        "formId": "67bf9970bd9b7eddc7df039e",
                        "questionId": 1,
                        "questionText": "Select your favorite color.",
                        "questionType": "multiple-choice-single",
                        "required": true,
                        "options": [
                            {
                                "text": "Red"
                            },
                            {
                                "text": "Blue"
                            }
                        ],
                        "questionImage": "/usr/src/app/uploads/1740609904203-547314768-banana.jpg",
                        "__v": 0,
                        "createdAt": "2025-02-26T22:45:04.435Z",
                        "updatedAt": "2025-02-26T22:45:04.435Z"
                    }
                ]
            }
        }});
        await addUserAnswersTest(req, res, next);
        expect(res.status.calledWith(201)).to.be.true;
    });
    
    
});


