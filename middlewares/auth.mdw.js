export function restrict(req, res, next) {
  if (req.session.isAuthenticated) {
    next();
  } else {
    req.session.retUrl = req.originalUrl;
    res.redirect('/account/signin');
  }
}

export function restrictAdmin(req, res, next) {
  if (req.session.authUser.permission === 3) {
    next();
  } else {
    res.status(403).render('403');
  }
}