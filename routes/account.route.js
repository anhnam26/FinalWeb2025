import express from 'express';
import * as userModel from '../models/user.model.js';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';
import db from '../utils/db.js';
import { restrict } from '../middlewares/auth.mdw.js';

const router = express.Router();

// =========================
// 1️⃣ ĐĂNG KÝ (GỬI OTP)
// =========================
router.get('/signup', (req, res) => {
  res.render('vwAccount/signup');
});

router.post('/signup', async (req, res) => {
  const { username, password, name, email, dob, role } = req.body;

  const exists = await db('users').where('email', email);
  if (exists.length > 0) {
    return res.render('vwAccount/signup', { emailExist: true });
  }

  // Tạo OTP
  const otp = Math.floor(100000 + Math.random() * 900000);
  const expires = new Date(Date.now() + 5 * 60 * 1000);

  await db('otp_tokens').insert({
    email,
    otp_code: otp.toString(),
    expires_at: expires,
    created_at: new Date()
  });

  // Gửi OTP mailtrap
  const transporter = nodemailer.createTransport({
    host: 'sandbox.smtp.mailtrap.io',
    port: 2525,
    auth: {
      user: '1ce6c9f98f4e73',
      pass: '18358c1d991aad'
    }
  });

  await transporter.sendMail({
    from: '"FinalWeb System" <noreply@finalweb.com>',
    to: email,
    subject: 'Mã xác nhận OTP',
    text: `Xin chào ${name}, mã OTP của bạn là ${otp}. Mã này có hiệu lực trong 5 phút.`
  });

  // Render verify kèm toàn bộ data qua hidden input
  res.render('vwAccount/verify-otp', {
    username,
    password,
    name,
    email,
    dob,
    role: role || 'user'
  });
});

// =========================
// 2️⃣ XÁC NHẬN MÃ OTP
// =========================
router.post('/verify-otp', async (req, res) => {
  console.log('DEBUG req.body:', req.body);
  const { username, password, name, email, dob, otp, role } = req.body;

  console.log('Email nhận từ form verify-otp:', email);

  if (!email || !username || !password) {
    return res.status(400).send('❌ Thiếu thông tin. Vui lòng đăng ký lại.');
  }

  const [record] = await db('otp_tokens').where({ email }).orderBy('created_at', 'desc').limit(1);
  if (!record) return res.send('❌ Không tìm thấy mã OTP.');
  if (record.otp_code !== otp) return res.send('❌ Mã OTP không đúng.');
  if (new Date() > record.expires_at) return res.send('❌ Mã OTP đã hết hạn.');

  const hash_password = bcrypt.hashSync(password, 10);

  let permission = 1;
  if (role === 'instructor') permission = 2;
  else if (role === 'admin') permission = 3;

  await db('users').insert({
    username,
    password: hash_password,
    name,
    email,
    dob: dob || null,
    permission,
    role: ['user', 'instructor', 'admin'].includes(role) ? role : 'user'
  });

  await db('otp_tokens').where('email', email).del();
  res.render('vwAccount/signin', { success: true });
});


// =========================
// 3️⃣ KIỂM TRA USERNAME
// =========================
router.get('/is-available', async (req, res) => {
  const u = req.query.u;
  const user = await userModel.findByUsername(u);
  if (!user) return res.json(true);
  return res.json(false);
});

// =========================
// 4️⃣ ĐĂNG NHẬP
// =========================
router.get('/signin', (req, res) => {
  res.render('vwAccount/signin', { error: false });
});

router.post('/signin', async (req, res) => {
  const user = await userModel.findByUsername(req.body.username);
  if (!user) return res.render('vwAccount/signin', { error: true });

  const ok = bcrypt.compareSync(req.body.password, user.password);
  if (!ok) return res.render('vwAccount/signin', { error: true });

  req.session.isAuthenticated = true;
  req.session.authUser = user;

  switch (user.permission) {
    case 1: return res.redirect('/student');
    case 2: return res.redirect('/instructor');
    case 3: return res.redirect('/admin');
    default:
      const retUrl = req.session.retUrl || '/';
      delete req.session.retUrl;
      return res.redirect(retUrl);
  }
});

// =========================
// 5️⃣ ĐĂNG XUẤT
// =========================
router.post('/logout', (req, res) => {
  req.session.isAuthenticated = false;
  req.session.authUser = null;
  res.redirect(req.headers.referer);
});

// =========================
// 6️⃣ HỒ SƠ CÁ NHÂN
// =========================
router.get('/profile', restrict, (req, res) => {
  res.render('vwAccount/profile', {
    user: req.session.authUser
  });
});

router.post('/profile', restrict, async (req, res) => {
  const id = req.body.id;
  const user = {
    name: req.body.name,
    email: req.body.email
  };
  await userModel.patch(id, user);
  req.session.authUser.name = req.body.name;
  req.session.authUser.email = req.body.email;
  res.render('vwAccount/profile', { user: req.session.authUser });
});

// =========================
// 7️⃣ ĐỔI MẬT KHẨU
// =========================
router.get('/change-pwd', restrict, (req, res) => {
  res.render('vwAccount/change-pwd', { user: req.session.authUser });
});

router.post('/change-pwd', restrict, async (req, res) => {
  const id = req.body.id;
  const curPwd = req.body.curPassword;
  const newPwd = req.body.newPassword;

  const match = bcrypt.compareSync(curPwd, req.session.authUser.password);
  if (!match) {
    return res.render('vwAccount/change-pwd', {
      user: req.session.authUser,
      err_message: true
    });
  }

  const hash_password = bcrypt.hashSync(newPwd, 10);
  await userModel.patch(id, { password: hash_password });
  req.session.authUser.password = hash_password;
  res.redirect('/account/profile');
});

export default router;
