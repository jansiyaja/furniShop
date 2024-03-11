const isLogout = async (req, res, next) => {
  try {
    if (req.session.admin) {
      console.log("mid", req.session.admin);
      next();
    } else {
      res.redirect('/admin/login');
    }
  } catch (error) {
    console.log(error.message);
  }
}

const isLogin = async (req, res, next) => {
  try {
    if (req.session.admin) {
      console.log("logd", req.session.admin);
      res.redirect('/admin/dashboard');
    } else {
      next();
    }
  } catch (error) {
    console.log(error.message);
  }
}
const login = async (req,res,next)=>{
  try {
    if(req.session.admin){

      res.redirect('/admin/dashboard')
    }else{

      next()
    }
  } catch (error) {
    console.log(error);
  }
}

module.exports = {
  isLogout,
  isLogin,login
}