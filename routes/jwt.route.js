import express from 'express';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import * as userModel from '../models/user.model.js';
import { jwtAuth } from '../middlewares/jwt.mdw.js';

const router = express.Router();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

router.post('/login-demo', async (req, res) => {
    const user = {
        id: 1,
        permission: 1
    };

    const token = jwt.sign(user, process.env.JWT_SECRET, {
        expiresIn: '30m'
    });

    res.json({ token });
});

router.post('/google-jwt', async (req, res) => {
    const { idToken } = req.body;

    try {
        const ticket = await googleClient.verifyIdToken({
            idToken,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payloadGoogle = ticket.getPayload();
        const name = payloadGoogle.name;
        const email = payloadGoogle.email;

        let user = await userModel.findByName(name);

        if (!user) {
            const newUser = {
                name,
                username: email,
                email,
                permission: 1
            };

            const ids = await userModel.add(newUser);
            user = { id: ids[0], ...newUser };
        }

        const token = jwt.sign(
            {
                id: user.id,
                permission: user.permission,
                loginType: 'google'
            },
            process.env.JWT_SECRET,
            { expiresIn: '30m' }
        );

        res.json({ token });
    } catch (err) {
        res.status(401).json({ message: 'Google authentication failed' });
    }
});

router.get('/me', jwtAuth, (req, res) => {
    res.json({ user: req.jwtUser });
});

export default router;
