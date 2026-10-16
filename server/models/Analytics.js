
import mongoose from "mongoose";

const analyticsSchema = new mongoose.Schema({
    event: {
        type: String,
        required: true
    },
    value: {
        type: Number,
        required: true
    }
}, {
    timestamps: true
});

const Analytics = mongoose.model("Analytics", analyticsSchema);


export default Analytics;
