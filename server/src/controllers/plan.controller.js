import { PLANS } from "../config/planConfig.js";

// @desc    Get all subscription plans
// @route   GET /api/plans
export const getPlans = async (req, res) => {
  try {
    const planList = Object.values(PLANS).map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      price: p.price,
      period: p.period,
      features: p.features,
      limits: p.limits,
      popular: p.popular,
    }));
    res.json(planList);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};