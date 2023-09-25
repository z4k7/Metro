// const err404 = async(req, res, next)=>{
//     res.status(404);
//     res.render("404",{url: req.url})
// }

// const err500 = async(err,req,res,next)=>{
//     console.log(err)
//     res.status(err.status || 500).render('500')
// }

// module.exports = {
//     err404,
//     err500
// }
const routeDifferentiator = (req, res, next) => {
    const url = req.url;
  
    // Check if the URL starts with '/admin/'
    if (url.startsWith('/admin/')) {
      req.isAdminRoute = true;
    } else {
      req.isAdminRoute = false;
    }
  
    next();
  };
const err404 = async (req, res, next) => {
    if (req.isAdminRoute) {
      res.status(404);
      res.render("admin404", { url: req.url }); // Use admin-specific 404 page for admin routes
    }
  else {
      res.status(404);
      res.render("404", { url: req.url }); // Use user-specific 404 page for user routes
    }
  };

  const err500 = async (err, req, res, next) => {
    console.log(err);
    if (req.isAdminRoute) {
      res.status(err.status || 500).render("admin500"); // Use admin-specific 500 page for admin routes
    } else {
      res.status(err.status || 500).render("500"); // Use user-specific 500 page for user routes
    }
  };
  
  module.exports = {
  
    err404,
    err500,
    routeDifferentiator
  };
  