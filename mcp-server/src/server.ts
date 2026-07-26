import { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";
import jwt from "jsonwebtoken";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const backendRequire = createRequire(new URL("../../backend/package.json", import.meta.url));
export const backendMongoose = backendRequire("mongoose");
const MenuService = require("../../backend/services/MenuService");
const CartService = require("../../backend/services/CartService");
const ReservationService = require("../../backend/services/ReservationService");
const OrderService = require("../../backend/services/OrderService");

export type Actor = { userId: string; role: string } | null;
const objectId = z.string().regex(/^[a-f\d]{24}$/i, "A valid item id is required");

export function actorFromToken(token?: string): Actor {
  if (!token) return null;
  const payload: any = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET!);
  const legacy = payload.user?.user || payload.user;
  const userId = payload.userId || legacy?._id;
  if (!userId) throw new Error("Invalid authentication token");
  return { userId: String(userId), role: payload.role || legacy?.role || "user" };
}

export function compact(value: any): any {
  if (value == null) return value;
  if (Array.isArray(value)) return value.map(compact);
  if (value instanceof Date) return value.toISOString();
  if (value?._bsontype === "ObjectId" && typeof value.toHexString === "function") return value.toHexString();
  if (typeof value.toObject === "function") return compact(value.toObject());
  if (typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value)
    .filter(([key]) => !["__v", "password", "userId"].includes(key))
    .map(([key, item]) => [key === "_id" ? "id" : key, compact(item)]));
}

const result = (data: any) => {
  const safe = compact(data);
  return { content: [{ type: "text" as const, text: JSON.stringify(safe) }], structuredContent: safe };
};

export function createCafeServer(actor: Actor) {
  const server = new McpServer(
    { name: "brewbake-cafe", version: "1.0.0" },
    { instructions: "Use read tools immediately. Write tools are only called after the website confirms the action." }
  );
  const user = () => {
    if (!actor) throw new Error("Authentication is required");
    return actor;
  };
  const admin = () => {
    const current = user();
    if (current.role !== "admin") throw new Error("Admin access is required");
    return current;
  };

  server.registerResource("cafe-info", "cafe://info", {
    title: "Bake N Brew cafe information",
    description: "Opening hours and reservation policy",
    mimeType: "application/json",
  }, async () => ({
    contents: [{ uri: "cafe://info", mimeType: "application/json", text: JSON.stringify({
      timezone: "Asia/Kolkata", hours: "09:00-22:00 daily", reservationDurationMinutes: 90,
    }) }],
  }));

  server.registerTool("search_menu", {
    description: "Search active cafe menu items by name or category.",
    inputSchema: z.object({
      query: z.string().trim().max(80).optional(),
      category: z.string().trim().max(40).optional(),
      availableOnly: z.boolean().default(true),
    }),
    annotations: { readOnlyHint: true },
  }, async (args) => result((await MenuService.searchMenu(args)).slice(0, 12)));

  if (actor) {
    server.registerTool("get_cart", {
      description: "Get the signed-in user's cart.", inputSchema: z.object({}),
      annotations: { readOnlyHint: true },
    }, async () => result(await CartService.getCart(user().userId)));
    server.registerTool("add_to_cart", {
      description: "Add a menu item to the signed-in user's cart.",
      inputSchema: z.object({ foodId: objectId, quantity: z.number().int().min(1).max(20) }),
      annotations: { readOnlyHint: false },
    }, async ({ foodId, quantity }) => result(await CartService.addItem(user().userId, foodId, quantity)));
    server.registerTool("add_items_to_cart", {
      description: "Add multiple menu items to the signed-in user's cart in one operation.",
      inputSchema: z.object({
        items: z.array(z.object({
          foodId: objectId,
          quantity: z.number().int().min(1).max(20),
        })).min(1).max(10),
      }),
      annotations: { readOnlyHint: false },
    }, async ({ items }) => result(await CartService.addItems(user().userId, items)));
    server.registerTool("remove_from_cart", {
      description: "Remove a menu item from the signed-in user's cart.",
      inputSchema: z.object({ foodId: objectId }), annotations: { readOnlyHint: false },
    }, async ({ foodId }) => result(await CartService.removeItem(user().userId, foodId)));
    server.registerTool("check_reservation_availability", {
      description: "Check tables for a party at a local cafe date and time.",
      inputSchema: z.object({
        partySize: z.number().int().min(1).max(12),
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        time: z.string().regex(/^\d{2}:\d{2}$/),
      }), annotations: { readOnlyHint: true },
    }, async (args) => result(await ReservationService.checkAvailability(args)));
    server.registerTool("create_reservation", {
      description: "Create a confirmed reservation for the signed-in user.",
      inputSchema: z.object({
        partySize: z.number().int().min(1).max(12),
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        time: z.string().regex(/^\d{2}:\d{2}$/),
        tableId: objectId.optional(),
      }), annotations: { readOnlyHint: false },
    }, async (args) => result(await ReservationService.createReservation({ ...args, userId: user().userId })));
    server.registerTool("list_my_reservations", {
      description: "List the signed-in user's confirmed reservations.",
      inputSchema: z.object({}), annotations: { readOnlyHint: true },
    }, async () => result(await ReservationService.listMyReservations(user().userId)));
    server.registerTool("create_order_from_cart", {
      description: "Create an order from and clear the signed-in user's cart.",
      inputSchema: z.object({}), annotations: { readOnlyHint: false },
    }, async () => result(await OrderService.createOrderFromCart(user().userId)));
    server.registerTool("list_my_orders", {
      description: "List the signed-in user's recent order history.",
      inputSchema: z.object({}), annotations: { readOnlyHint: true },
    }, async () => result(await OrderService.listMyOrders(user().userId)));
  }

  if (actor?.role === "admin") {
    server.registerTool("admin_create_menu_item", {
      description: "Create a menu item. Requires an existing public image URL.",
      inputSchema: z.object({
        name: z.string().trim().min(2).max(80), description: z.string().trim().min(2).max(300),
        price: z.number().positive().max(10000), category: z.string().trim().min(2).max(40),
        image: z.string().url(),
      }), annotations: { readOnlyHint: false },
    }, async (args) => { admin(); return result(await MenuService.createMenuItem(args)); });
    server.registerTool("admin_set_menu_item_availability", {
      description: "Set whether a menu item is available.",
      inputSchema: z.object({ foodId: objectId, isAvailable: z.boolean() }),
      annotations: { readOnlyHint: false },
    }, async ({ foodId, isAvailable }) => { admin(); return result(await MenuService.setMenuItemAvailability(foodId, isAvailable)); });
    server.registerTool("admin_archive_menu_item", {
      description: "Archive a menu item.", inputSchema: z.object({ foodId: objectId }),
      annotations: { readOnlyHint: false, destructiveHint: true },
    }, async ({ foodId }) => { admin(); return result(await MenuService.archiveMenuItem(foodId)); });
  }
  return server;
}
