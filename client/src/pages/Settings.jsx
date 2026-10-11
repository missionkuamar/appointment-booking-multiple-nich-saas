import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import api from "../api/axios";
import { fetchMyBusiness } from "../features/business/businessSlice";
import toast from "react-hot-toast";

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
  const { data: business } = useSelector((state) => state.business);
  const [fields, setFields] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (business?.customFields) {
      setFields(business.customFields);
    }
  }, [business]);

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
    const updated = [...fields];
    updated[idx][key] = value;

    // Auto-generate key from label
    if (key === "label") {
      updated[idx].key = value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s]/g, "")
        .replace(/\s+/g, "_");
    }
    setFields(updated);
  };

  const removeField = (idx) => {
    setFields(fields.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
    // Validate
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
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
        <Link to="/dashboard" className="text-xl font-bold text-primary">
          ← BookEasy
        </Link>
        <span className="text-sm text-gray-500">Settings</span>
      </nav>

      <div className="max-w-3xl mx-auto p-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-2xl font-bold">Custom Booking Fields</h2>
              <p className="text-sm text-gray-500">
                Client booking karte waqt ye extra fields dikhenge
              </p>
            </div>
            <button
              onClick={addField}
              className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium"
            >
              + Add Field
            </button>
          </div>

          {fields.length === 0 && (
            <p className="text-gray-500 text-center py-8">
              Koi custom field nahi. "Add Field" click karo.
            </p>
          )}

          <div className="space-y-3">
            {fields.map((field, idx) => (
              <div
                key={idx}
                className="border rounded-xl p-4 space-y-3 bg-gray-50"
              >
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Label (e.g. Patient Age)"
                    value={field.label}
                    onChange={(e) => updateField(idx, "label", e.target.value)}
                    className="px-3 py-2 border rounded-lg bg-white"
                  />
                  <input
                    type="text"
                    placeholder="key"
                    value={field.key}
                    onChange={(e) => updateField(idx, "key", e.target.value)}
                    className="px-3 py-2 border rounded-lg bg-white text-sm text-gray-500"
                  />
                  <select
                    value={field.type}
                    onChange={(e) => updateField(idx, "type", e.target.value)}
                    className="px-3 py-2 border rounded-lg bg-white"
                  >
                    {FIELD_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                  <label className="flex items-center gap-2 px-3 py-2">
                    <input
                      type="checkbox"
                      checked={field.required}
                      onChange={(e) =>
                        updateField(idx, "required", e.target.checked)
                      }
                    />
                    <span className="text-sm">Required</span>
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
                    className="w-full px-3 py-2 border rounded-lg bg-white"
                  />
                )}

                <button
                  onClick={() => removeField(idx)}
                  className="text-sm text-red-500 font-medium"
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
              className="w-full mt-6 bg-primary text-white py-3 rounded-lg font-semibold disabled:opacity-50"
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