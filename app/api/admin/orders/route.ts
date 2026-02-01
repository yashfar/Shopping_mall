import { NextResponse } from "next/server";
import { auth } from "@@/lib/auth-helper";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/admin/orders
 * Returns all orders (admin only)
 * Query params:
 *  - status: Filter by order status (pending, ready_to_ship, shipped, delivered, cancelled)
 */
export async function GET(request: Request) {
    const session = await auth();

    if (!session || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        const { searchParams } = new URL(request.url);
        const statusFilter = searchParams.get("status");
        const search = searchParams.get("search");

        // Build where clause based on filter
        let whereClause: any = {};

        if (statusFilter) {
            switch (statusFilter) {
                case "pending":
                    whereClause.status = "PENDING";
                    break;
                case "ready_to_ship":
                    whereClause.status = "PAID";
                    break;
                case "shipped":
                    whereClause.status = "SHIPPED";
                    break;
                case "delivered":
                    whereClause.status = "COMPLETED";
                    break;
                case "cancelled":
                    whereClause.status = "CANCELED";
                    break;
                // If invalid filter, ignore it and show all
            }
        }

        if (search) {
            const isNumeric = /^\d+$/.test(search);

            if (isNumeric) {
                // Search by orderNumber
                whereClause.orderNumber = {
                    contains: search,
                };
            } else {
                // Search by user name or email
                whereClause.OR = [
                    {
                        user: {
                            name: {
                                contains: search,
                                mode: "insensitive",
                            },
                        },
                    },
                    {
                        user: {
                            email: {
                                contains: search,
                                mode: "insensitive",
                            },
                        },
                    },
                ];
            }
        }

        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "15");
        const skip = (page - 1) * limit;

        const sort = searchParams.get("sort") || "date";
        const order = searchParams.get("order") || "desc";

        let orderByClause: any = {};
        if (sort === "total") {
            orderByClause = { total: order };
        } else {
            orderByClause = { createdAt: order };
        }

        const orders = await prisma.order.findMany({
            where: whereClause,
            include: {
                user: {
                    select: {
                        email: true,
                    },
                },
            },
            orderBy: orderByClause,
            take: limit,
            skip: skip,
        });

        const totalOrders = await prisma.order.count({ where: whereClause });
        const hasMore = skip + orders.length < totalOrders;

        return NextResponse.json({ orders, hasMore });
    } catch (error) {
        console.error("Error fetching orders:", error);
        return NextResponse.json(
            { error: "Failed to fetch orders" },
            { status: 500 }
        );
    }
}
