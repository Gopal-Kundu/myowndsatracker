const Question = require('../models/Question');
const User = require('../models/User');

// Get all questions for the logged-in user
exports.getAllQuestions = async (req, res) => {
  try {
    const questions = await Question.find({ user: req.user._id });
    res.json(questions);
  } catch (error) {
    res.status(500).json({ error: 'Server error while fetching questions', details: error.message });
  }
};

// Add a new question for the logged-in user
exports.addQuestion = async (req, res) => {
  try {
    const { id, topic, name, link, difficulty, youtube, done, revisions } = req.body;
    
    const finalId = id || 'q_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
    // Check if question ID already exists for THIS user
    const exists = await Question.findOne({ id: finalId.toString(), user: req.user._id });
    if (exists) {
      return res.status(400).json({ error: 'Question ID already exists for this user' });
    }

    const newQuestion = new Question({
      id: finalId.toString(),
      topic,
      name,
      link,
      difficulty,
      youtube: youtube || '',
      done: done || false,
      revisions: revisions || 0,
      user: req.user._id
    });

    await newQuestion.save();

    // Add reference to User schema
    await User.findByIdAndUpdate(req.user._id, { $push: { questions: newQuestion._id } });

    res.status(201).json({ success: true, question: newQuestion });
  } catch (error) {
    res.status(400).json({ error: 'Failed to create question', details: error.message });
  }
};

// Update question details or status (scoped to the logged-in user)
exports.updateQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedQuestion = await Question.findOneAndUpdate(
      { id: id.toString(), user: req.user._id },
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!updatedQuestion) {
      return res.status(404).json({ error: 'Question not found or unauthorized' });
    }

    res.json({ success: true, question: updatedQuestion });
  } catch (error) {
    res.status(400).json({ error: 'Failed to update question', details: error.message });
  }
};

// Delete a question (scoped to the logged-in user)
exports.deleteQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedQuestion = await Question.findOneAndDelete({ id: id.toString(), user: req.user._id });

    if (!deletedQuestion) {
      return res.status(404).json({ error: 'Question not found or unauthorized' });
    }

    // Remove reference from User schema
    await User.findByIdAndUpdate(req.user._id, { $pull: { questions: deletedQuestion._id } });

    res.json({ success: true, message: 'Question deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete question', details: error.message });
  }
};

// Reset progress for the logged-in user (set all done status to false)
exports.resetProgress = async (req, res) => {
  try {
    await Question.updateMany({ user: req.user._id }, { $set: { done: false } });
    res.json({ success: true, message: 'Progress reset successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to reset progress', details: error.message });
  }
};
