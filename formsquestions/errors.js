export class BadRequestError extends Error{
    constructor(message="Bad request"){
        super(message);
        this.name="BadRequestError";
        this.statusCode=400;
    }
}

export class UnauthorizedError extends Error{
    constructor(message="Unauthorized"){
        super(message);
        this.name="UnauthorizedError";
        this.statusCode=401;
    }
}

export class ForbiddenError extends Error{
    constructor(message="Forbidden"){
        super(message);
        this.name="ForbiddenError";
        this.statusCode=403;
    }
}

export class NotFoundError extends Error{
    constructor(message='Not Found Error'){
        super(message);
        this.name='NotFoundError';
        this.statusCode=404;
    }
}

export class InternalServerError extends Error{
    constructor(message='Internal Server Error'){
        super(message);
        this.name='InternalServerError';
        this.statusCode=500;
    }
}

