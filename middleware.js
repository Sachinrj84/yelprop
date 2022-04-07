module.exports.isLoggedIn=(req,res,next) =>{
    // console.log(req.path,req.originalUrl);
    if(!req.isAuthenticated()){
        req.session.returnTo=req.originalUrl;
        req.flash('error','You must sign in');
        return res.redirect('/login');
    }
    next();
}