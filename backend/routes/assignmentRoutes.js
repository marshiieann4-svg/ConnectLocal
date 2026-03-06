const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { organization } = require('../middleware/organization');
const {
  createAssignment,
  getAssignments,
  updateAssignment
} = require('../controllers/assignmentController');

router.use(protect, organization);

router.route('/')
  .post(createAssignment)
  .get(getAssignments);

router.route('/:id')
  .put(updateAssignment);

module.exports = router;