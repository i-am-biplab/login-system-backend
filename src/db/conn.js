const mongoose = require("mongoose");

mongoose.connect(process.env.DB_HOST).then(() => {
    console.log("Connected to MongoDB");
}).catch((error) => {
    console.log(`Error connecting to MongoDB: ${error}`);
});