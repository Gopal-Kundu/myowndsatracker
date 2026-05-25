const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const questionRoutes = require('./routes/questionRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('\x1b[31m[Error] MONGODB_URI is not defined in the environment variables / .env file.\x1b[0m');
  console.error('\x1b[31m[Error] Please configure your MongoDB Mongoose connection string before running the server.\x1b[0m');
  process.exit(1);
}

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('\x1b[32m[Database] Connected to MongoDB successfully.\x1b[0m');
  })
  .catch(err => {
    console.error('\x1b[31m[Database] MongoDB connection error:\x1b[0m', err);
  });

// Routes
app.use('/api/questions', questionRoutes);

// Export app for serverless environment (e.g. Vercel)
module.exports = app;

// Start Server locally
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`\x1b[32m[Server] Running on http://localhost:${PORT}\x1b[0m`);
  });
}

