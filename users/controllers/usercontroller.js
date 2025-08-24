import {getUsers,getUser} from '../db/userdatabase.js';
import argon2 from 'argon2';
import {NotFoundError,BadRequestError,UnauthorizedError,ForbiddenError} from '../errors.js';
import dotenv from 'dotenv';


const AUTH_SERVICE_URL=process.env.AUTH_SERVICE_URL;

export async function fetchAllUsers(req,res,next){
    try{
        console.log("TEST");
        const users=await getUsers();
        if(!users.length) throw new NotFoundError("No users found");
        res.send(users);
    }catch(error){
        next(error);
    }
}

export async function fetchUserById({getUser}){
    return async(req,res,next)=>{
        try{
            const id=req.params.id;
            const user=await getUser(id);
            if(!user){
                throw new NotFoundError("User not found");
            }
            res.status(200).json(user);
        }catch(error){
            next(error);
        }
    }
}



export function createAddUser({ isUserUnique, createUser }) {
    return async function addUser(req, res,next) {
      try {
        const { firstname, lastname, username, password, email} = req.body;
  
        if (!firstname || !lastname || !username || !password || !email) {
          throw new BadRequestError("All fields are required");
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if(!emailRegex.test(email)){
            throw new BadRequestError("Form of email is not correct");
        }
        const hashedPassword = await argon2.hash(password);
        const isUnique = await isUserUnique(username,email);
        if (!isUnique) {
          throw new BadRequestError("Username or email already exists");
        }
  
        const user = await createUser(firstname, lastname, username, hashedPassword, email);
        res.status(201).json({ success: true, message: "User registered successfully", user });
      } catch (error) {
        next(error);
      }
    };
  }


export function changePassword({axiosInstance,changePasswordDB,getUserPassword}){
    return async(req,res,next)=>{
        try{
            const token = req.header('Authorization')?.replace('Bearer ', '');
            if (!token) {
                throw new UnauthorizedError("Access denied, no token provided");
            }

            const response = await axiosInstance.post(`${AUTH_SERVICE_URL}/validateToken`, {}, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const userId = response.data.user.userId;
            const {oldPassword, newPassword}=req.body;
            const storedHashedPassword=await getUserPassword(userId);
            const isOldPasswordValid = await argon2.verify(storedHashedPassword, oldPassword);
            if (!isOldPasswordValid) {
                throw new BadRequestError("Old password is incorrect")
            }
            const newPasswordHashed=await argon2.hash(newPassword);
            
            const user=await changePasswordDB(userId,newPasswordHashed);
            res.status(201).json({ success: true, message: "User's password changed", user });
        }catch(error){
            next(error);
        }
    }
}

export function userVerification({checkUser}){
    return async function verifyUser(req, res,next) {
        try {
            const { username, password } = req.body;
            const user = await checkUser(username); 
            if (user && await argon2.verify(user.password, password)) {
                res.status(200).json({
                    success: true,
                    userId: user.userId,
                    username: user.username,
                });
            } else {
                throw new UnauthorizedError("Invalid credentials");
            }
        } catch (error) {
            next(error);
        }
    }
}

export async function searchUser({axiosInstance,searchUserDB}){
    return async(req,res,next)=>{
        try{
            const token = req.header('Authorization')?.replace('Bearer ', '');
            if (!token) {
                throw new UnauthorizedError("Access denied, no token provided")
            }

            const response = await axiosInstance.post(`${AUTH_SERVICE_URL}/validateToken`, {}, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const {searchString}=req.params;
            if (!searchString) {
                throw new BadRequestError("Search string cannot be empty");
            }            
           const users=await searchUserDB(searchString);
           return res.status(200).json({success: true,users});
        }catch(error){
            next(error);
        }
    }
}

export async function deleteUser({axiosInstance,deleteUserDB}){
    return async(req,res,next)=>{
        try{
            const token = req.header('Authorization')?.replace('Bearer ', '');
            if (!token) {
                throw new UnauthorizedError("Access denied, no token provided")
            }

            const response = await axiosInstance.post(`${AUTH_SERVICE_URL}/validateToken`, {}, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if(!response?.data?.user?.userId){
                throw new UnauthorizedError("Access denied, token expired")
            }
            const userId=response.data.user.userId;     
            const deleteInfo=await deleteUserDB(userId);
            
            if (deleteInfo.affectedRows === 0) {
                throw new NotFoundError("User not found.")
            }
            return res.status(200).json({ message: "User deleted successfully", affectedRows: deleteInfo.affectedRows });
        }catch(error){
            next(error);
        }
    }
}





