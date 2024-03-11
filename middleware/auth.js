// middleware.js
const isLogin = async (req, res, next) => {
  // try {
  //   console.log(" coming");
  //   if (req.session.user) {
  //     console.log("session coming");
  //     console.log(req.session.user);
  //     res.redirect('/');
  //   } else {
  //     next();
  //   }
  // } catch (error) {
  //   console.log(error.message);
  // }

  try {
    if(req.session.user){
      next();
    }
    else {
      res.redirect('/login');
    }
  } catch (error) {
    
  }
};

const isLogout = async (req, res, next) => {
  try {
    console.log("Inside is logout");
    if (!req.session.user) {
      console.log("isLogout No session");
      next(); 
    } else {
      // res.redirect('/login');
      console.log("isLogout else part");
      res.redirect('/');
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).send('Internal Server Error');
  }
};


const login = async (req,res,next)=>{
  try {
    if(req.session.user){

      res.redirect('/')
    }else{

      next()
    }
  } catch (error) {
    console.log(error);
  }
}
module.exports = {
  isLogin,
  isLogout,
  login
};


