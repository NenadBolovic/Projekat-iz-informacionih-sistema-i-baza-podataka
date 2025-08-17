import { InvalidCredentialsError, TokenExpiredError, UnauthorizedError } from '../errors.js';
import dotenv from 'dotenv';
dotenv.config();

const USERS_SERVICE_URL=process.env.USERS_SERVICE_URL;


export async function validateToken ({jsonWebToken}){
    return async(req,res,next)=>{
        try {
            const token = req.header('Authorization')?.replace('Bearer ', '');
            if (!token) {
                return next(new UnauthorizedError());
            }
            const decoded = jsonWebToken.verify(token, process.env.JWT_SECRET);
            res.status(200).send({ success: true, user: decoded });
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                return next(new TokenExpiredError());
            }
            return next(new InvalidCredentialsError());
        }
    }
};


export async function login({axios,jsonWebToken}){
    return async(req,res,next)=>{
        try {
            const { username, password } = req.body;
            const response = await axios.post(`${USERS_SERVICE_URL}/login`, { username, password });
            const { userId, username: validUsername } = response.data;
            const token = jsonWebToken.sign({ userId, username: validUsername }, process.env.JWT_SECRET, { expiresIn: '4h' });

            res.status(200).json({ success: true, token });
        } catch (error) {
            if (error.response) {
                return res.status(error.response.status).send(error.response.data);
            }
            return next(error);
        }
    }
};


export async function register({axios}){
    return async(req,res,next)=>{
        try {
            const response = await axios.post(`${USERS_SERVICE_URL}/register`, req.body);
            res.status(response.status).send(response.data);
        } catch (error) {
            if (error.response) {
                return res.status(error.response.status).send(error.response.data);
            }
            return next(error);
        }
    }
};

