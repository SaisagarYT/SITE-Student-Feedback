const express = require("express");
const { feedbackRouter } = require("./routes/feedbackRoutes");
const { studentRouter } = require("./routes/studentRoutes");

const app = express();

app.use(express.json());
app.use("/", feedbackRouter);
app.use("/api/student", studentRouter);

module.exports = { app };