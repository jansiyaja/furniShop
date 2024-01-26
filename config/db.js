require('dotenv').config()
const mongoose = require('mongoose')

const connectDB = async () => {
  try {
    await mongoose.connect(
      process.env.MONGO_URI ||"mongodb://127.0.0.1:27017/furniture",

    )

    console.log('MongoDB connection SUCCESS')
  } catch (error) {
    console.error('MongoDB connection FAIL', error)
    process.exit(1)
  }
}

module.exports = {connectDB}