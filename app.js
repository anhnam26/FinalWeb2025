// JWT Auth Route
import 'dotenv/config';
import jwtRoute from './routes/jwt.route.js';

// app.js — Unified (Express + ESM + Handlebars)

import express from 'express';
import { engine } from 'express-handlebars';
import hbs_sections from 'express-handlebars-sections';
import session from 'express-session';
import path from 'path';
import { fileURLToPath } from 'url';

// Auth
import { restrict, restrictAdmin } from './middlewares/auth.mdw.js';

// Models
import * as categoryModel from './models/category.model.js';
import * as courseModel from './models/course.model.js';
// import * as enrollmentModel from './models/enrollment.model.js';
import * as purchasedModel from './models/purchased.model.js';

// Routers
import adminRouter from './routes/admin.route.js';
import studentRouter from './routes/student.route.js';
import accountRouter from './routes/account.route.js';
import courseRouter from './routes/course.route.js';
import categoryRoute from './routes/category.route.js';
import searchRouter from './routes/search.route.js';
import cartRouter from './routes/cart.route.js';
import instructorRouter from './routes/instructor.route.js';

// __dirname (ESM)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// App
const app = express();

// Session
app.set('trust proxy', 1);
app.use(session({
  secret: 'b3f8c2a1e7d4f6g9h0j2k5l8m1n3p6q9r2s5t8u1v4w7x0y3z6a9b2c5d8e1',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }, // Bật true khi dùng HTTPS
}));

// Handlebars
app.engine('handlebars', engine({
  extname: '.handlebars',
  defaultLayout: 'main',
  helpers: {
    section: hbs_sections(),
    fillContent: hbs_sections(),

    // Format helpers
    format_number(v) { return new Intl.NumberFormat('en-US').format(v); },
    formatVnd(v) { return v == null ? '' : Number(v).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' }); },
    formatDate(d) { return d ? new Date(d).toLocaleDateString('vi-VN') : ''; },
    formatDuration(sec) {
      const s = Math.max(0, Number(sec) || 0);
      const h = Math.floor(s / 3600);
      const m = Math.floor((s % 3600) / 60);
      const ss = s % 60;
      return (h ? `${h}:` : '') + String(m).padStart(2, '0') + ':' + String(ss).padStart(2, '0');
    },

    // Logic helpers
    eq: (a, b) => a === b,
    isEqual: (a, b) => a === b,
    if_eq(a, b, opts) { return a === b ? opts.fn(this) : opts.inverse(this); },
    ifCond(v1, v2, opts) { return v1 == v2 ? opts.fn(this) : opts.inverse(this); },
    gt(a, b) { return a > b; },
    lt(a, b) { return a < b; },
    if_contains(arr, val, opts) {
      return (arr && val && arr.map(String).includes(String(val))) ? opts.fn(this) : opts.inverse(this);
    },

    // Array & chunking
    array() { return Array.from(arguments).slice(0, -1); },
    range(from, to) { return Array.from({ length: to - from + 1 }, (_, i) => from + i); },
    rangeAdd(count, total) { return Array.from({ length: total - count }, (_, i) => i); },
    chunk(ctx, size, opts) {
      if (!Array.isArray(ctx) || !ctx.length) return opts.inverse(this);
      const chunks = [];
      for (let i = 0; i < ctx.length; i += size) chunks.push(ctx.slice(i, i + size));
      return chunks.map(c => opts.fn(c)).join('');
    },

    // UI helpers
    generateStars(r) {
      if (typeof r !== 'number' || r < 0 || r > 5) return '';
      let stars = '';
      const full = Math.floor(r);
      const half = (r % 1) >= 0.5 ? 1 : 0;
      const empty = 5 - full - half;
      for (let i = 0; i < full; i++) stars += '<i class="bi bi-star-fill text-warning"></i>';
      if (half) stars += '<i class="bi bi-star-half text-warning"></i>';
      for (let i = 0; i < empty; i++) stars += '<i class="bi bi-star text-warning"></i>';
      return stars;
    },
    thumb(urlOrFile) {
      const s = String(urlOrFile || '');
      if (s.startsWith('http://') || s.startsWith('https://')) return s;
      return `/static/img/courses/${s || 'placeholder.png'}`;
    },

    // Math
    add(a, b) { return a + b; },
    subtract(a, b) { return a - b; },

    // Pagination
    generatePageNumbers(totalPages, currentPage) {
      let pages = [];
      let startPage = Math.max(1, currentPage - 2);
      let endPage = Math.min(totalPages, currentPage + 2);

      if (currentPage < 3) endPage = Math.min(5, totalPages);
      if (currentPage > totalPages - 2) startPage = Math.max(1, totalPages - 4);

      if (startPage > 1) {
        pages.push({ number: 1 });
        pages.push({ isEllipsis: true });
      }
      for (let i = startPage; i <= endPage; i++) {
        pages.push({ number: i, isCurrent: i === currentPage });
      }
      if (endPage < totalPages) {
        pages.push({ isEllipsis: true });
        pages.push({ number: totalPages });
      }
      return pages;
    },
  },
  partialsDir: [
    path.join(__dirname, 'views', 'partials'),
    path.join(__dirname, 'views', 'vwAccount'),
    path.join(__dirname, 'views', 'vwAdminCategory'),
    path.join(__dirname, 'views', 'vwAdminProduct'),
    path.join(__dirname, 'views', 'vwProduct'),
    path.join(__dirname, 'views', 'vwInstructor', 'partials'),
  ],
}));

app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'views'));

