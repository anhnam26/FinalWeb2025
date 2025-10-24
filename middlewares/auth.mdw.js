
export function restrict(req, res, next) {
  if (req.session.isAuthenticated && req.session.authUser) {
    return next();
  }

  req.session.retUrl = req.originalUrl;
  return res.redirect('/account/signin');
}

// 🔹 Middleware: chỉ cho phép sinh viên (permission = 1)
export function restrictStudent(req, res, next) {
  const user = req.session.authUser;

  if (!req.session.isAuthenticated || !user) {
    req.session.retUrl = req.originalUrl;
    return res.redirect('/account/signin');
  }

  if (user.permission !== 1) {
    return res.status(403).render('403', {
      message: 'Bạn không có quyền truy cập trang này. (Chỉ dành cho học viên)'
    });
  }

  next();
}

export function restrictAdmin(req, res, next) {
  const user = req.session.authUser;

  if (!req.session.isAuthenticated || !user) {
    req.session.retUrl = req.originalUrl;
    return res.redirect('/account/signin');
  }

  if (user.permission !== 3) {
    return res.status(403).render('403', {
      message: 'Bạn không có quyền truy cập trang này. (Chỉ dành cho quản trị viên)'
    });
  }

  next();
}
