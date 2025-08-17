import express from 'express';
import { fetchAllUsers,fetchUserById,createAddUser,userVerification,changePassword,searchUser,deleteUser} from '../controllers/usercontroller.js';
import {getUser,createUser,isUserUnique,checkUser,changePasswordDB,getUserPassword,searchUserDB,deleteUserDB} from '../db/userdatabase.js';
import axios from 'axios';


const router=express.Router();

const getUserHandler=await fetchUserById({getUser});
const addUser = createAddUser({ isUserUnique, createUser });
const verifyUser=userVerification({checkUser});
const changeCredentials=changePassword({axiosInstance:axios,changePasswordDB,getUserPassword});
const searchUserHandler=await searchUser({
    axiosInstance: axios,
    searchUserDB,
});
const deleteUserHandler=await deleteUser({
    axiosInstance: axios,
    deleteUserDB
})

router.get("/",fetchAllUsers);
router.get("/:id",getUserHandler);
router.get("/search/:searchString",searchUserHandler);
router.post("/register",addUser);
router.post("/login",verifyUser);
router.patch("/",changeCredentials);
router.delete("/delete",deleteUserHandler);

export default router;