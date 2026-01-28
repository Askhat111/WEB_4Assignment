const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const open = require('open');  
require('dotenv').config();

const app = express();
app.use(cors({origin:'*'}));
app.use(express.json());
app.use(express.static('public'));
app.set('views', './views');
app.set('view engine', 'html');
app.engine('html', require('ejs').renderFile);

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB:', err));

app.get('/', (req, res) => res.render('index'));
app.use('/api', require('./routes/api'));

const PORT = process.env.PORT || 5000;
const URL = `http://localhost:${PORT}`;

app.listen(PORT, async () => {
  console.log(`Server running → ${URL}`);
});