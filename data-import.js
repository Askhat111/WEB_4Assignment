const fs = require('fs');
const csv = require('csv-parser');
const mongoose = require('mongoose');
require('dotenv').config();

async function importData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const Measurement = mongoose.model('Measurement', new mongoose.Schema({
      timestamp: Date,
      field1: Number,
      field2: Number,
      field3: Number
    }), 'measurements');

    await Measurement.deleteMany({});
    console.log('Cleared existing data');

    let batch = [];
    let count = 0;
    let processedCount = 0;

    await new Promise((resolve, reject) => {
      fs.createReadStream('weatherHistory.csv')
        .pipe(csv())
        .on('data', async (row) => {
          processedCount++;
          
          try {
            const ts = new Date(row['Formatted Date']);
            if (!isNaN(ts.getTime())) {
              batch.push({
                updateOne: {
                  filter: { timestamp: ts },
                  update: {
                    $setOnInsert: {
                      timestamp: ts,
                      field1: parseFloat(row['Temperature (C)'] || 0),
                      field2: parseFloat(row['Humidity'] || 0) * 100,
                      field3: parseFloat(row['Apparent Temperature (C)'] || 0)
                    }
                  },
                  upsert: true
                }
              });
            }

            if (batch.length >= 1000) {
              const currentBatch = [...batch];
              batch = []; 
              
              try {
                await Measurement.bulkWrite(currentBatch);
                count += currentBatch.length;
                if (count % 10000 === 0) {
                  console.log(`Processed ${count} records...`);
                }
              } catch (batchError) {
                console.error('Batch error:', batchError);
              }
            }
          } catch (rowError) {
            console.error('Row error:', rowError);
          }
        })
        .on('end', async () => {
          console.log('CSV reading completed');
         
          if (batch.length > 0) {
            try {
              await Measurement.bulkWrite(batch);
              count += batch.length;
              console.log(`Processed final batch of ${batch.length} records`);
            } catch (finalBatchError) {
              console.error('Final batch error:', finalBatchError);
            }
          }
          
          console.log(`Successfully imported ${count} records out of ${processedCount} processed rows`);
          resolve();
        })
        .on('error', (error) => {
          console.error('CSV read error:', error);
          reject(error);
        });
    });

  } catch (error) {
    console.error('Import error:', error);
  } finally {

    setTimeout(async () => {
      await mongoose.disconnect();
      console.log('Disconnected from MongoDB');
      process.exit(0);
    }, 2000);
  }
}

importData();