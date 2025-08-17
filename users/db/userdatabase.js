import mysql from 'mysql2';
import dotenv from 'dotenv';

dotenv.config();

const pool=mysql.createPool({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
}).promise();

export async function getUsers(){
    const [rows]=await pool.query("select * from users");
    return rows;
}

export async function getUser(id){
    const [rows]=await pool.query(`select * from users where userId= ?`, [id]);
    return rows[0];
}

export async function checkUser(username) {
    const [rows] = await pool.query(`SELECT * FROM users WHERE username = ?`, [username]);
    return rows.length > 0 ? rows[0] : null;
}


export async function createUser(firstname, lastname, username,password,email){
    try{
        const result=await pool.query(
            `insert into users (firstname,lastname,username,password,email) values (?,?,?,?,?)`,
            [firstname,lastname,username,password,email]);
        const id=result[0].insertId;
        return getUser(id);
    }catch(error){
        console.error("Error creating user ", error);
        throw error;
    }
}

export async function isUserUnique(username, email) {
    const [rows] = await pool.query(`SELECT * FROM users WHERE username = ? OR email = ?`, [username, email]);
    return rows.length === 0;
}


export async function changePasswordDB(userId,newPasswordHashed){
    try{
        const [rows]= await pool.query(`UPDATE users SET password=? where userId=?`,[newPasswordHashed,userId]);
        return getUser(userId);
    }catch(error){
        console.error("Error changing password",error );
        throw error;
    }
}

export async function getUserPassword(userId){
    try{
        const [rows]=await pool.query(`select password from users where userId = ?`,[userId]);
        if(rows.length===0){
            throw new Error('User not found');
        }
        return rows[0].password;
    }catch(error){
        console.error("Error getting user's paswrod",error);
        throw error;
    }
}

export async function searchUserDB(searchString){
    try{
        const formatted=`%${searchString}%`;
        const[rows]=await pool.query(`select userId,username,firstname,lastname from users where 
            username like ? or firstname like ? or lastname like ?`,
            [formatted,formatted,formatted]);
        return rows;
    }catch(error){
        console.error("Database: Error in searching user", error);
        throw error;
    }
}

export async function deleteUserDB(userId){
    try{
        const[rows]=await pool.query(`delete from users where userId=?`,[userId]);
        return rows;
    }catch(error){
        console.error("Database: Error in deleting user ", error);
        throw error;
    }
}