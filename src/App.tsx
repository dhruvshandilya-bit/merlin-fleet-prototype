import { StoreProvider, useStore } from '@/lib/store'
import { Shell } from '@/components/layout/Shell'
import { DashboardScreen } from '@/features/dashboard/DashboardScreen'
import { VehiclesScreen } from '@/features/vehicles/VehiclesScreen'
import { TrailersScreen } from '@/features/trailers/TrailersScreen'
import { DriversScreen } from '@/features/drivers/DriversScreen'
import { LoadsScreen } from '@/features/loads/LoadsScreen'
import { DispatchScreen } from '@/features/dispatch/DispatchScreen'
import { MapScreen } from '@/features/map/MapScreen'
import { MaintenanceScreen } from '@/features/maintenance/MaintenanceScreen'
import { ComplianceScreen } from '@/features/compliance/ComplianceScreen'
import { InvoicingScreen } from '@/features/invoicing/InvoicingScreen'
import { SettlementsScreen } from '@/features/settlements/SettlementsScreen'
import { FuelScreen } from '@/features/fuel/FuelScreen'

function Router() {
  const { section } = useStore()
  switch (section) {
    case 'dashboard': return <DashboardScreen />
    case 'vehicles': return <VehiclesScreen />
    case 'trailers': return <TrailersScreen />
    case 'drivers': return <DriversScreen />
    case 'loads': return <LoadsScreen />
    case 'dispatch': return <DispatchScreen />
    case 'map': return <MapScreen />
    case 'maintenance': return <MaintenanceScreen />
    case 'compliance': return <ComplianceScreen />
    case 'invoicing': return <InvoicingScreen />
    case 'settlements': return <SettlementsScreen />
    case 'fuel': return <FuelScreen />
    default: return <DashboardScreen />
  }
}

export default function App() {
  return (
    <StoreProvider>
      <Shell>
        <Router />
      </Shell>
    </StoreProvider>
  )
}
