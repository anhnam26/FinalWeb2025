// routes/account.route.js — Unified

import express from 'express';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';

import db from '../utils/db.js';
import * as userModel from '../models/user.model.js';
import { restrict } from '../middlewares/auth.mdw.js';

import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
const router = express.Router();
const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);
router.get('/google', (req, res) => {
  const url = googleClient.generateAuthUrl({
    access_type: 'offline',
    scope: ['profile', 'email'],
  });
  res.redirect(url);
});
router.get('/google/callback', async (req, res) => {
  try {
    const { code } = req.query;

    const { tokens } = await googleClient.getToken(code);
    const ticket = await googleClient.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const email = payload.email;
    const name = payload.name;

    let user = await db('users').where({ email }).first();

    if (!user) {
      const [id] = await db('users').insert({
        name,
        email,
        permission: 1,
        role: 'student',
        is_disabled: false,
      });
      user = await db('users').where({ id }).first();
    }

    //  TẠO JWT CỦA HỆ THỐNG
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        permission: user.permission,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES }
    );

    //  redirect kèm token
    res.redirect(`/account/jwt-success?token=${token}`);
  } catch (err) {
    console.error(err);
    res.redirect('/account/signin');
  }
});

router.get('/jwt-success', (req, res) => {
  res.render('vwAccount/jwt-success', {
    token: req.query.token,
  });
});

/* =========================
 * 1) SIGN UP (SEND OTP)
 * ======================= */
router.get('/signup', (req, res) => {
  res.render('vwAccount/signup');
});

router.post('/signup', async (req, res) => {
  try {
    // chấp nhận cả username hoặc name từ form
    const username = (req.body.username || req.body.name || '').trim();
    const password = req.body.password || '';
    const name = (req.body.name || username || '').trim();
    const email = (req.body.email || '').trim();
    const dob = req.body.dob || null;

    if (!username || !password || !email) {
      return res.status(400).render('vwAccount/signup', {
        systemError: true,
        message: 'Thiếu thông tin: tên đăng nhập, mật khẩu, email.',
      });
    }

    // kiểm tra email tồn tại
    const existsEmail = await db('users').where('email', email);
    if (existsEmail.length > 0) {
      return res.render('vwAccount/signup', { emailExist: true });
    }

    // tạo & lưu OTP
    const otp = Math.floor(100000 + Math.random() * 900000);
    const expires = new Date(Date.now() + 5 * 60 * 1000);

    await db('otp_tokens').insert({
      email,
      otp_code: otp.toString(),
      expires_at: expires,
      created_at: new Date(),
    });

    // gửi mail OTP (Mailtrap sandbox)
    // Looking to send emails in production? Check out our Email API/SMTP product!
    const transporter = nodemailer.createTransport({
      host: "sandbox.smtp.mailtrap.io",
      port: 2525,
      auth: {
        user: "325d3a4b14039a",
        pass: "17b0afcd916ef6"
      }
    });

    await transporter.sendMail({
      from: '"FinalWeb System" <noreply@finalweb.com>',
      to: email,
      subject: 'Mã xác nhận OTP',
      text: `Xin chào ${name}, mã OTP của bạn là ${otp}. Mã có hiệu lực trong 5 phút.`,
    });

    // chuyển sang trang nhập OTP (pass data ẩn)
    return res.render('vwAccount/verify-otp', {
      username,
      password,
      name,
      email,
      dob,
    });
  } catch (err) {
    console.error('❌ Lỗi tại signup:', err);
    return res.status(500).render('vwAccount/signup', {
      systemError: true,
      message: 'Đăng ký thất bại, vui lòng thử lại sau.',
    });
  }
});

/* =========================
 * 2) VERIFY OTP
 * ======================= */
router.post('/verify-otp', async (req, res) => {
  try {
    const username = (req.body.username || req.body.name || '').trim();
    const password = req.body.password || '';
    const name = (req.body.name || username || '').trim();
    const email = (req.body.email || '').trim();
    const dob = req.body.dob || null;
    const otp = (req.body.otp || '').trim();

    if (!email || !username || !password) {
      return res.status(400).send('❌ Thiếu thông tin. Vui lòng đăng ký lại.');
    }

    const [record] = await db('otp_tokens')
      .where({ email })
      .orderBy('created_at', 'desc')
      .limit(1);

    if (!record) return res.send('❌ Không tìm thấy mã OTP.');
    if (record.otp_code !== otp) return res.send('❌ Mã OTP không đúng.');
    if (new Date() > record.expires_at) return res.send('❌ Mã OTP đã hết hạn.');

    const hashed = bcrypt.hashSync(password, 10);

    // tạo user: mặc định student
    await db('users').insert({
      username,            // nếu schema không có cột username, đổi thành name
      name,                // giữ thêm tên hiển thị
      password: hashed,
      email,
      dob,
      permission: 1,       // 1: student, 2: instructor, 3: admin
      role: 'student',

    });

    // xoá otp đã dùng
    await db('otp_tokens').where('email', email).del();

    return res.render('vwAccount/signin', { success: true });
  } catch (err) {
    console.error('❌ Lỗi tại verify-otp:', err); // xem terminal để biết cột nào sai
    return res.status(500).send(`Lỗi xác nhận OTP: ${err.message}`);
  }
});



