exports.isAdminLoggedIn = (req,res,next)=>{
    try{
        if(!req.session.admin){
            return res.redirect('/admin/login')
        }
        next()
     
    }
    catch(error){
        // console.log('internal error'+error.message);
        next(error)
    }
 }


 exports.isAdminLoggedOut = (req,res,next)=>{
    try{
        if(req.session.admin){
            res.redirect('/admin/dashboard')
        }
       
            next();
  
    }
    catch(error){
        next(error);
    }

 }