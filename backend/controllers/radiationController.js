const RadiationMeasurement = require('../models/RadiationMeasurement');
const RadiationLocation = require('../models/RadiationLocation');
const logger = require('../config/logger');
const { escapeRegex } = require('../utils/regex');

// ─── Locations ────────────────────────────────────────────────────────────────

const createLocation = async (req, res) => {
  try {
    const { name, description, coordinates } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Location name is required', code: 'VALIDATION_ERROR' });
    }
    const location = new RadiationLocation({
      userId: req.user._id,
      name: name.trim(),
      description: description ? description.trim() : '',
      coordinates: {
        lat: coordinates?.lat ?? null,
        lng: coordinates?.lng ?? null
      }
    });
    await location.save();
    logger.info(`Radiation location created: ${location.name} (user: ${req.user.email})`);
    res.status(201).json(location);
  } catch (error) {
    logger.error('Create radiation location error:', error);
    res.status(500).json({ error: 'Failed to create location', code: 'SERVER_ERROR' });
  }
};

const getLocations = async (req, res) => {
  try {
    const locations = await RadiationLocation.find({ userId: req.user._id }).sort({ name: 1 });
    res.json(locations);
  } catch (error) {
    logger.error('Get radiation locations error:', error);
    res.status(500).json({ error: 'Failed to fetch locations', code: 'SERVER_ERROR' });
  }
};

const updateLocation = async (req, res) => {
  try {
    const { name, description, coordinates } = req.body;
    const updates = {};
    if (name !== undefined) updates.name = name.trim();
    if (description !== undefined) updates.description = description.trim();
    if (coordinates !== undefined) updates.coordinates = coordinates;

    const location = await RadiationLocation.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { $set: updates },
      { new: true, runValidators: true }
    );
    if (!location) return res.status(404).json({ error: 'Location not found', code: 'NOT_FOUND' });
    res.json(location);
  } catch (error) {
    logger.error('Update radiation location error:', error);
    res.status(500).json({ error: 'Failed to update location', code: 'SERVER_ERROR' });
  }
};

const deleteLocation = async (req, res) => {
  try {
    const location = await RadiationLocation.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!location) return res.status(404).json({ error: 'Location not found', code: 'NOT_FOUND' });
    logger.info(`Radiation location deleted: ${location.name} (user: ${req.user.email})`);
    res.json({ message: 'Location deleted' });
  } catch (error) {
    logger.error('Delete radiation location error:', error);
    res.status(500).json({ error: 'Failed to delete location', code: 'SERVER_ERROR' });
  }
};

// ─── Measurements ─────────────────────────────────────────────────────────────

const createMeasurement = async (req, res) => {
  try {
    const {
      date, timeStart, timeEnd, locationId, locationName,
      averageLevel, peakLevel, comments, notes, tags, status, isPublic
    } = req.body;

    if (averageLevel === undefined || averageLevel === null) {
      return res.status(400).json({ error: 'Average radiation level is required', code: 'VALIDATION_ERROR' });
    }
    if (!date) {
      return res.status(400).json({ error: 'Date is required', code: 'VALIDATION_ERROR' });
    }

    let resolvedLocationName = locationName || '';
    if (locationId) {
      const loc = await RadiationLocation.findOne({ _id: locationId, userId: req.user._id });
      if (!loc) return res.status(404).json({ error: 'Location not found', code: 'NOT_FOUND' });
      resolvedLocationName = loc.name;
    }

    const measurement = new RadiationMeasurement({
      userId: req.user._id,
      createdBy: req.user._id,
      date: new Date(date),
      timeStart: timeStart || '',
      timeEnd: timeEnd || '',
      locationId: locationId || null,
      locationName: resolvedLocationName,
      averageLevel: parseFloat(averageLevel),
      peakLevel: peakLevel !== undefined && peakLevel !== null ? parseFloat(peakLevel) : null,
      comments: comments || '',
      notes: notes || '',
      tags: tags ? (Array.isArray(tags) ? tags : [tags]) : [],
      status: status || 'Draft',
      isPublic: isPublic === true || isPublic === 'true'
    });
    await measurement.save();
    logger.info(`Radiation measurement created (user: ${req.user.email})`);
    res.status(201).json(measurement);
  } catch (error) {
    logger.error('Create radiation measurement error:', error);
    res.status(500).json({ error: 'Failed to create measurement', code: 'SERVER_ERROR' });
  }
};

