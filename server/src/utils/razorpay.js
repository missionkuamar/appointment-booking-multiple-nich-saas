import Razorpay from "razorpay";
import dotenv from "dotenv";
import { PLANS } from "../config/planConfig.js";
dotenv.config();

if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
  console.error("❌ RAZORPAY KEYS MISSING in .env");
}

export const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export const initRazorpayPlans = async () => {
  try {
    console.log("🔄 Initializing Razorpay Plans...");
    const existingPlans = await razorpay.plans.all({ count: 100 });
    const existingMap = {};

    existingPlans.items?.forEach((p) => {
      existingMap[p.item.amount] = p;
    });

    for (const [key, plan] of Object.entries(PLANS)) {
      // Skip free / ₹0 plans because Razorpay does not allow ₹0 plans
      if (plan.isFree || !plan.price || plan.price <= 0) {
        PLANS[key].razorpayPlanId = null;
        console.log(`⏭️ Skipping Razorpay plan for free tier: ${plan.name}`);
        continue;
      }

      const amountInPaise = plan.price * 100;

      if (existingMap[amountInPaise]) {
        PLANS[key].razorpayPlanId = existingMap[amountInPaise].id;
        console.log(
          `✅ Plan exists: ${plan.name} (${existingMap[amountInPaise].id})`
        );
      } else {
        const newPlan = await razorpay.plans.create({
          period: plan.period,
          interval: plan.interval,
          item: {
            name: `${plan.name} Plan`,
            amount: amountInPaise,
            currency: "INR",
            description: plan.description,
          },
        });
        PLANS[key].razorpayPlanId = newPlan.id;
        console.log(`🚀 Plan created: ${plan.name} (${newPlan.id})`);
      }
    }

    console.log("✅ All Razorpay Plans initialized!\n");
  } catch (error) {
    console.error(
      "❌ Razorpay Plan init failed:",
      error?.error?.description || error?.message || JSON.stringify(error) || "Unknown error"
    );
  }
};