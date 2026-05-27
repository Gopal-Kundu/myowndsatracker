const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const cookieParser = require('cookie-parser');

const questionRoutes = require('./routes/questionRoutes');
const authRoutes = require('./routes/authRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'https://myowndsatracker-n8wu.vercel.app', 'http://127.0.0.1:5173'],
  credentials: true
}));
app.use(cookieParser());
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
    
    // Drop old index on 'id' if it exists to prevent conflicts
    mongoose.connection.db.collection('questions').dropIndex('id_1')
      .then(() => console.log('[Database] Old unique index id_1 dropped successfully.'))
      .catch(() => {
        // Index might not exist, which is fine
      });
  })
  .catch(err => {
    console.error('[Database] MongoDB connection error:', err);
  });

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/questions', questionRoutes);

// Export app for serverless environment (e.g. Vercel)
module.exports = app;

// Start Server locally
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`\x1b[32m[Server] Running on http://localhost:${PORT}\x1b[0m`);
  });
}
