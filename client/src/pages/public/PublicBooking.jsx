import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function PublicBooking() {
  const { slug } = useParams();
  const [business, setBusiness] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [dates, setDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [step, setStep] = useState(1); // 1=doctor 2=date 3=slot 4=form

  useEffect(() => {
    axios.get(`${API}/public/${slug}`).then((r) => {
      setBusiness(r.data);
      setDoctors(r.data.doctors || []);
    });
  }, [slug]);

  // ... fetch dates when doctor selected
  // ... fetch slots when date selected
  // ... render based on `step`

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm p-4">
        <h1 className="text-xl font-bold text-primary">
          {business?.businessName || "Loading..."}
        </h1>
        <p className="text-sm text-gray-500">{business?.tagline}</p>
      </header>

      <main className="max-w-4xl mx-auto p-6">
        {/* Step indicator */}
        <div className="flex gap-2 mb-6 text-sm">
          {["Doctor", "Date", "Slot", "Details"].map((s, i) => (
            <div key={s} className={`flex-1 text-center py-2 rounded-lg ${
              step === i + 1 ? "bg-primary text-white" : "bg-white text-gray-500"
            }`}>{s}</div>
          ))}
        </div>

        {/* Step 1: Doctor selection */}
        {step === 1 && (
          <div className="grid md:grid-cols-2 gap-4">
            {doctors.map((doc) => (
              <button
                key={doc._id}
                onClick={() => { setSelectedDoctor(doc); setStep(2); }}
                className="bg-white p-5 rounded-2xl shadow-sm hover:shadow-md text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                    {doc.name?.[0]}
                  </div>
                  <div>
                    <h3 className="font-bold">{doc.name}</h3>
                    <p className="text-sm text-gray-500">{doc.specialization}</p>
                    <p className="text-xs text-gray-400">{doc.qualification}</p>
                  </div>
                </div>
                {doc.consultationFee > 0 && (
                  <p className="mt-2 text-sm font-medium text-primary">₹{doc.consultationFee}</p>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Step 2/3/4 similar pattern */}
      </main>
    </div>
  );
}