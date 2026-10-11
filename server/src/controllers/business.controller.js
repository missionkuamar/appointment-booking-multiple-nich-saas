import Business from "../models/Business.js";
import User from "../models/User.js";
import generateSlug from "../utils/generateSlug.js";

// Industry ke hisaab se default labels
const industryDefaults = {
  clinic: { clientLabel: "Patient", serviceLabel: "Treatment" },
  salon: { clientLabel: "Client", serviceLabel: "Service" },
  tutor: { clientLabel: "Student", serviceLabel: "Subject" },
  physio: { clientLabel: "Patient", serviceLabel: "Therapy" },
  lawyer: { clientLabel: "Client", serviceLabel: "Case Type" },
  other: { clientLabel: "Client", serviceLabel: "Service" },
};

// @desc    Create/update business profile (onboarding)
// @route   POST /api/business/onboarding
export const onboarding = async (req, res) => {
  try {
    const { businessType, businessName, tagline, address, phone } = req.body;

    if (!businessType || !businessName) {
      return res.status(400).json({ message: "Type and name required" });
    }

    const defaults = industryDefaults[businessType] || industryDefaults.other;

    // Check if business already exists
    let business = await Business.findOne({ ownerId: req.user.id });

    if (business) {
      // Update
      business.businessType = businessType;
      business.businessName = businessName;
      business.tagline = tagline || business.tagline;
      business.address = address || business.address;
      business.phone = phone || business.phone;
      business.labels = defaults;
      business.onboardingComplete = true;
      await business.save();
    } else {
      // Create new
      const slug = generateSlug(businessName);
      business = await Business.create({
        ownerId: req.user.id,
        businessType,
        businessName,
        slug,
        tagline,
        address,
        phone,
        labels: defaults,
        onboardingComplete: true,
      });

      // Link to user
      await User.findByIdAndUpdate(req.user.id, {
        businessId: business._id,
      });
    }

    res.status(201).json(business);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get my business
// @route   GET /api/business/me
export const getMyBusiness = async (req, res) => {
  try {
    const business = await Business.findOne({ ownerId: req.user.id });
    if (!business) {
      return res.status(404).json({ message: "Business not found" });
    }
    res.json(business);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update custom fields
// @route   PUT /api/business/custom-fields
export const updateCustomFields = async (req, res) => {
  try {
    const business = await Business.findOne({ ownerId: req.user.id });
    if (!business) return res.status(404).json({ message: "Business not found" });

    const { customFields } = req.body;

    if (!Array.isArray(customFields)) {
      return res.status(400).json({ message: "customFields must be array" });
    }

    // Validate
    for (const field of customFields) {
      if (!field.label || !field.key) {
        return res
          .status(400)
          .json({ message: "Each field needs label and key" });
      }
    }

    business.customFields = customFields;
    await business.save();

    res.json(business);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};