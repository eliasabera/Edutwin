const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const connectDB = require("./config/database");
require("dotenv").config();

// Import routes
// const studentRoutes = require("./routes/studentRoutes");
// const teacherRoutes = require("./routes/teacherRoutes");
// const parentRoutes = require("./routes/parentRoutes");
const authRoutes = require("./routes/authRoutes");
const profileRoutes = require("./routes/profileRoutes")
const resourceRoutes = require('./routes/resourceRoutes')
const assignmentRoutes=require('./routes/assignmentRoutes')

const app = express();

// Connect to database
connectDB();

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan("combined"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Routes
// app.use("/api/students", studentRoutes);
// app.use("/api/teachers", teacherRoutes);
// app.use("/api/parents", parentRoutes);
app.use("/api/auth", authRoutes);
app.use('/api/profile', profileRoutes)
app.use('/api/resources', resourceRoutes)
app.use('/api/assignments',assignmentRoutes)


// Health check endpoint
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "EduTwin API is running",
    timestamp: new Date().toISOString(),
  });
});





module.exports = app;
