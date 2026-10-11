import User from "../models/User.js";
import Business from "../models/Business.js";

// @desc    Add staff
// @route   POST /api/staff
export const addStaff = async (req, res) => {
  try {
    const business = await Business.findOne({ ownerId: req.user.id });
    if (!business) return res.status(404).json({ message: "Business not found" });

    const { name, email, password, staffTitle } = req.body;

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: "name, email, password required" });
    }

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: "Email already exists" });

    const staff = await User.create({
      name,
      email,
      password,
      role: "staff",
      staffTitle: staffTitle || "",
      businessId: business._id,
    });

    res.status(201).json({
      _id: staff._id,
      name: staff.name,
      email: staff.email,
      staffTitle: staff.staffTitle,
      role: staff.role,
      isActive: staff.isActive,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get my staff
// @route   GET /api/staff
export const getMyStaff = async (req, res) => {
  try {
    const business = await Business.findOne({ ownerId: req.user.id });
    if (!business) return res.status(404).json({ message: "Business not found" });

    const staff = await User.find({
      businessId: business._id,
      role: "staff",
    }).select("-password");

    res.json(staff);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update staff
// @route   PATCH /api/staff/:id
export const updateStaff = async (req, res) => {
  try {
    const business = await Business.findOne({ ownerId: req.user.id });
    if (!business) return res.status(404).json({ message: "Business not found" });

    const { name, staffTitle, isActive } = req.body;

    const staff = await User.findOne({
      _id: req.params.id,
      businessId: business._id,
      role: "staff",
    });

    if (!staff) return res.status(404).json({ message: "Staff not found" });

    if (name) staff.name = name;
    if (staffTitle !== undefined) staff.staffTitle = staffTitle;
    if (isActive !== undefined) staff.isActive = isActive;

    await staff.save();

    res.json({
      _id: staff._id,
      name: staff.name,
      email: staff.email,
      staffTitle: staff.staffTitle,
      isActive: staff.isActive,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete staff
// @route   DELETE /api/staff/:id
export const deleteStaff = async (req, res) => {
  try {
    const business = await Business.findOne({ ownerId: req.user.id });
    if (!business) return res.status(404).json({ message: "Business not found" });

    await User.findOneAndDelete({
      _id: req.params.id,
      businessId: business._id,
      role: "staff",
    });

    res.json({ message: "Staff removed" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};