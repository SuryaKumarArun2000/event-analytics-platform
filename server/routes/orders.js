
import express from "express";
import { randomUUID } from "node:crypto";
import Order from "../models/Order.js";
import Event from "../models/Event.js";

const router = express.Router();

const menu = {
  1: { name: "Paneer Tikka", price: 249 },
  2: { name: "Veg Biryani", price: 199 },
  3: { name: "Butter Paneer", price: 279 },
  4: { name: "Chocolate Brownie", price: 129 }
};

router.post("/", async (req, res) => {
  try {
    const { items, visitorId, sessionId } = req.body;

    if (
      !Array.isArray(items) ||
      items.length === 0 ||
      items.length > 20
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide valid order items"
      });
    }

    const orderItems = [];

    for (const item of items) {
      if (
        !Number.isInteger(item.itemId) ||
        !Number.isInteger(item.quantity) ||
        item.quantity < 1 ||
        item.quantity > 20 ||
        !menu[item.itemId]
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid item or quantity"
        });
      }

      const menuItem = menu[item.itemId];

      orderItems.push({
        itemId: item.itemId,
        name: menuItem.name,
        price: menuItem.price,
        quantity: item.quantity
      });
    }

    const totalAmount = orderItems.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );

    const orderId = randomUUID();

    // Save the order first.
    const order = await Order.create({
      orderId,
      items: orderItems,
      totalAmount
    });

    // Record the business event only after saving the order.
    try {
      await Event.create({
        eventId: randomUUID(),
        eventName: "order_created",
        source: "server",
        visitorId:
          typeof visitorId === "string" ? visitorId : null,
        sessionId:
          typeof sessionId === "string" ? sessionId : null,
        path: "/checkout",
        properties: {
          orderId,
          totalAmount,
          itemCount: orderItems.reduce(
            (count, item) => count + item.quantity,
            0
          )
        },
        timestamp: new Date()
      });
    } catch (eventError) {
      // The order is already saved. Don't report it as failed.
      console.error(
        "Order analytics event failed:",
        eventError.message
      );
    }

    return res.status(201).json({
      success: true,
      message: "Order created successfully",
      data: {
        orderId: order.orderId,
        items: order.items,
        totalAmount: order.totalAmount,
        status: order.status
      }
    });
  } catch (error) {
    console.error("Order creation failed:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to create order"
    });
  }
});

export default router;