/* =========================
 * 3) CHECK USERNAME AVAILABLE
 * ======================= */
router.get('/is-available', async (req, res) => {
  const u = (req.query.u || '').trim();
  if (!u) return res.json(false);

  // tương thích cả 2 kiểu hàm của userModel
  const user =
    (await userModel.findByUsername?.(u)) ||
    (await userModel.findByName?.(u)) ||
    null;

  return res.json(!user);
});

/* =========================
 * 4) SIGN IN
 * ======================= */
router.get('/signin', (req, res) => {
  res.render('vwAccount/signin', { error: false });
});

router.post('/signin', async (req, res) => {
  try {
    const username = (req.body.username || req.body.name || '').trim();
    const password = req.body.password || '';

    const user =
      (await userModel.findByUsername?.(username)) ||
      (await userModel.findByName?.(username)) ||
      null;

    // Không tồn tại user
    if (!user) {
      return res.render('vwAccount/signin', { error: true });
    }

    // 🔒 Bị vô hiệu hóa -> chặn đăng nhập
    if (user.is_disabled === true || user.is_disabled === 'TRUE' || user.is_disabled === 1) {
      // có thể log/track tại đây nếu muốn
      return res.render('vwAccount/signin', {
        error: true,
        disabled: true,              // gửi cờ để hiển thị thông báo rõ ràng
      });
    }

    // So khớp mật khẩu
    const ok = bcrypt.compareSync(password, user.password || '');
    if (!ok) {
      return res.render('vwAccount/signin', { error: true });
    }

    // Lưu session & điều hướng theo permission
    req.session.isAuthenticated = true;
    req.session.authUser = user;

    switch (Number(user.permission)) {
      case 1: return res.redirect('/student');
      case 2: return res.redirect('/instructor');
      case 3: return res.redirect('/admin');
      default: {
        const retUrl = req.session.retUrl || '/';
        delete req.session.retUrl;
        return res.redirect(retUrl);
      }
    }
  } catch (err) {
    console.error('❌ Signin error:', err);
    return res.render('vwAccount/signin', { error: true });
  }
});


/* =========================
 * 5) SIGN OUT
 * ======================= */
router.post('/logout', (req, res) => {
  req.session.isAuthenticated = false;
  req.session.authUser = null;
  res.redirect(req.headers.referer || '/');
});
// alias cho file cũ
router.post('/signout', (req, res) => {
  req.session.isAuthenticated = false;
  req.session.authUser = null;
  res.redirect(req.headers.referer || '/');
});

/* =========================
 * 6) PROFILE
 * ======================= */
router.get('/profile', restrict, (req, res) => {
  res.render('vwAccount/profile', { user: req.session.authUser });
});

router.post('/profile', restrict, async (req, res) => {
  const id = req.body.id;
  const userPatch = {
    name: (req.body.name || '').trim(),
    email: (req.body.email || '').trim(),
  };
  await userModel.patch(id, userPatch);
  req.session.authUser = { ...req.session.authUser, ...userPatch };

  res.render('vwAccount/profile', { user: req.session.authUser });
});

/* =========================
 * 7) CHANGE PASSWORD
 * ======================= */
router.get('/change-pwd', restrict, (req, res) => {
  res.render('vwAccount/change-pwd', { user: req.session.authUser });
});

router.post('/change-pwd', restrict, async (req, res) => {
  const id = req.body.id;
  const curPwd = req.body.currentPassword || req.body.curPassword || '';
  const newPwd = req.body.newPassword || '';

  const ok = bcrypt.compareSync(curPwd, req.session.authUser.password || '');
  if (!ok) {
    return res.render('vwAccount/change-pwd', {
      user: req.session.authUser,
      error: true,
    });
  }

  const hashed = bcrypt.hashSync(newPwd, 10);
  await userModel.patch(id, { password: hashed });
  req.session.authUser.password = hashed;

  res.redirect('/account/profile');
});

/* =========================
 * 8) JWT WEB DEMO (NO SESSION)
 * ======================= */
router.get('/jwt-test', (req, res) => {
  res.render('jwt-test');
});

export default router;
