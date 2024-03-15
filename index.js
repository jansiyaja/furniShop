require("dotenv").config();
const nocache = require("nocache");

const express = require("express");
const app = express();
const path = require("path");

const userRoute = require("./routes/userRoutes");
app.use('/', userRoute)
const AdminRoutes = require("./routes/adminRoutes")
app.use('/admin', AdminRoutes)
const { connectDB } = require("./config/db");

connectDB();
const flash = require("express-flash")
app.use(flash())
app.use(nocache());
app.use(express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

