
import mongoose from "mongoose";

const eventSchema = new mongoose.Schema(
  {
    eventId: {
      type: String,
      required: true,
      unique: true
    },
    eventName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },
    source: {
      type: String,
      enum: ["browser", "server"],
      required: true
    },
    visitorId: {
      type: String,
      default: null
    },
    sessionId: {
      type: String,
      default: null
    },
    path: {
      type: String,
      default: null
    },
    properties: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    timestamp: {
      type: Date,
      required: true
    },
    receivedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    versionKey: false
  }
);

eventSchema.index({ timestamp: -1 });
eventSchema.index({ eventName: 1, timestamp: -1 });
eventSchema.index({ visitorId: 1, timestamp: -1 });
eventSchema.index({ path: 1, timestamp: -1 });

export default mongoose.model("Event", eventSchema);