const getMeasurements = async (req, res) => {
  try {
    const { status, locationId, dateFrom, dateTo, tags, search, page = 1, limit = 50, showDeleted } = req.query;
    const query = { userId: req.user._id };

    if (showDeleted === 'true') {
      query.isDeleted = true;
    } else {
      query.isDeleted = false;
    }

    if (status) query.status = String(status);
    if (locationId) query.locationId = String(locationId);
    if (dateFrom || dateTo) {
      query.date = {};
      if (dateFrom) query.date.$gte = new Date(dateFrom);
      if (dateTo) query.date.$lte = new Date(dateTo);
    }
    if (tags) {
      const tagArr = Array.isArray(tags) ? tags : tags.split(',');
      query.tags = { $in: tagArr };
    }
    if (search) {
      const safeSearch = escapeRegex(search);
      query.$or = [
        { comments: { $regex: safeSearch, $options: 'i' } },
        { notes: { $regex: safeSearch, $options: 'i' } },
        { locationName: { $regex: safeSearch, $options: 'i' } },
        { tags: { $regex: safeSearch, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [measurements, total] = await Promise.all([
      RadiationMeasurement.find(query).sort({ date: -1 }).skip(skip).limit(parseInt(limit)),
      RadiationMeasurement.countDocuments(query)
    ]);

    res.json({ measurements, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (error) {
    logger.error('Get radiation measurements error:', error);
    res.status(500).json({ error: 'Failed to fetch measurements', code: 'SERVER_ERROR' });
  }
};

const getPublicMeasurements = async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [measurements, total] = await Promise.all([
      RadiationMeasurement.find({ isPublic: true, isDeleted: false })
        .sort({ date: -1 }).skip(skip).limit(parseInt(limit)),
      RadiationMeasurement.countDocuments({ isPublic: true, isDeleted: false })
    ]);
    res.json({ measurements, total });
  } catch (error) {
    logger.error('Get public radiation measurements error:', error);
    res.status(500).json({ error: 'Failed to fetch public measurements', code: 'SERVER_ERROR' });
  }
};

const updateMeasurement = async (req, res) => {
  try {
    const {
      date, timeStart, timeEnd, locationId, locationName,
      averageLevel, peakLevel, comments, notes, tags, status, isPublic
    } = req.body;

    const measurement = await RadiationMeasurement.findOne({
      _id: req.params.id, userId: req.user._id, isDeleted: false
    });
    if (!measurement) return res.status(404).json({ error: 'Measurement not found', code: 'NOT_FOUND' });

    if (date !== undefined) measurement.date = new Date(date);
    if (timeStart !== undefined) measurement.timeStart = timeStart;
    if (timeEnd !== undefined) measurement.timeEnd = timeEnd;
    if (averageLevel !== undefined) measurement.averageLevel = parseFloat(averageLevel);
    if (peakLevel !== undefined) measurement.peakLevel = peakLevel !== null ? parseFloat(peakLevel) : null;
    if (comments !== undefined) measurement.comments = comments;
    if (notes !== undefined) measurement.notes = notes;
    if (tags !== undefined) measurement.tags = Array.isArray(tags) ? tags : [tags];
    if (status !== undefined) measurement.status = status;
    if (isPublic !== undefined) measurement.isPublic = isPublic === true || isPublic === 'true';

    if (locationId !== undefined) {
      measurement.locationId = locationId || null;
      if (locationId) {
        const loc = await RadiationLocation.findOne({ _id: locationId, userId: req.user._id });
        measurement.locationName = loc ? loc.name : (locationName || '');
      } else {
        measurement.locationName = locationName || '';
      }
    }

    measurement.updatedBy = req.user._id;
    await measurement.save();
    res.json(measurement);
  } catch (error) {
    logger.error('Update radiation measurement error:', error);
    res.status(500).json({ error: 'Failed to update measurement', code: 'SERVER_ERROR' });
  }
};

const softDeleteMeasurement = async (req, res) => {
  try {
    const { reason } = req.body;
    const measurement = await RadiationMeasurement.findOne({
      _id: req.params.id, userId: req.user._id, isDeleted: false
    });
    if (!measurement) return res.status(404).json({ error: 'Measurement not found', code: 'NOT_FOUND' });

    measurement.isDeleted = true;
    measurement.deletedBy = req.user._id;
    measurement.deletedAt = new Date();
    measurement.deletedReason = reason || '';
    measurement.deletedComments = measurement.comments;
    measurement.deletedTags = [...measurement.tags];
    measurement.deletedStatus = measurement.status;
    await measurement.save();
    logger.info(`Radiation measurement soft-deleted (user: ${req.user.email})`);
    res.json({ message: 'Measurement deleted' });
  } catch (error) {
    logger.error('Soft delete radiation measurement error:', error);
    res.status(500).json({ error: 'Failed to delete measurement', code: 'SERVER_ERROR' });
  }
};

const hardDeleteMeasurement = async (req, res) => {
  try {
    const measurement = await RadiationMeasurement.findOneAndDelete({
      _id: req.params.id, userId: req.user._id
    });
    if (!measurement) return res.status(404).json({ error: 'Measurement not found', code: 'NOT_FOUND' });
    logger.info(`Radiation measurement hard-deleted (user: ${req.user.email})`);
    res.json({ message: 'Measurement permanently deleted' });
  } catch (error) {
    logger.error('Hard delete radiation measurement error:', error);
    res.status(500).json({ error: 'Failed to permanently delete measurement', code: 'SERVER_ERROR' });
  }
};

const restoreMeasurement = async (req, res) => {
  try {
    const measurement = await RadiationMeasurement.findOne({
      _id: req.params.id, userId: req.user._id, isDeleted: true
    });
    if (!measurement) return res.status(404).json({ error: 'Measurement not found', code: 'NOT_FOUND' });

    measurement.isDeleted = false;
    measurement.deletedBy = null;
    measurement.deletedAt = null;
    measurement.deletedReason = '';
    measurement.deletedComments = '';
    measurement.deletedTags = [];
    measurement.deletedStatus = '';
    measurement.updatedBy = req.user._id;
    await measurement.save();
    res.json(measurement);
  } catch (error) {
    logger.error('Restore radiation measurement error:', error);
    res.status(500).json({ error: 'Failed to restore measurement', code: 'SERVER_ERROR' });
  }
};

const toggleVisibility = async (req, res) => {
  try {
    const measurement = await RadiationMeasurement.findOne({
      _id: req.params.id, userId: req.user._id, isDeleted: false
    });
    if (!measurement) return res.status(404).json({ error: 'Measurement not found', code: 'NOT_FOUND' });
    measurement.isPublic = !measurement.isPublic;
    measurement.updatedBy = req.user._id;
    await measurement.save();
    res.json(measurement);
  } catch (error) {
    logger.error('Toggle visibility error:', error);
    res.status(500).json({ error: 'Failed to toggle visibility', code: 'SERVER_ERROR' });
  }
};

// ─── Analytics ────────────────────────────────────────────────────────────────

const getTimeSeries = async (req, res) => {
  try {
    const { dateFrom, dateTo, locationId } = req.query;
    const query = { userId: req.user._id, isDeleted: false };
    if (dateFrom || dateTo) {
      query.date = {};
      if (dateFrom) query.date.$gte = new Date(dateFrom);
      if (dateTo) query.date.$lte = new Date(dateTo);
    }
    if (locationId) query.locationId = locationId;

    const measurements = await RadiationMeasurement.find(query)
      .select('date averageLevel peakLevel locationName')
      .sort({ date: 1 });

    res.json({ series: measurements });
  } catch (error) {
    logger.error('Radiation time-series error:', error);
    res.status(500).json({ error: 'Failed to fetch time-series data', code: 'SERVER_ERROR' });
  }
};

const getByLocation = async (req, res) => {
  try {
    const data = await RadiationMeasurement.aggregate([
      { $match: { userId: req.user._id, isDeleted: false, locationName: { $ne: '' } } },
      {
        $group: {
          _id: '$locationName',
          locationId: { $first: '$locationId' },
          avgLevel: { $avg: '$averageLevel' },
          maxPeak: { $max: '$peakLevel' },
          count: { $sum: 1 }
        }
      },
      { $sort: { avgLevel: -1 } }
    ]);
    res.json({ data });
  } catch (error) {
    logger.error('Radiation by-location error:', error);
    res.status(500).json({ error: 'Failed to fetch location data', code: 'SERVER_ERROR' });
  }
};

const getHeatmap = async (req, res) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31, 23, 59, 59);

    const data = await RadiationMeasurement.aggregate([
      {
        $match: {
          userId: req.user._id,
          isDeleted: false,
          date: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          avgLevel: { $avg: '$averageLevel' },
          maxPeak: { $max: '$peakLevel' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    res.json({ heatmap: data, year });
  } catch (error) {
    logger.error('Radiation heatmap error:', error);
    res.status(500).json({ error: 'Failed to fetch heatmap data', code: 'SERVER_ERROR' });
  }
};

module.exports = {
  createLocation,
  getLocations,
  updateLocation,
  deleteLocation,
  createMeasurement,
  getMeasurements,
  getPublicMeasurements,
  updateMeasurement,
  softDeleteMeasurement,
  hardDeleteMeasurement,
  restoreMeasurement,
  toggleVisibility,
  getTimeSeries,
  getByLocation,
  getHeatmap
};
