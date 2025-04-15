import { Router } from 'express';
import User from '../Schemas/User.js';
const router = Router();
import dotenv from 'dotenv';
dotenv.config();
import bcrypt from "bcrypt";
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

//function to generate a token:
function generateAccessToken(payload) {
    return jwt.sign(payload, JWT_SECRET);
}

router.post('/login', async (req, res) => {
    try {
        console.log("hit"); //debug log
        const { username, password } = req.body;
        //validate the inputs:
        if (!username || !password) {
            return res.status(400).json({ message: 'please enter the username and the password' });
        }
        //check if username exists in the database:
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(400).json({ message: 'Username does not exist' });
        }
        const checkPassword = await bcrypt.compare(password, user.password);
        if (!checkPassword) {
            console.log('Incorrect password');
            return res.status(400).json({ message: 'Incorrect password, try again or click forgot your password' });
        }
        const token = generateAccessToken({ 
            id: user._id,
            userType: user.userType 
        });
        console.log('Token generated:', token);
        res.status(200).json({ 
            message: 'Signing in', 
            token,
            userType: user.userType 
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;