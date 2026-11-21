import { useLocation, Link } from "react-router-dom";

export default function AppointmentConfirmation() {
  const { state } = useLocation();
  const appt = state?.appointment;

  if (!appt) return <p className="p-6">No appointment data</p>;

  const manageUrl = `${window.location.origin}/manage/${appt.cancelToken}`;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white p-8 rounded-2xl shadow-sm max-w-md w-full text-center">
        <div className="text-5xl mb-4">✅</div>
        <h1 className="text-2xl font-bold mb-2">Appointment Booked!</h1>
        <p className="text-gray-600 mb-6">
          {appt.date} at {appt.time}
        </p>
        <p className="text-sm text-gray-500 mb-2">
          Manage / cancel your appointment:
        </p>
        <Link
          to={`/manage/${appt.cancelToken}`}
          className="text-primary text-sm underline break-all"
        >
          {manageUrl}
        </Link>
        <p className="text-xs text-gray-400 mt-4">
          A confirmation email has been sent (if provided).
        </p>
      </div>
    </div>
  );
}