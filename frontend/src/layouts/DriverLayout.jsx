import {
  Bell, FileText, LayoutDashboard, LifeBuoy, Navigation, Package, Route, CalendarCheck, User, Wallet } from 'lucide-react'
import PortalLayout from './PortalLayout'

const NAV = [
  { to: '/driver/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/driver/available-loads', label: 'Available Loads', icon: Package },
  { to: '/driver/trips', label: 'My Trips', icon: Route, end: true },
  { to: '/driver/tracking', label: 'Trip Tracking', icon: Navigation },
  { to: '/driver/availability', label: 'My Availability', icon: CalendarCheck },
  { to: '/driver/earnings', label: 'Earnings', icon: Wallet },
  { to: '/driver/documents', label: 'Documents', icon: FileText },
  { to: '/driver/notifications', label: 'Notifications', icon: Bell },
  { to: '/driver/profile', label: 'Profile', icon: User },
  { to: '/driver/support', label: 'Support', icon: LifeBuoy },
]

export default function DriverLayout() {
  return <PortalLayout nav={NAV} notificationsPath="/driver/notifications"
    title="Driver Portal" />
}