// Middlewares
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use('/static', express.static(path.join(__dirname, 'static')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Auth locals + ownedCourseIds
app.use(async (req, res, next) => {
  try {
    if (req.session.isAuthenticated) {
      res.locals.isAuthenticated = true;
      res.locals.authUser = req.session.authUser;

      const ownedCourses = await purchasedModel.findCourseIdsByUserId(req.session.authUser.id);
      res.locals.ownedCourseIds = ownedCourses;
    } else {
      res.locals.isAuthenticated = false;
      res.locals.ownedCourseIds = [];
    }
    next();
  } catch (err) {
    console.error('Auth locals error:', err);
    res.locals.isAuthenticated = false;
    res.locals.ownedCourseIds = [];
    next();
  }
});

// Categories for header
app.use(async (req, res, next) => {
  try {
    const categories = await categoryModel.all();
    res.locals.categories = categories;
  } catch (err) {
    console.error('Không thể tải categories:', err);
    res.locals.categories = [];
  }
  next();
});

// Cart badge
app.use((req, res, next) => {
  if (typeof req.session.cart === 'undefined') req.session.cart = [];
  res.locals.cartTotal = req.session.cart.length;
  next();
});

// Home
app.get('/', async (req, res, next) => {
  try {
    const [outstandingCourses, mostViewedCourses, newestCourses, topCategories] =
      await Promise.all([
        courseModel.findOutstandingPastWeek(),     // TODO: có thể đổi sang purchased
        courseModel.findMostViewed(10),
        courseModel.findNewest(10),
        categoryModel.findMostEnrolledPastWeek(5), // TODO: có findMostPurchasedPastWeek thì đổi
      ]);
    res.render('home', { outstandingCourses, mostViewedCourses, newestCourses, topCategories });
  } catch (err) {
    console.error('Home error:', err);
    next(err);
  }
});

// Routers
app.use('/admin', restrict, restrictAdmin, adminRouter);
app.use('/student', studentRouter);
app.use('/account', accountRouter);
app.use('/courses', courseRouter);
app.use('/categories', categoryRoute);
app.use('/search', searchRouter);
app.use('/cart', cartRouter);
app.use('/instructor', instructorRouter);

app.use('/api/auth', jwtRoute);


// Errors
app.use((req, res) => res.status(404).render('404'));
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.render('500');
});

app.use(session({
  secret: 'SESSION_SECRET',
  resave: false,
  saveUninitialized: false
}));

// Start
app.listen(4000, () => console.log('✅ Server is running at http://localhost:4000'));
