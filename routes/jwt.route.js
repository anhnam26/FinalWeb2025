import express from 'express';
import jwt from 'jsonwebtoken';
import * as userModel from '../models/user.model.js';

const router = express.Router();

/*
 * GOOGLE LOGIN DEMO
 * - Tạo session cho web
 * - Phát JWT cho API
 */
router.post('/login-demo', async (req, res) => {
    try {
        // DEMO user (giả lập Google)
        let user =
            (await userModel.findByUsername?.('google_demo')) ||
            null;

        if (!user) {
            const newUser = {
                username: 'google_demo',
                name: 'Google Demo User',
                email: 'google_demo@gmail.com',
                permission: 1, // student
                password: ''
            };

            const ids = await userModel.add(newUser);
            user = { id: ids[0], ...newUser };
        }

        // 🔐 TẠO SESSION CHO WEB
        req.session.isAuthenticated = true;
        req.session.authUser = {
            id: user.id,
            name: user.name,
            permission: user.permission
        };

        // 🔑 PHÁT JWT CHO API
        const token = jwt.sign(
            {
                id: user.id,
                permission: user.permission
            },
            process.env.JWT_SECRET,
            { expiresIn: '30m' }
        );

        // 📍 redirect theo quyền
        const redirect =
            user.permission === 1 ? '/student' :
                user.permission === 2 ? '/instructor' :
                    '/admin';

        res.json({ token, redirect });
    } catch (err) {
        res.status(500).json({ message: 'Google login demo failed' });
    }
});

export default router;
