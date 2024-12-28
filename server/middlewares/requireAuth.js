import jwt from 'jsonwebtoken';
import User from '../Schemas/User.js';
import dotenv from 'dotenv';
dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET;

const authenticateToken = (req, res, next) => {
    const {authorization} = req.headers;
    //authorization === 'Bearer sfijwauifhwafhuiawhif...'

    if (!authorization){
        return res.status(401).json({ message: 'You must log in' });
    }

    //that would clear Bearer from authorization leaving it with just the token itself
    const token = authorization.replace('Bearer ', '');
    //payload will be whatever information we store in our token, in the login, where we created the token, its a user id.
    jwt.verify(token,JWT_SECRET, async(err,payload)=> {
        if(err){
            return res.status(401).send({error: 'You must be logged in.'});
        }
        const {id} = payload;
        try {
            const user = await User.findById(id);
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            // Attach user to the request object
            req.user = user;
            next();
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Server error' });
        }
    });
};

export default authenticateToken