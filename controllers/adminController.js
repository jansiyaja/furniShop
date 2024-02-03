const User=require("../models/userModel");
const bcrypt=require("bcrypt");



const adminLogin = (req, res) => {
    const adminCredential = {
        email: 'admin@gmail.com', 
        password: 'admin', 
    };

    if (req.body.email === adminCredential.email && req.body.password === adminCredential.password) {
        req.session.admin = req.body.email;
        res.redirect('/admin/dashboard');
    } else if (req.body.email !== adminCredential.email && req.body.password === adminCredential.password) {
        res.render('login', { title: "Express", logout: "Invalid Admin Email" });
    } else if (req.body.email === adminCredential.email && req.body.password !== adminCredential.password) {
        res.render('login', { title: "Express", logout: "Invalid Admin Password" });
    } else {
        res.render('login', { title: "Express", logout: "Invalid Admin Credentials" });
    }
};

const loadHome=async(req,res)=>{
    res.render('dashboard')
};
const loadCustomer=async(req,res)=>{
    res.render('customers')
};

const adminLogout= async(req,res)=>{
    try {
        if(req.session){
          req.session.destroy((err)=>{
              if(err) {
                  return next(err);
              }
              else{
                return res.status(200).json({ success: 'Logout successfully' });
                 
              }
          })
       }
        
      } catch (error) {
        console.log(error.message);
        res.status(500).send('Internal Server Error');
      };
    };

    const userManagementSystem = async (req,res)=>{
        try {
          let page =1;
          if(req.query.id){
            page=req.query.id
          }
          let limit = 6;
          let next = page+1;
          let previous = page>1 ? page-1 : 1
      
          const count  = await User.find({
            is_admin:0
          }).count()
      
         let totalPages = Math.ceil(count/limit)
         if(next>totalPages){
          next=totalPages
         } 
      
          const user = await User.find({
            is_admin:0,
            
          }).limit(limit)
          .skip((page-1)*limit)
          .exec()
      
            res.render('customers',{users:user,
              page:page,
              previous:previous,
              next:next,
              totalPages:totalPages
            })
        } catch (error) {
          console.log(error.message);
        }
      };
      const blockUser = async (req, res) => {
        try {
            const id = req.body.id;
            let user = await User.findOne({ _id: id });
    
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }
    
            const newBlockedStatus = !user.Blocked;
    
            await User.updateOne({ _id: id }, { $set: { Blocked: newBlockedStatus } });
    
            res.json({ block: true, newBlockedStatus });
        } catch (error) {
            console.error(error.message);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    };
      
        
module.exports={
    adminLogin,
    loadHome,
    loadCustomer,
    adminLogout,
    userManagementSystem,
   blockUser

}