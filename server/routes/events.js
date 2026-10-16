
import express from "express";
import Event from "../models/Event.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const {
      eventId,
      eventName,
      source,
      visitorId,
      sessionId,
      path,
      properties,
      timestamp
    } = req.body;

    if (
      typeof eventId !== "string" ||
      !eventId.trim() ||
      typeof eventName !== "string" ||
      !eventName.trim() ||
      !["browser", "server"].includes(source) ||
      typeof timestamp !== "string" ||
      !Number.isFinite(Date.parse(timestamp)) ||
      (properties !== undefined &&
        (properties === null ||
          typeof properties !== "object" ||
          Array.isArray(properties)))
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid event data"
      });
    }

    const event = await Event.create({
      eventId: eventId.trim(),
      eventName: eventName.trim(),
      source,
      visitorId,
      sessionId,
      path,
      properties: properties ?? {},
      timestamp: new Date(timestamp)
    });

    return res.status(201).json({
      success: true,
      message: "Event recorded successfully",
      data: event
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Event has already been recorded"
      });
    }

    console.error("Event ingestion failed:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to record event"
    });
  }
});

export default router;
