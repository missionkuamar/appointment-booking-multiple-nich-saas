import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { fetchMyBusiness, clearBusiness } from "../features/business/businessSlice";
import { logout } from "../features/auth/authSlice";
import toast from "react-hot-toast";
import Navbar from "../components/Navbar";
import { themes } from "../constants/themes";

const FIELD_TYPES = [
  { value: "text", label: "Text" },
  { value: "number", label: "Number" },
  { value: "email", label: "Email" },
  { value: "tel", label: "Phone" },
  { value: "textarea", label: "Long Text" },
  { value: "select", label: "Dropdown" },
];

const Settings = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { data: business } = useSelector((state) => state.business);
  const { user } = useSelector((state) => state.auth);

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("dashboard-theme") || "day";
  });

  const t = themes[theme] || themes.day;

  useEffect(() => {
    localStorage.setItem("dashboard-theme", theme);
  }, [theme]);

  const [fields, setFields] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (business?.customFields) {
      setFields(business.customFields);
    }
  }, [business]);

  const handleLogout = () => {
    dispatch(logout());
    dispatch(clearBusiness());
    navigate("/login");
  };

  const addField = () => {
    setFields([
      ...fields,
      {
        label: "",
        key: "",
        type: "text",
        options: [],
        required: false,
        isActive: true,
      },
    ]);
  };

  const updateField = (idx, key, value) => {
    const updated = fields.map((item, i) => {
      if (i !== idx) return item;
      const nextItem = { ...item, [key]: value };
      if (key === "label") {
        nextItem.key = value
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9\s]/g, "")
          .replace(/\s+/g, "_");
      }
      return nextItem;
    });
    setFields(updated);
  };

  const removeField = (idx) => {
    setFields(fields.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
    for (const f of fields) {
      if (!f.label || !f.key) {
        toast.error("Har field mein label aur key zaroori hai");
        return;
      }
    }

    setSaving(true);
    try {
      await api.put("/business/custom-fields", { customFields: fields });
      await dispatch(fetchMyBusiness());
      toast.success("Custom fields saved!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={`min-h-screen ${t.page} pb-10 transition-colors duration-300`}>
      
      {/* Shared Navbar */}
      <Navbar
        theme={theme}
        setTheme={setTheme}
        user={user}
        handleLogout={handleLogout}
      />

      <div className="max-w-3xl mx-auto px-4 md:px-6 py-6">
        
        {/* Top Back Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className={`text-2xl font-bold ${t.text}`}>Settings</h1>
            <p className={`text-sm ${t.muted}`}>
              Configure your booking form fields
            </p>
          </div>

          <Link
            to="/dashboard"
            className={`text-xs font-semibold px-3 py-2 rounded-xl border ${t.border} ${t.card} ${t.text} ${t.hover}`}
          >
            ← Dashboard
          </Link>
        </div>

        {/* Main Card */}
        <div className={`rounded-2xl border ${t.card} ${t.border} p-5 md:p-6`}>
          <div className="flex flex-wrap justify-between items-center gap-3 mb-5">
            <div>
              <h2 className={`text-lg font-bold ${t.text}`}>
                Custom Booking Fields
              </h2>
              <p className={`text-xs mt-0.5 ${t.muted}`}>
                Client booking karte waqt ye extra fields dikhenge
              </p>
            </div>

            <button
              onClick={addField}
              className={`px-4 py-2 ${t.accent} text-white rounded-xl text-xs font-bold hover:opacity-90 transition`}
            >
              + Add Field
            </button>
          </div>

          {fields.length === 0 && (
            <p className={`text-center py-8 text-sm ${t.muted}`}>
              Koi custom field nahi. "Add Field" click karo.
            </p>
          )}

          <div className="space-y-3">
            {fields.map((field, idx) => (
              <div
                key={idx}
                className={`border ${t.border} ${t.soft} rounded-xl p-4 space-y-3`}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Label (e.g. Patient Age)"
                    value={field.label}
                    onChange={(e) => updateField(idx, "label", e.target.value)}
                    className={`px-3 py-2 rounded-lg border ${t.border} ${t.card} ${t.text} text-sm outline-none`}
                  />

                  <input
                    type="text"
                    placeholder="key"
                    value={field.key}
                    onChange={(e) => updateField(idx, "key", e.target.value)}
                    className={`px-3 py-2 rounded-lg border ${t.border} ${t.card} ${t.muted} text-sm outline-none`}
                  />

                  <select
                    value={field.type}
                    onChange={(e) => updateField(idx, "type", e.target.value)}
                    className={`px-3 py-2 rounded-lg border ${t.border} ${t.card} ${t.text} text-sm outline-none`}
                  >
                    {FIELD_TYPES.map((ft) => (
                      <option key={ft.value} value={ft.value}>
                        {ft.label}
                      </option>
                    ))}
                  </select>

                  <label className={`flex items-center gap-2 px-3 py-2 text-sm ${t.text}`}>
                    <input
                      type="checkbox"
                      checked={field.required}
                      onChange={(e) =>
                        updateField(idx, "required", e.target.checked)
                      }
                    />
                    <span>Required</span>
                  </label>
                </div>

                {field.type === "select" && (
                  <input
                    type="text"
                    placeholder="Options (comma separated)"
                    value={(field.options || []).join(", ")}
                    onChange={(e) =>
                      updateField(
                        idx,
                        "options",
                        e.target.value.split(",").map((o) => o.trim())
                      )
                    }
                    className={`w-full px-3 py-2 rounded-lg border ${t.border} ${t.card} ${t.text} text-sm outline-none`}
                  />
                )}

                <button
                  onClick={() => removeField(idx)}
                  className="text-xs text-red-500 font-semibold hover:underline"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          {fields.length > 0 && (
            <button
              onClick={handleSave}
              disabled={saving}
              className={`w-full mt-6 ${t.accent} text-white py-3 rounded-xl text-sm font-bold hover:opacity-90 transition disabled:opacity-50`}
            >
              {saving ? "Saving..." : "Save Custom Fields"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;