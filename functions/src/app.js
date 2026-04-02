const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const feedbackRouter = require("./routes/feedbackRoutes");
const studentRouter = require("./routes/studentRoutes");
const tokenRouter = require("./routes/tokenRoutes");
const adminRouter = require("./routes/adminRoutes");
// const facultyRouter = require("./routes/facultyRoutes");

const app = express();

app.use(cors({
	origin: [
		"http://localhost:3000",
		"https://sasi-feedback-portal.web.app"
	],
	credentials: true,
	methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
	allowedHeaders: ["Content-Type", "Authorization"],
}));

// Handle preflight requests for all routes
// app.options("*", cors({
// 	origin: [
// 		"http://localhost:3000",
// 		"https://sasi-feedback-portal.web.app"
// 	],
// 	credentials: true,
// 	methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
// 	allowedHeaders: ["Content-Type", "Authorization"],
// }));

app.use(cookieParser());
app.use(express.json());
// app.use("/", feedbackRouter);
app.use("/api/student", studentRouter);
app.use("/api", tokenRouter);
app.use("/api/admin", adminRouter);
// app.use("/api/faculty", facultyRouter);

module.exports = app;