import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { saveBusiness } from "../features/business/businessSlice";
import toast from "react-hot-toast";

const industries = [
  { value: "clinic", label: "🏥 Clinic / Doctor", placeholder: "e.g. Sharma Clinic" },
  { value: "salon", label: "💇 Salon / Spa", placeholder: "e.g. Glamour Studio" },
  { value: "tutor", label: "📚 Tutor / Coaching", placeholder: "e.g. Maths Academy" },
  { value: "physio", label: "🦴 Physiotherapy", placeholder: "e.g. Care Physio" },
  { value: "lawyer", label: "⚖️ Lawyer / Advocate", placeholder: "e.g. Verma & Associates" },
  { value: "other", label: "🔧 Other Business", placeholder: "e.g. My Business" },
];

const Onboarding = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading } = useSelector((state) => state.business);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    businessType: "",
    businessName: "",
    tagline: "",
    address: "",
    phone: "",
  });

  const selectedIndustry = industries.find(
    (i) => i.value === form.businessType
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await dispatch(saveBusiness(form));
    if (saveBusiness.fulfilled.match(result)) {
      toast.success("Business profile created!");
      navigate("/dashboard");
    } else {
      toast.error(result.payload || "Something went wrong");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-2xl bg-white p-8 rounded-2xl shadow-lg">
        <div className="flex items-center gap-2 mb-8">
          <div className={`flex-1 h-2 rounded-full ${step >= 1 ? "bg-primary" : "bg-gray-200"}`}></div>
          <div className={`flex-1 h-2 rounded-full ${step >= 2 ? "bg-primary" : "bg-gray-200"}`}></div>
        </div>

        {step === 1 && (
          <>
            <h1 className="text-3xl font-bold mb-2">
              What type of business?
            </h1>
            <p className="text-gray-500 mb-6">
              We'll customize your experience based on this
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
              {industries.map((ind) => (
                <button
                  key={ind.value}
                  type="button"
                  onClick={() =>
                    setForm({ ...form, businessType: ind.value })
                  }
                  className={`p-4 border-2 rounded-xl text-left transition ${
                    form.businessType === ind.value
                      ? "border-primary bg-indigo-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="font-semibold">{ind.label}</div>
                </button>
              ))}
            </div>

            <button
              onClick={() => setStep(2)}
              disabled={!form.businessType}
              className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-50"
            >
              Next
            </button>
          </>
        )}

        {step === 2 && (
          <form onSubmit={handleSubmit}>
            <h1 className="text-3xl font-bold mb-2">Business details</h1>
            <p className="text-gray-500 mb-6">
              This will appear on your public booking page
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Business Name *
                </label>
                <input
                  type="text"
                  placeholder={selectedIndustry?.placeholder}
                  value={form.businessName}
                  onChange={(e) =>
                    setForm({ ...form, businessName: e.target.value })
                  }
                  className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Tagline (optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Your health, our priority"
                  value={form.tagline}
                  onChange={(e) =>
                    setForm({ ...form, tagline: e.target.value })
                  }
                  className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Address (optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 123 Main Street, Mumbai"
                  value={form.address}
                  onChange={(e) =>
                    setForm({ ...form, address: e.target.value })
                  }
                  className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Phone (optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. +91 9876543210"
                  value={form.phone}
                  onChange={(e) =>
                    setForm({ ...form, phone: e.target.value })
                  }
                  className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-6 py-3 border rounded-lg font-semibold hover:bg-gray-50"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-primary text-white py-3 rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-50"
              >
                {loading ? "Creating..." : "Complete Setup"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Onboarding;