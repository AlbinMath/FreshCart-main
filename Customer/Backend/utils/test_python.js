const axios = require('axios');

const testPythonService = async () => {
    try {
        console.log("Testing Python Analysis Service (127.0.0.1)...");
        // Test health first
        try {
            const h = await axios.get('http://127.0.0.1:6000/health');
            console.log("Health Check:", h.data);
        } catch (e) {
            console.log("Health Check failed (expected if old version running)");
        }

        const response = await axios.post('http://127.0.0.1:6000/analyze-reviews', {
            reviews: [
                { reviewText: "This product is amazing and very fresh!" },
                { reviewText: "Quality is good but delivery was slow." }
            ]
        });
        console.log("Response from Python:", JSON.stringify(response.data, null, 2));
    } catch (err) {
        console.error("Connection failed:", err.message);
        if (err.response) console.log("Data:", err.response.data);
    }
};

testPythonService();
