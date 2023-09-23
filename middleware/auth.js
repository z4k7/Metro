exports.isLoggedIn = (req, res, next) => {
  try {
    if (!req.session.userId) {
      return res.redirect("/login");
    }
    next();
  } catch (error) {
    next(error);
  }
};

exports.isLoggedOut = (req, res, next) => {
  try {
    if (req.session.userId) {
      return res.redirect("/");
    }
    next();
  } catch (error) {
    next(error);
  }
};
