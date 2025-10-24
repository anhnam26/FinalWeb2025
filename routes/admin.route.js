import express from 'express';
import * as adminModel from '../models/admin.model.js';
import { restrict, restrictAdmin } from '../middlewares/auth.mdw.js';

const router = express.Router();

// Trang chủ dashboard admin
router.get('/', restrict, restrictAdmin, async (req, res) => {
  const stats = await adminModel.getDashboardStats();
  const topCategories = await adminModel.getTopCategories();
  const courseStatuses = await adminModel.getCourseStatuses();

  res.render('vwAdmin/home', {
    layout: false, // vì admin.hbs là file HTML riêng, không dùng main.hbs
    user: req.session.authUser,
    stats,
    topCategories,
    courseStatuses,
  });
});

export default router;
