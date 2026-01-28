const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  timestamp: { type: Date, required: true },
  field1: Number,  // Temperature
  field2: Number,  // Humidity
  field3: Number   // Apparent Temp
});
module.exports = mongoose.model('Measurement', schema);
