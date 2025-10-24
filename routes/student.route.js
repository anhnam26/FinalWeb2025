import express from 'express';
import bcrypt from 'bcryptjs';
import { restrict } from '../middlewares/auth.mdw.js';
import * as userModel from '../models/user.model.js';
import * as watchlistModel from '../models/watchlist.model.js';
import * as purchasedModel from '../models/purchased.model.js';
import * as courseModel from '../models/course.model.js';
import * as lectureModel from '../models/lecture.model.js';
import * as progressModel from '../models/progress.model.js';
const router = express.Router();

/** Chỉ cho phép student (permission = 1) */
function ensureStudent(req, res, next) {
  if (!req.session?.authUser || Number(req.session.authUser.permission) !== 1) {
    // Có thể đổi sang res.redirect('/') nếu bạn muốn trả về trang chủ
    return res.status(403).send('Forbidden: Students only.');
  }
  next();
}

// Áp dụng middleware cho toàn bộ /student
router.use(restrict, ensureStudent);

/** Student Home */
router.get('/', (req, res) => {
  res.render('vwStudent/home', {
    user: req.session.authUser,
    isAuthenticated: req.session.isAuthenticated,
    authUser: req.session.authUser,
  });
});

/** Profile - Hiển thị */
router.get('/profile', (req, res) => {
  res.render('vwStudent/profile', {
    user: req.session.authUser,
    isAuthenticated: req.session.isAuthenticated,
    authUser: req.session.authUser,
    error: false,
    success: false,
  });
});

/** Profile - Cập nhật tên & email */
router.post('/profile', async (req, res) => {
  const id = req.body.id;
  const updatedUser = {
    name: req.body.name?.trim(),
    email: req.body.email?.trim(),
  };

  await userModel.patch(id, updatedUser);

  // cập nhật lại session
  req.session.authUser.name = updatedUser.name;
  req.session.authUser.email = updatedUser.email;

  res.render('vwStudent/profile', {
    user: req.session.authUser,
    isAuthenticated: true,
    authUser: req.session.authUser,
    error: false,
    success: 'Cập nhật thông tin thành công!',
  });
});

/** Đổi mật khẩu */
router.post('/change-pwd', async (req, res) => {
  const id = req.body.id;
  const currentPassword = req.body.currentPassword || '';
  const newPassword = req.body.newPassword || '';

  // kiểm tra mật khẩu hiện tại
  const ok = bcrypt.compareSync(currentPassword, req.session.authUser.password);
  if (!ok) {
    return res.render('vwStudent/profile', {
      user: req.session.authUser,
      isAuthenticated: true,
      authUser: req.session.authUser,
      error: 'Mật khẩu hiện tại không đúng.',
      success: false,
    });
  }

  // (tuỳ chọn) ràng buộc độ dài mật khẩu mới
  if (newPassword.length < 6) {
    return res.render('vwStudent/profile', {
      user: req.session.authUser,
      isAuthenticated: true,
      authUser: req.session.authUser,
      error: 'Mật khẩu mới phải tối thiểu 6 ký tự.',
      success: false,
    });
  }

  const hashed = bcrypt.hashSync(newPassword, 10);
  await userModel.patch(id, { password: hashed });

  // cập nhật session
  req.session.authUser.password = hashed;

  res.render('vwStudent/profile', {
    user: req.session.authUser,
    isAuthenticated: true,
    authUser: req.session.authUser,
    error: false,
    success: 'Đổi mật khẩu thành công!',
  });
});
router.get('/watchlist', async (req, res) => {
  const items = await watchlistModel.findAll();
  res.render('vwStudent/watchlist', { items });
});

router.post('/watchlist/add', async (req, res) => {
  const { course_id, course_title } = req.body;

  const existed = await watchlistModel.isInWatchlist(course_id);
  if (!existed) await watchlistModel.add(course_id, course_title);
  res.redirect('/courses/' + course_id);


});

router.post('/watchlist/remove', async (req, res) => {
  const { course_id } = req.body;
  await watchlistModel.remove(course_id);
  res.redirect('/student/watchlist');
}
);

router.get('/courses', async (req, res) => {
  const purchasedCourses = await purchasedModel.findAllCourses();
  res.render('vwStudent/courses', {
    purchasedCourses: Array.isArray(purchasedCourses) ? purchasedCourses : [],
  });
});
///-----------------------------

router.get('/courses/:courseId', restrict, async (req, res) => {
  const { courseId } = req.params;
  // TODO (khuyến nghị): kiểm tra học viên có sở hữu khóa này chưa.
 //if (!(await purchasedModel.isPurchased(req.session.authUser.id, courseId))) return res.status(403).render('403');
  const lectures = await lectureModel.findByCourse(courseId);
  res.render('vwStudent/course-lectures', {
    courseId,
    lectures
  });
});
////----------------------------- bài giảng ( phát video)
router.get('/courses/:courseId/:lectureId', restrict, async (req, res) => {
  const user = req.session.authUser;
  const { courseId, lectureId } = req.params;

  // TODO: kiểm tra user có sở hữu khóa này chưa (enrollment/purchased)
  // if (!(await purchasedModel.isPurchased(user.id, courseId))) return res.status(403).render('403');

  const lectures = await lectureModel.findByCourse(courseId);
  const current = await lectureModel.findById(lectureId);
  if (!current) return res.status(404).render('404');

  const prog = await progressModel.find(user.id, current.id);

  res.render('vwStudent/learn', {
    courseId,
    lectures,
    current,
    progress: prog || { last_second: 0, watched_percent: 0, is_completed: false }
  });
});

/* API lưu tiến trình */
router.post('/api/progress', restrict, async (req, res) => {
  const user = req.session.authUser;
  const { lecture_id, last_second, duration_sec } = req.body;

  const duration = Math.max(1, Number(duration_sec) || 1);
  const last = Math.max(0, Number(last_second) || 0);
  const watched_percent = Math.min(100, (last / duration) * 100);
  const is_completed = watched_percent >= 90;

  await progressModel.upsert(user.id, lecture_id, { last_second: last, watched_percent, is_completed });
  res.json({ ok: true });
});

router.post('/api/lecture-duration', restrict, async (req, res) => {
  const { lecture_id, duration_sec } = req.body;
  if (!lecture_id || !duration_sec) return res.json({ ok: false });

  await lectureModel.updateDuration(lecture_id, Math.max(1, Number(duration_sec)));
  return res.json({ ok: true });
});
export default router;
