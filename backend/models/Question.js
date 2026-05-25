const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  id: { type: String, required: true },
  topic: { type: String, required: true },
  name: { type: String, required: true },
  link: { type: String, required: true },
  difficulty: { type: String, required: true, enum: ['Easy', 'Medium', 'Hard'] },
  done: { type: Boolean, default: false },
  revisions: { type: Number, default: 0, min: 0 },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

// Create a compound index for user + id if we want uniqueness per user,
// or just index them for fast lookups.
questionSchema.index({ user: 1, id: 1 }, { unique: true });

module.exports = mongoose.model('Question', questionSchema);

