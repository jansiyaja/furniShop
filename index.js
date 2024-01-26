require("dotenv").config();

const express = require("express");
const app = express();
const path = require("path");
const nocache = require('nocache')
app.use(nocache())




const userRoute = require("./routes/userRoutes");
app.use('/',userRoute)
const AdminRoutes=require("./routes/adminRoutes")
app.use('/admin',AdminRoutes)
const { connectDB } = require("./config/db");
connectDB();

app.use(express.static(path.join(__dirname,'public')));

const PORT = process.env.PORT ;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));