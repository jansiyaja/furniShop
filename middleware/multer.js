const multer = require('multer')
const path = require('path')

const storage = multer.diskStorage({
  destination : (req,file,cb)=>{
    cb(null,path.join(__dirname,'../public/assets/images/product/productImages'))
  },
  filename : function(req,file,cb){
    const name = Date.now()+'-'+file.originalname;
    cb(null,name,)
  }
})

const upload = multer({storage : storage});

module.exports = upload
 
