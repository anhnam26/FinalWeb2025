import express from 'express';
import { restrict } from '../middlewares/auth.mdw.js';
const router = express.Router();

router.get('/', restrict, (req, res) => {
    res.render('vwStudent/home', {
        user: req.session.authUser
    });
});

export default router;
