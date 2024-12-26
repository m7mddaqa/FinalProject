import express from 'express';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import User from './Schemas/User.js';

import signupRouter from './Routers/signupRouter.js';

const app = express();
app.use(bodyParser.json());
dotenv.config();
app.use(cors());

const MONGODB_URI = process.env.MONGODB_URI;
mongoose.connect(MONGODB_URI)
    .then(() => console.log('MongoDB connected...'))
    .catch(err => console.log(err));


app.get('/', (req, res) => {
    res.send('Hello World!');
});

app.use(signupRouter);

app.get('/login', (req,res) => {
    res.send("Login page")
});

app.listen(3001, '0.0.0.0', () => {
    console.log('Server is running on http://10.0.0.13:3001');
});