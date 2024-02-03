const cloudinary = require('cloudinary').v2;


cloudinary.config({
  cloud_name:process.env.CLOUD_NAME,
  api_key:process.env.API_KEYS,
  api_secret:process.env.API_SECRETS
});



module.exports = {

  cloudinary };