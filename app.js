import express from 'express';
import { engine } from 'express-handlebars';
import hbs_sections from 'express-handlebars-sections';
import session from 'express-session';
import path from 'path';
import { fileURLToPath } from 'url';

// Lấy đường dẫn thực tế cho __dirname trong ES Module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// --------------------- Cấu hình Session ---------------------
app.set('trust proxy', 1);
app.use(session({
  secret: 'b3f8c2a1e7d4f6g9h0j2k5l8m1n3p6q9r2s5t8u1v4w7x0y3z6a9b2c5d8e1',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Chuyển true nếu deploy HTTPS
}));

// --------------------- Cấu hình View Engine ---------------------
app.engine('handlebars', engine({
  helpers: {
    section: hbs_sections(),
    format_number(value) {
      return new Intl.NumberFormat('en-US').format(value);
    },
    formatVnd(value) {
      if (!value) return '';
      return value.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
    }
  }
}));

app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'views'));

// --------------------- Middleware chung ---------------------
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use('/static', express.static(path.join(__dirname, 'static')));

app.use((req, res, next) => {
  if (req.session.isAuthenticated) {
    res.locals.isAuthenticated = true;
    res.locals.authUser = req.session.authUser;
  } else {
    res.locals.isAuthenticated = false;
  }
  next();
});

// --------------------- Các route cơ bản ---------------------
app.get('/about', (req, res) => {
  res.sendFile(path.join(__dirname, 'about.html'));
});

app.get('/bs', (req, res) => {
  res.sendFile(path.join(__dirname, 'bs.html'));
});

app.get('/', (req, res) => {
  res.render('home');
});

// --------------------- Import các route ---------------------
import { restrict, restrictAdmin } from './middlewares/auth.mdw.js';

// Admin routes (quản lý)


import adminRouter from './routes/admin.route.js';
app.use('/admin', restrict, restrictAdmin, adminRouter);

// User routes (người học)
import studentRouter from './routes/student.route.js';
app.use('/student', studentRouter);

import accountRouter from './routes/account.route.js';
app.use('/account', accountRouter);

import courseRouter from './routes/course.route.js';
app.use('/courses', courseRouter);

// --------------------- Xử lý lỗi ---------------------
app.use((req, res) => {
  res.status(404).render('404');
});

// --------------------- Khởi động server ---------------------
app.listen(4000, () => {
  console.log('✅ Server is running at http://localhost:4000');
});
