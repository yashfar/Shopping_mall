import { auth } from "@@/lib/auth-helper";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import SaleAnalysisDashboard from "./SaleAnalysisDashboard";
import { getTranslations } from "next-intl/server";

export default async function SaleAnalysisPage() {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") redirect("/");

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // parallel fetch
    const [
        todayOrdersCount,
        pendingShipmentsCount,
        todayRevenueAgg,
        monthlyRevenueAgg,
        lowStockCount,
        monthOrders,
        paymentConfig
    ] = await Promise.all([
        // 1. Today's orders (all inclusive)
        prisma.order.count({
            where: { createdAt: { gte: startOfToday } }
        }),
        // 2. Orders waiting to be shipped (PAID)
        prisma.order.count({
            where: { status: "PAID" }
        }),
        // 3. Today's revenue (Paid/Completed only)
        prisma.order.aggregate({
            _sum: { total: true },
            where: {
                createdAt: { gte: startOfToday },
                status: { in: ["PAID", "SHIPPED", "COMPLETED"] }
            }
        }),
        // 4. Monthly revenue
        prisma.order.aggregate({
            _sum: { total: true },
            where: {
                createdAt: { gte: startOfMonth },
                status: { in: ["PAID", "SHIPPED", "COMPLETED"] }
            }
        }),
        // 6. Low stock
        prisma.product.count({
            where: { stock: { lt: 5 } }
        }),
        // For Chart: Fetch valid orders this month
        prisma.order.findMany({
            where: {
                createdAt: { gte: startOfMonth },
                status: { in: ["PAID", "SHIPPED", "COMPLETED"] }
            },
            select: { createdAt: true, total: true }
        }),
        // 7. Payment Config for Tax
        prisma.paymentConfig.findFirst()
    ]);

    const todayRevenue = (todayRevenueAgg._sum?.total || 0) / 100;
    const monthlyRevenue = (monthlyRevenueAgg._sum?.total || 0) / 100;
    const estProfit = monthlyRevenue * 0.3; // 30% margin assumption
    const estTax = monthlyRevenue * ((paymentConfig?.taxPercent || 0) / 100);

    // Process monthly sales chart data
    const salesMap = new Map();
    // Initialize all days of month to 0 so chart is complete
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    for (let i = 1; i <= daysInMonth; i++) {
        salesMap.set(i, 0);
    }

    monthOrders.forEach(order => {
        const day = order.createdAt.getDate();
        salesMap.set(day, (salesMap.get(day) || 0) + (order.total / 100));
    });

    const monthlySalesData = Array.from(salesMap.entries()).map(([day, total]) => ({
        name: `${now.toLocaleString('default', { month: 'short' })} ${day}`,
        total: total
    }));

    // Mock visitors
    const visitorsData = Array.from({ length: daysInMonth }, (_, i) => ({
        name: `${now.toLocaleString('default', { month: 'short' })} ${i + 1}`,
        visitors: Math.floor(Math.random() * 150) + 50
    }));

    const t = await getTranslations("saleAnalysis");

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="mb-8">
                <h1 className="text-3xl font-black text-gray-900 tracking-tight">{t("title")}</h1>
                <p className="text-gray-500 mt-1 font-medium">{t("subtitle")}</p>
            </div>

            <SaleAnalysisDashboard
                todayOrdersCount={todayOrdersCount}
                pendingShipmentsCount={pendingShipmentsCount}
                todayRevenue={todayRevenue}
                monthlyRevenue={monthlyRevenue}
                estProfit={estProfit}
                estTax={estTax}
                lowStockCount={lowStockCount}
                monthlySalesData={monthlySalesData}
                visitorsData={visitorsData}
                labels={{
                    todayOrders: t("todayOrders"),
                    fromYesterday: t("fromYesterday"),
                    pendingShipments: t("pendingShipments"),
                    ordersReady: t("ordersReady"),
                    todayRevenue: t("todayRevenue"),
                    dailyEarnings: t("dailyEarnings"),
                    monthlyRevenue: t("monthlyRevenue"),
                    currentMonthTotal: t("currentMonthTotal"),
                    estProfit: t("estProfit"),
                    basedOnMargin: t("basedOnMargin"),
                    estTax: t("estTax"),
                    includedInRevenue: t("includedInRevenue"),
                    lowStockItems: t("lowStockItems"),
                    lowStockDesc: t("lowStockDesc"),
                    monthlySalesTitle: t("monthlySalesTitle"),
                    monthlySalesDesc: t("monthlySalesDesc"),
                    visitorsTitle: t("visitorsTitle"),
                    visitorsDesc: t("visitorsDesc"),
                    revenueLabel: t("revenueLabel"),
                }}
            />
        </div>
    );
}
