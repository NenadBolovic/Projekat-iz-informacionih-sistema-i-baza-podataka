import express from 'express';
import { validateToken, login, register } from '../controllers/authenticationcontroller.js';
import axios from 'axios';
import jwt from 'jsonwebtoken';

const router = express.Router();

const validateTokenHandler=await validateToken({
    jsonWebToken: jwt,
})

const loginHandler=await login({
    axios,
    jsonWebToken: jwt,
})

const registerHandler=await register({
    axios,
})

router.post('/validateToken', validateTokenHandler);
router.post('/login', loginHandler);
router.post('/register', registerHandler);

export default router;
