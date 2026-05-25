const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  topic: { type: String, required: true },
  name: { type: String, required: true },
  link: { type: String, required: true },
  difficulty: { type: String, required: true, enum: ['Easy', 'Medium', 'Hard'] },
  done: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Question', questionSchema);
