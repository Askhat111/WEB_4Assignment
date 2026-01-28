const express = require('express');
const router = express.Router();
const Measurement = require('../models/Measurement');
const validFields = ['field1', 'field2', 'field3'];

router.get('/measurements', async (req, res) => {
  try {
    const { field, start_date, end_date } = req.query;
    if (field && !validFields.includes(field)) {
      return res.status(400).json({ error: 'Invalid field' });
    }
    
    let startDate, endDate;
    if (start_date) {
      startDate = parseDate(start_date);
      if (!startDate) return res.status(400).json({ error: 'Invalid start_date' });
    }
    
    if (end_date) {
      endDate = parseDate(end_date);
      if (!endDate) return res.status(400).json({ error: 'Invalid end_date' });
    }

    let dateFilter = {};
    if (startDate) dateFilter.$gte = startDate;
    if (endDate) dateFilter.$lte = endDate;
    
    const pipeline = [
      {
        $match: {
          timestamp: Object.keys(dateFilter).length > 0 ? dateFilter : { $exists: true },
          [field]: { $exists: true, $ne: null }
        }
      },
      {
        $project: {
          date: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$timestamp"
            }
          },
          value: `$${field}`,
          timestamp: 1
        }
      },
      {
        $group: {
          _id: "$date",
          avgValue: { $avg: "$value" },
          date: { $first: "$date" },
          timestamp: { $first: "$timestamp" }
        }
      },
      {
        $sort: { timestamp: 1 }
      },
      {
        $project: {
          _id: 0,
          date: 1,
          avgValue: 1,
          timestamp: 1
        }
      }
    ];
    
    const dailyData = await Measurement.aggregate(pipeline);

    const result = dailyData.map(item => ({
      timestamp: item.timestamp,
      [field]: item.avgValue,
      date: item.date
    }));
    
    res.json(result);
    
  } catch (e) { 
    console.error('Error:', e);
    res.status(500).json({ error: 'Server error' }); 
  }
});

router.get('/measurements/metrics', async (req, res) => {
  try {
    const { field, start_date, end_date } = req.query;
    if (!field || !validFields.includes(field)) {
      return res.status(400).json({ error: 'Valid field required' });
    }
    
    let match = { [field]: { $exists: true, $ne: null } };
    
    if (start_date) {
      const startDate = parseDate(start_date);
      if (startDate) {
        match.timestamp = { $gte: startDate };
      }
    }
    
    if (end_date) {
      const endDate = parseDate(end_date);
      if (endDate) {
        match.timestamp = { ...match.timestamp, $lte: endDate };
      }
    }
    
    const result = await Measurement.aggregate([
      { $match: match },
      { 
        $group: { 
          _id: null, 
          avg: { $avg: `$${field}` }, 
          min: { $min: `$${field}` }, 
          max: { $max: `$${field}` }, 
          stdDev: { $stdDevSamp: `$${field}` } 
        } 
      }
    ]);
    
    res.json(result[0] || { avg: 0, min: 0, max: 0, stdDev: 0 });
    
  } catch (e) { 
    console.error('Metrics error:', e);
    res.status(500).json({ error: 'Metrics error' }); 
  }
});

function parseDate(dateStr) {
  if (!dateStr) return null;
  
  let date = new Date(dateStr);
  if (!isNaN(date)) return date;
  
  const parts = dateStr.split('.');
  if (parts.length === 3) {
    date = new Date(parts[2], parts[1] - 1, parts[0]);
    if (!isNaN(date)) return date;
  }
  
  return null;
}

module.exports = router;``