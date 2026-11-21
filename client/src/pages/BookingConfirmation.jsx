import { useLocation, Link } from "react-router-dom";

export default function BookingConfirmation() {
  const { state } = useLocation();
  const appt = state?.appointment;
  const business = state?.business;

  if (!appt) return <p className="p-6">No appointment data</p>;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white p-8 rounded-2xl shadow-sm max-w-md w-full text-center">
        <div className="text-5xl mb-4">✅</div>
        <h1 className="text-2xl font-bold mb-2">Appointment Booked!</h1>
        <p className="text-gray-600 mb-1">{business?.businessName}</p>
        <p className="text-gray-800 font-medium mb-6">
          {appt.date} at {appt.time}
        </p>
        <Link
          to={`/manage/${appt.cancelToken}`}
          className="inline-block bg-primary text-white px-6 py-2 rounded-lg font-medium"
        >
          Manage Appointment
        </Link>
        <p className="text-xs text-gray-400 mt-4">
          Confirmation email sent (if email provided)
        </p>
      </div>
    </div>
  );
}