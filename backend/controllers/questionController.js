const Question = require('../models/Question');

// Get all questions
exports.getAllQuestions = async (req, res) => {
  try {
    const questions = await Question.find({});
    res.json(questions);
  } catch (error) {
    res.status(500).json({ error: 'Server error while fetching questions', details: error.message });
  }
};

// Add a new question
exports.addQuestion = async (req, res) => {
  try {
    const { id, topic, name, link, difficulty, done } = req.body;
    
    // Check if ID already exists
    const finalId = id || 'q_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    const exists = await Question.findOne({ id: finalId.toString() });
    if (exists) {
      return res.status(400).json({ error: 'Question ID already exists' });
    }

    const newQuestion = new Question({
      id: finalId.toString(),
      topic,
      name,
      link,
      difficulty,
      done: done || false
    });

    await newQuestion.save();
    res.status(201).json({ success: true, question: newQuestion });
  } catch (error) {
    res.status(400).json({ error: 'Failed to create question', details: error.message });
  }
};

// Update question details or status
exports.updateQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedQuestion = await Question.findOneAndUpdate(
      { id: id.toString() },
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!updatedQuestion) {
      return res.status(404).json({ error: 'Question not found' });
    }

    res.json({ success: true, question: updatedQuestion });
  } catch (error) {
    res.status(400).json({ error: 'Failed to update question', details: error.message });
  }
};

// Delete a question
exports.deleteQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedQuestion = await Question.findOneAndDelete({ id: id.toString() });

    if (!deletedQuestion) {
      return res.status(404).json({ error: 'Question not found' });
    }

    res.json({ success: true, message: 'Question deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete question', details: error.message });
  }
};

// Reset progress (set all done status to false)
exports.resetProgress = async (req, res) => {
  try {
    await Question.updateMany({}, { $set: { done: false } });
    res.json({ success: true, message: 'Progress reset successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to reset progress', details: error.message });
  }
};

