import { Router } from 'express';
import User from '../Schemas/User.js';
const router = Router();
import dotenv from 'dotenv';
dotenv.config();
import bcrypt from "bcrypt";

//validation functions:
const validateEmail = (email) => {
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailPattern.test(email);
}
const validatePassword = password => {
    const passwordRegex = /^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*\W)(?!.* ).{8,16}$/;
    return passwordRegex.test(password);
};
const validateUsername = username => {
    const usernameRegex = /^[0-9A-Za-z]{6,16}$/;
    return usernameRegex.test(username);
};

router.post('/signup', async (req, res) => {
    console.log("Hi");
    const { email, username, password, confirmPassword } = req.body;

    if (!email || !username || !password || !confirmPassword) {
        return res.status(400).json({ message: 'All fields are required' });
    }
    if (!validateEmail(email)) {
        return res.status(400).json({ message: 'Invalid email format' });
    }
    if (!validateUsername(username)) {
        return res.status(400).json({ message: 'Invalid username format' });
    }
    if (!validatePassword(password)) {
        return res.status(400).json({ message: 'Invalid password format' });
    }
    if (password !== confirmPassword) {
        return res.status(400).json({ message: 'Passwords do not match' });
    }

    try {
        const userCheck = await User.findOne({ username });
        if (userCheck) {
            return res.status(400).json({ message: 'Username already exists' });
        }

        const emailCheck = await User.findOne({ email });
        if (emailCheck) {
            return res.status(400).json({ message: 'Email already exists' });
        }        

        const salt = await bcrypt.genSalt();
        const hashedPassword = await bcrypt.hash(password, salt);
        // password = await hashPassword(password);
        console.log(hashedPassword);
        
        const newUser = new User({
            email,
            username,
            password: hashedPassword,
        });
        await newUser.save();
        res.status(201).json(newUser);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;
