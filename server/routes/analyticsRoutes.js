
import express from "express";
import Event from "../models/Event.js";

const router = express.Router();

// Default range: the last 7 calendar days, including today.
function getDateRange(query) {
  const now = new Date();

  const start = query.startDate
    ? new Date(`${query.startDate}T00:00:00.000Z`)
    : new Date(Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate() - 6
      ));

  const end = query.endDate
    ? new Date(`${query.endDate}T00:00:00.000Z`)
    : new Date(Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate()
      ));

  const validDate = (value) =>
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    !Number.isNaN(new Date(`${value}T00:00:00.000Z`).getTime()) &&
    new Date(`${value}T00:00:00.000Z`).toISOString().slice(0, 10) === value;

  if (
    (query.startDate && !validDate(query.startDate)) ||
    (query.endDate && !validDate(query.endDate)) ||
    start > end
  ) {
    return null;
  }

  // Exclusive upper boundary includes the entire end date.
  end.setUTCDate(end.getUTCDate() + 1);

  return { start, end };
}

function getTimestampFilter(range) {
  return {
    timestamp: {
      $gte: range.start,
      $lt: range.end
    }
  };
}

// GET /api/analytics/summary
router.get("/summary", async (req, res) => {
  try {
    const range = getDateRange(req.query);

    if (!range) {
      return res.status(400).json({
        success: false,
        message: "Use valid startDate/endDate values (YYYY-MM-DD)"
      });
    }

    const filter = getTimestampFilter(range);

    const [totalEvents, visitorResult, pageViews, orderCount] =
      await Promise.all([
        Event.countDocuments(filter),

        Event.distinct("visitorId", {
          ...filter,
          visitorId: { $nin: [null, ""] }
        }),

        Event.countDocuments({
          ...filter,
          eventName: "page_view"
        }),

        Event.countDocuments({
          ...filter,
          eventName: "order_created"
        })
      ]);

    res.json({
      success: true,
      data: {
        totalEvents,
        uniqueVisitors: visitorResult.length,
        pageViews,
        ordersCreated: orderCount
      }
    });
  } catch (error) {
    console.error("Summary query failed:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to fetch analytics summary"
    });
  }
});

// GET /api/analytics/pages
router.get("/pages", async (req, res) => {
  try {
    const range = getDateRange(req.query);

    if (!range) {
      return res.status(400).json({
        success: false,
        message: "Use valid startDate/endDate values (YYYY-MM-DD)"
      });
    }

    const pages = await Event.aggregate([
      {
        $match: {
          ...getTimestampFilter(range),
          eventName: "page_view",
          path: { $type: "string", $ne: "" }
        }
      },
      {
        $group: {
          _id: "$path",
          views: { $sum: 1 }
        }
      },
      { $sort: { views: -1, _id: 1 } },
      { $limit: 10 },
      {
        $project: {
          _id: 0,
          path: "$_id",
          views: 1
        }
      }
    ]);

    res.json({ success: true, data: pages });
  } catch (error) {
    console.error("Pages query failed:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to fetch popular pages"
    });
  }
});

// GET /api/analytics/trends
router.get("/trends", async (req, res) => {
  try {
    const range = getDateRange(req.query);

    if (!range) {
      return res.status(400).json({
        success: false,
        message: "Use valid startDate/endDate values (YYYY-MM-DD)"
      });
    }

    const trends = await Event.aggregate([
      {
        $match: getTimestampFilter(range)
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$timestamp",
              timezone: "UTC"
            }
          },
          events: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          _id: 0,
          date: "$_id",
          events: 1
        }
      }
    ]);

    res.json({ success: true, data: trends });
  } catch (error) {
    console.error("Trends query failed:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to fetch event trends"
    });
  }
});

export default router;
