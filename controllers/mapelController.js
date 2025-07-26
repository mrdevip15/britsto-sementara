const mapelService = require('../services/mapelService');

class MapelController {
  // Get all Mapel records
  static async getAllMapels(req, res) {
    try {
      const mapels = await mapelService.getAllMapels();
      res.status(200).json(mapels);
    } catch (error) {
      console.error('Error in fetching Mapel records:', error);
      res.status(500).json({ error: 'Failed to fetch Mapel records' });
    }
  }

  // Get a specific Mapel record by ID
  static async getMapelById(req, res) {
    try {
      const mapel = await mapelService.findMapelById(req.params.id);
      if (mapel) {
        res.status(200).json(mapel);
      } else {
        res.status(404).json({ error: 'Mapel not found' });
      }
    } catch (error) {
      console.error('Error in fetching Mapel record:', error);
      res.status(500).json({ error: 'Failed to fetch Mapel record' });
    }
  }

  // Save a new Mapel record
  static async createMapel(req, res) {
    try {
      const newMapel = await mapelService.saveMapel(req.body);
      res.status(201).json(newMapel);
    } catch (error) {
      console.error('Error in creating Mapel record:', error);
      res.status(500).json({ error: 'Failed to create Mapel record' });
    }
  }

  // Update a Mapel record by ID
  static async updateMapel(req, res) {
    try {
      const updatedMapel = await mapelService.updateMapel(req.params.id, req.body);
      if (updatedMapel) {
        res.status(200).json(updatedMapel);
      } else {
        res.status(404).json({ error: 'Mapel not found' });
      }
    } catch (error) {
      console.error('Error in updating Mapel record:', error);
      res.status(500).json({ error: 'Failed to update Mapel record' });
    }
  }

  // Delete a Mapel record by ID
  static async deleteMapel(req, res) {
    try {
      const deleted = await mapelService.deleteMapel(req.params.id);
      if (deleted) {
        res.status(200).json({ message: 'Mapel record deleted successfully' });
      } else {
        res.status(404).json({ error: 'Mapel not found' });
      }
    } catch (error) {
      console.error('Error in deleting Mapel record:', error);
      res.status(500).json({ error: 'Failed to delete Mapel record' });
    }
  }
}

module.exports = MapelController;
