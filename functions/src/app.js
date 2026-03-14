const express = require("express");
const { feedbackRouter } = require("./routes/feedbackRoutes");
const { studentRouter } = require("./routes/studentRoutes");
const { tokenRouter } = require("./routes/tokenRoutes");

const app = express();


app.use(express.json());
app.use("/", feedbackRouter);
app.use("/api/student", studentRouter);
app.use("/api", tokenRouter);

module.exports = { app };