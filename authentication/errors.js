export class InvalidCredentialsError extends Error{
    constructor(message="Invalid credentials"){
        super(message);
        this.name="InvalidCredentials";
        this.statusCode=401;
    }
}

export class TokenExpiredError extends Error{
    constructor(message="Token has expired"){
        super(message);
        this.name="TokenExpiredError";
        this.statusCode=401;
    }
}

export class UnauthorizedError extends Error{
    constructor(message="Access denied, no token provided"){
        super(message);
        this.name="UnauthorizedError";
        this.statusCode=403;
    }
}













/*class InvalidCredentialsError extends Error {
    constructor(message = "Invalid credentials") {
        super(message);
        this.name = "InvalidCredentialsError";
        this.statusCode = 401;
    }
}

class TokenExpiredError extends Error {
    constructor(message = "Token has expired") {
        super(message);
        this.name = "TokenExpiredError";
        this.statusCode = 401;
    }
}

class UnauthorizedError extends Error {
    constructor(message = "Access denied, no token provided") {
        super(message);
        this.name = "UnauthorizedError";
        this.statusCode = 403;
    }
}

// Middleware for error handling
const errorHandler = (err, req, res, next) => {
    console.error(`[${err.name}] ${err.message}`);

    if (err.statusCode) {
        res.status(err.statusCode).json({ success: false, message: err.message });
    } else {
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};*/