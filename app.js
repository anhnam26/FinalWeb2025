import express from 'express';
import { engine } from 'express-handlebars';
import hsb_sections from 'express-handlebars-sections';
import session from 'express-session';

const __dirname = import.meta.dirname;
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.set('trust proxy', 1);
app.use(session({
  secret: 'b3f8c2a1e7d4f6g9h0j2k5l8m1n3p6q9r2s5t8u1v4w7x0y3z6a9b2c5d8e1',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));

app.engine('handlebars', engine({
  helpers: {
    fillContent: hsb_sections(),
    format_number(value) {
      return new Intl.NumberFormat('en-US').format(value);
    }
  }
}));
app.set('view engine', 'handlebars');
app.set('views', './views');

app.use('/static', express.static('static'));

app.use((req, res, next) => {
  res.locals.isAuthenticated = !!req.session.isAuthenticated;
  res.locals.authUser = req.session.authUser;
  next();
});

app.get('/', (req, res) => res.render('home'));

import studentRouter from './routes/student.route.js';
app.use('/student', studentRouter);

import accountRoute from './routes/account.route.js';
app.use('/account', accountRoute);

app.use((req, res) => res.status(404).render('404'));

app.listen(4000, () => console.log('Server is running on http://localhost:4000'));
