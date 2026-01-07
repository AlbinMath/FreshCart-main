const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const deliveryAgentRoutes = require('./routes/deliveryAgentRoutes');

dotenv.config();

const app = express();
const port = process.env.PORT || 5007;

app.use(cors());
app.use(express.json());

// Database Connection
mongoose.connect(process.env.MONGODB_URI_Users)
// Routes
app.use('/api/delivery-agent', deliveryAgentRoutes);

app.get('/', (req, res) => {
    res.send('Delivery Agent Backend is running');
});

app.listen(port, () => {
    console.log(`Server is running on port: ${port}`);
});
