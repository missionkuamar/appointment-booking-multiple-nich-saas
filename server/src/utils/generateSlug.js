import crypto from "crypto";
import Business from "../models/Business.js";

const generateSlug = async (name = "") => {
  const base =
    String(name)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "") || "business";

  while (true) {
    const random = crypto.randomBytes(3).toString("hex"); // 6-char random string
    const slug = `${base}-${random}`;
    const exists = await Business.exists({ slug });
    if (!exists) return slug;
  }
};

export default generateSlug;