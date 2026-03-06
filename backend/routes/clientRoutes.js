const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { organization } = require('../middleware/organization');
const {
  createClient,
  getClients,
  getClientById,
  updateClient,
  deleteClient
} = require('../controllers/clientController');

router.use(protect, organization); // all routes require organization role

router.route('/')
  .post(createClient)
  .get(getClients);

router.route('/:id')
  .get(getClientById)
  .put(updateClient)
  .delete(deleteClient);

module.exports = router;