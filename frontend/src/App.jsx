import { Navigate, Route, Routes } from 'react-router-dom'
import { HOME_FOR, useAuth } from './context/AuthContext'
import Loader from './components/Loader'

// layouts
import AdminLayout from './layouts/AdminLayout'
import CustomerLayout from './layouts/CustomerLayout'
import DriverLayout from './layouts/DriverLayout'

// public
import Home from './pages/public/Home'
import RegisterRole from './pages/public/RegisterRole'
import RegisterCustomer from './pages/public/RegisterCustomer'
import RegisterDriver from './pages/public/RegisterDriver'
import Login from './pages/Login'

// admin
import Dashboard from './pages/Dashboard'
import LoadRequests from './pages/LoadRequests'
import LoadRequestDetail from './pages/LoadRequestDetail'
import SmartLoadMatching from './pages/SmartLoadMatching'
import AssignmentReview from './pages/AssignmentReview'
import AssignLoad from './pages/AssignLoad'
import Trips from './pages/Trips'
import TripTracking from './pages/TripTracking'
import Drivers from './pages/Drivers'
import DriverDetail from './pages/DriverDetail'
import Trucks from './pages/Trucks'
import TruckDetail from './pages/TruckDetail'
import Customers from './pages/Customers'
import CustomerDetail from './pages/CustomerDetail'
import Payments from './pages/Payments'
import InvoiceView from './pages/InvoiceView'
import Notifications from './pages/Notifications'
import Reports from './pages/Reports'
import Pricing from './pages/Pricing'
import SettingsPage from './pages/SettingsPage'

// customer portal
import CustomerDashboard from './pages/customer/CustomerDashboard'
import BookLoad from './pages/customer/BookLoad'
import MyLoads from './pages/customer/MyLoads'
import TrackLoad from './pages/customer/TrackLoad'
import CustomerPayments from './pages/customer/CustomerPayments'
import CustomerNotifications from './pages/customer/CustomerNotifications'
import CustomerProfile from './pages/customer/CustomerProfile'
import RateReview from './pages/customer/RateReview'
import CustomerSupport from './pages/customer/CustomerSupport'

// driver portal
import DriverDashboard from './pages/driver/DriverDashboard'
import AvailableLoads from './pages/driver/AvailableLoads'
import MyTrips from './pages/driver/MyTrips'
import DriverTripTracking from './pages/driver/DriverTripTracking'
import Earnings from './pages/driver/Earnings'
import DriverAvailability from './pages/driver/DriverAvailability'
import DriverDocuments from './pages/driver/DriverDocuments'
import DriverNotifications from './pages/driver/DriverNotifications'
import DriverProfile from './pages/driver/DriverProfile'
import DriverSupport from './pages/driver/DriverSupport'

/**
 * Gate a branch of the app to one role. Anyone signed in as a different role is
 * sent to their own home rather than shown someone else's console.
 */
function RequireRole({ role, children }) {
  const { user, loading } = useAuth()
  if (loading) return <Loader label="Checking your session…" />
  if (!user) return <Navigate to={`/login/${role}`} replace />
  if (user.role !== role) return <Navigate to={HOME_FOR[user.role] || '/'} replace />
  return children
}

export default function App() {
  return (
    <Routes>
      {/* ---------- public ---------- */}
      <Route path="/" element={<Home />} />
      <Route path="/register" element={<RegisterRole />} />
      <Route path="/register/customer" element={<RegisterCustomer />} />
      <Route path="/register/driver" element={<RegisterDriver />} />
      {/* Admin has sign-in only — /register/admin redirects to the admin login. */}
      <Route path="/register/admin" element={<Navigate to="/login/admin" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/login/:role" element={<Login />} />

      {/* ---------- admin console ---------- */}
      <Route element={<RequireRole role="admin"><AdminLayout /></RequireRole>}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/load-requests" element={<LoadRequests />} />
        <Route path="/load-requests/:id" element={<LoadRequestDetail />} />
        <Route path="/smart-load-matching" element={<SmartLoadMatching />} />
        <Route path="/smart-load-matching/:loadId" element={<SmartLoadMatching />} />
        <Route path="/assign-load/:loadId" element={<AssignLoad />} />
        <Route path="/load-requests/:id/assignment" element={<AssignmentReview />} />
        <Route path="/trips" element={<Trips />} />
        <Route path="/trips/:tripId" element={<TripTracking />} />
        <Route path="/drivers" element={<Drivers />} />
        <Route path="/drivers/:id" element={<DriverDetail />} />
        <Route path="/trucks" element={<Trucks />} />
        <Route path="/trucks/:id" element={<TruckDetail />} />
        <Route path="/customers" element={<Customers />} />
        <Route path="/customers/:id" element={<CustomerDetail />} />
        <Route path="/payments" element={<Payments />} />
        <Route path="/invoices/:id" element={<InvoiceView />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>

      {/* ---------- customer portal ---------- */}
      <Route element={<RequireRole role="customer"><CustomerLayout /></RequireRole>}>
        <Route path="/customer" element={<Navigate to="/customer/dashboard" replace />} />
        <Route path="/customer/dashboard" element={<CustomerDashboard />} />
        <Route path="/customer/book-load" element={<BookLoad />} />
        <Route path="/customer/loads" element={<MyLoads />} />
        <Route path="/customer/track" element={<TrackLoad />} />
        <Route path="/customer/payments" element={<CustomerPayments />} />
        <Route path="/customer/notifications" element={<CustomerNotifications />} />
        <Route path="/customer/reviews" element={<RateReview />} />
        <Route path="/customer/profile" element={<CustomerProfile />} />
        <Route path="/customer/support" element={<CustomerSupport />} />
      </Route>

      {/* ---------- driver portal ---------- */}
      <Route element={<RequireRole role="driver"><DriverLayout /></RequireRole>}>
        <Route path="/driver" element={<Navigate to="/driver/dashboard" replace />} />
        <Route path="/driver/dashboard" element={<DriverDashboard />} />
        <Route path="/driver/available-loads" element={<AvailableLoads />} />
        <Route path="/driver/trips" element={<MyTrips />} />
        <Route path="/driver/trips/:tripId" element={<DriverTripTracking />} />
        <Route path="/driver/tracking" element={<DriverTripTracking />} />
        <Route path="/driver/earnings" element={<Earnings />} />
        <Route path="/driver/availability" element={<DriverAvailability />} />
        <Route path="/driver/documents" element={<DriverDocuments />} />
        <Route path="/driver/notifications" element={<DriverNotifications />} />
        <Route path="/driver/profile" element={<DriverProfile />} />
        <Route path="/driver/support" element={<DriverSupport />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
