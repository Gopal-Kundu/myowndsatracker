const express = require('express');
const router = express.Router();
const questionController = require('../controllers/questionController');
const auth = require('../middleware/auth');

// Protect all question routes
router.use(auth);

// GET /api/questions - Fetch all questions for user
router.get('/', questionController.getAllQuestions);

// POST /api/questions - Add a new question
router.post('/', questionController.addQuestion);

// POST /api/questions/reset - Reset progress of all questions
router.post('/reset', questionController.resetProgress);

// PUT /api/questions/:id - Update question details or status
router.put('/:id', questionController.updateQuestion);

// DELETE /api/questions/:id - Delete a question
router.delete('/:id', questionController.deleteQuestion);

module.exports = router;
