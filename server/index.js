import express from 'express';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';


const app = express();
app.use(bodyParser.json());
dotenv.config();
app.use(cors());

const MONGODB_URI = process.env.MONGODB_URI;

import User from './Schemas/User.js';

mongoose.connect(MONGODB_URI)
    .then(() => console.log('MongoDB connected...'))
    .catch(err => console.log(err));


app.get('/', (req, res) => {
    res.send('Hello World!');
});


app.post('/signup', async (req, res) => {
    console.log('Signup route hit');
    const { email, username, password, confirmPassword } = req.body;
    console.log('email:', email);
    console.log('username:', username);
    console.log('password', confirmPassword);

    //validate the inputs
    if (!email || !username || !password || !confirmPassword) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    if (password !== confirmPassword) {
        return res.status(400).json({ message: 'Passwords do not match' });
    }

    try {
        //check if a username already exists
        const userCheck = await User.findOne({ username });
        if (userCheck) {
            return res.status(400).json({ message: 'Username already exists' });
        }

        //check if an email already exists
        const emailCheck = await User.findOne({ email });
        if (emailCheck) {
            return res.status(400).json({ message: 'Email already exists' });
        }

        //create a new user
        const newUser = new User({
            email,
            username,
            password,
        });
        await newUser.save();
        res.status(201).json(newUser);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});


app.listen(3001, '0.0.0.0', () => {
    console.log('Server is running on http://10.0.0.13:3001');
  });
