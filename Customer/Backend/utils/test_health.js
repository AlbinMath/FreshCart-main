const axios = require('axios');

const testHealth = async () => {
    try {
        console.log("Testing Health Check...");
        const response = await axios.get('http://localhost:6000/health');
        console.log("Status:", response.status);
        console.log("Response:", response.data);
    } catch (err) {
        console.error("Health check failed:", err.message);
    }
};

testHealth();
