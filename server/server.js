import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import eventRoutes from "./routes/events.js";
import orderRoutes from "./routes/orders.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());



app.get("/api/health", (req, res) => {
    res.json({
        success: true,
        message: "Analytics API is running"
    });
});


app.use("/api/analytics", analyticsRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/orders", orderRoutes);

const startServer = async () => {
    await connectDB();

    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
};
startServer();