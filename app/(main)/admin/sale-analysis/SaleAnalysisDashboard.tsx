"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

type DashboardProps = {
    todayOrdersCount: number;
    pendingShipmentsCount: number;
    todayRevenue: number;
    monthlyRevenue: number;
    estProfit: number;
    estTax: number;
    lowStockCount: number;
    monthlySalesData: any[];
    visitorsData: any[];
};

export default function SaleAnalysisDashboard({
    todayOrdersCount,
    pendingShipmentsCount,
    todayRevenue,
    monthlyRevenue,
    estProfit,
    estTax,
    lowStockCount,
    monthlySalesData,
    visitorsData
}: DashboardProps) {

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(value);
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

                {/* Card 1: Today's Orders */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <h3 className="tracking-tight text-sm font-medium text-gray-500">Today's Orders</h3>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-gray-500"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                    </div>
                    <div className="text-2xl font-bold text-[#1A1A1A]">{todayOrdersCount}</div>
                    <p className="text-xs text-gray-400 mt-1">+0% from yesterday</p>
                </div>

                {/* Card 2: Pending Shipments */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <h3 className="tracking-tight text-sm font-medium text-gray-500">Pending Shipments</h3>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-gray-500"><rect width="20" height="14" x="2" y="5" rx="2" /><line x1="2" x2="22" y1="10" y2="10" /></svg>
                    </div>
                    <div className="text-2xl font-bold text-[#C8102E]">{pendingShipmentsCount}</div>
                    <p className="text-xs text-gray-400 mt-1">Orders paid & ready</p>
                </div>

                {/* Card 3: Today's Revenue */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <h3 className="tracking-tight text-sm font-medium text-gray-500">Today's Revenue</h3>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-gray-500"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
                    </div>
                    <div className="text-2xl font-bold text-[#1A1A1A]">{formatCurrency(todayRevenue)}</div>
                    <p className="text-xs text-gray-400 mt-1">Daily earnings</p>
                </div>

                {/* Card 4: Monthly Revenue */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <h3 className="tracking-tight text-sm font-medium text-gray-500">Monthly Revenue</h3>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-gray-500"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
                    </div>
                    <div className="text-2xl font-bold text-[#1A1A1A]">{formatCurrency(monthlyRevenue)}</div>
                    <p className="text-xs text-gray-400 mt-1">Current month total</p>
                </div>

                {/* Card 5: Est. Profit */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <h3 className="tracking-tight text-sm font-medium text-gray-500">Est. Profit (30%)</h3>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-gray-500"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>
                    </div>
                    <div className="text-2xl font-bold text-emerald-600">{formatCurrency(estProfit)}</div>
                    <p className="text-xs text-gray-400 mt-1">Based on ~30% margin</p>
                </div>

                {/* Card 6: Estimated Tax */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <h3 className="tracking-tight text-sm font-medium text-gray-500">Est. Tax Collected</h3>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-gray-500"><path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z" /></svg>
                    </div>
                    <div className="text-2xl font-bold text-amber-600">{formatCurrency(estTax)}</div>
                    <p className="text-xs text-gray-400 mt-1">Included in revenue</p>
                </div>

                {/* Card 6: Low Stock */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <h3 className="tracking-tight text-sm font-medium text-gray-500">Low Stock Items</h3>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-gray-500"><path d="M22 12h-6l-2 3h-4l-2-3H2" /><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" /></svg>
                    </div>
                    <div className="text-2xl font-bold text-[#C8102E]">{lowStockCount}</div>
                    <p className="text-xs text-gray-400 mt-1">Products with &lt; 5 stock</p>
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Monthly Sales Chart */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                    <div className="mb-4">
                        <h3 className="text-lg font-bold text-[#1A1A1A]">Monthly Sales Overview</h3>
                        <p className="text-sm text-gray-500">Daily revenue for the current month</p>
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={monthlySalesData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                <XAxis
                                    dataKey="name"
                                    stroke="#9CA3AF"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis
                                    stroke="#9CA3AF"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(value) => `$${value}`}
                                />
                                <RechartsTooltip
                                    contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    formatter={(value: any) => [`$${value}`, 'Revenue']}
                                />
                                <Bar
                                    dataKey="total"
                                    fill="#C8102E"
                                    radius={[4, 4, 0, 0]}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Visitors Chart */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                    <div className="mb-4">
                        <h3 className="text-lg font-bold text-[#1A1A1A]">Visitors Overview</h3>
                        <p className="text-sm text-gray-500">Daily unique visitors (Mock Data)</p>
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={visitorsData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                <XAxis
                                    dataKey="name"
                                    stroke="#9CA3AF"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis
                                    stroke="#9CA3AF"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <RechartsTooltip
                                    contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="visitors"
                                    stroke="#C8102E"
                                    strokeWidth={3}
                                    dot={{ fill: '#C8102E', strokeWidth: 2, r: 4, stroke: '#fff' }}
                                    activeDot={{ r: 6 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}
