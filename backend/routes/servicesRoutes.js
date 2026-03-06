const express = require('express');
const router = express.Router();
const {
  getServices,
  getServiceById,
  createService,
  updateService,
  deleteService,
  applyForService,
  acceptOffer
} = require('../controllers/serviceController');
const { protect } = require('../middleware/auth');

router.route('/')
  .get(getServices)
  .post(protect, createService);

router.route('/:id')
  .get(getServiceById)
  .put(protect, updateService)
  .delete(protect, deleteService);

router.post('/:id/apply', protect, applyForService);
router.put('/:serviceId/accept-offer/:offerId', protect, acceptOffer);

module.exports = router;