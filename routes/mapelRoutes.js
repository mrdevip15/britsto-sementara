const express = require('express');
const MapelController = require('../controllers/mapelController');

const router = express.Router();

// Define routes and map them to controller methods
router.get('/mapel', MapelController.getAllMapels);
router.get('/mapel/:id', MapelController.getMapelById);
router.post('/mapel', MapelController.createMapel);
router.put('/mapel/:id', MapelController.updateMapel);
router.delete('/mapel/:id', MapelController.deleteMapel);

module.exports = router;
