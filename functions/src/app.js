const express = require("express");
const feedbackRouter = require("./routes/feedbackRoutes");
const studentRouter = require("./routes/studentRoutes");
const tokenRouter = require("./routes/tokenRoutes");
const adminRouter = require("./routes/adminRoutes");
const facultyRouter = require("./routes/facultyRoutes");

const app = express();


app.use(express.json());
app.use("/", feedbackRouter);
app.use("/api/student", studentRouter);
app.use("/api", tokenRouter);
app.use("/api/admin", adminRouter);
app.use("/api/faculty", facultyRouter);

module.exports = app;