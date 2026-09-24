import { getStore } from "../data/store.js";

// @desc    Get studio analytics & KPIs
// @route   GET /api/analytics
export const getAnalytics = async (req, res) => {
  try {
    const store = getStore();
    const orders = store.orders || [];
    const products = store.products || [];

    const totalRevenue = orders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
    const totalOrders = orders.length;
    const averageOrder = totalOrders > 0 ? (totalRevenue / totalOrders).toFixed(2) : "0.00";
    const lowStockCount = products.filter((p) => p.stock < 10).length;

    return res.json({
      revenue: `$${totalRevenue.toLocaleString()}`,
      orders: totalOrders,
      averageOrder: `$${averageOrder}`,
      lowStock: lowStockCount,
      monthlyBars: [42, 58, 46, 76, 68, 92, 81, 104, 96, 118, 110, 136],
      topProducts: [
        { name: "Cloud Stripe Throw", sales: "$3,842", percentage: "31%" },
        { name: "Everyday Market Tote", sales: "$2,604", percentage: "21%" },
        { name: "Honey Bunny", sales: "$1,968", percentage: "16%" },
        { name: "Ridgeline Beanie", sales: "$1,486", percentage: "12%" },
      ],
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch analytics", error: error.message });
  }
};
