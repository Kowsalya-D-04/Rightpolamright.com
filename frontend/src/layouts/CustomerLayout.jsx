import {
  Bell, CreditCard, LayoutDashboard, LifeBuoy, MapPin, Package, PlusCircle, Star, User,
} from 'lucide-react'
import PortalLayout from './PortalLayout'

const NAV = [
  { to: '/customer/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/customer/loads', label: 'My Loads', icon: Package },
  { to: '/customer/book-load', label: 'Book Load', icon: PlusCircle },
  { to: '/customer/track', label: 'Track Load', icon: MapPin },
  { to: '/customer/payments', label: 'Payments', icon: CreditCard },
  { to: '/customer/notifications', label: 'Notifications', icon: Bell },
  { to: '/customer/reviews', label: 'Rate & Review', icon: Star },
  { to: '/customer/profile', label: 'Profile', icon: User },
  { to: '/customer/support', label: 'Support', icon: LifeBuoy },
]

export default function CustomerLayout() {
  return <PortalLayout nav={NAV} notificationsPath="/customer/notifications"
    title="Customer Portal" />
}
