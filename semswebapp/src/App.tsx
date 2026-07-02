import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "./routes/ProtectedRoute";
import AppLayout from "./components/AppLayout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Devices from "./pages/Devices";
import Monitoring from "./pages/Monitoring";
import Analytics from "./pages/Analytics";
import Alerts from "./pages/Alerts";
import Subscription from "./pages/Subscription";
import NotFound from "./pages/NotFound";
import Reports from "./pages/Reports";
import Household from "./pages/Household";
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/devices" element={<Devices />} />
            <Route path="/monitoring" element={<Monitoring />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/subscription" element={<Subscription />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/household" element={<Household />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}