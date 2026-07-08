import type {
  Truck,
  Trailer,
  Driver,
  Load,
  MaintenanceRecord,
  SafetyEvent,
} from './types'

const doc = (id: string, name: string, type: string, uploadedAt: string) => ({ id, name, type, uploadedAt })

export const seedTrucks: Truck[] = [
  {
    id: 'T-101', unitNumber: '101', vin: '1FUJGLDR9CLBP1234', year: 2021, make: 'Freightliner', model: 'Cascadia',
    plate: 'TX 8842-AC', status: 'ACTIVE', fleet: 'Dry Van Fleet', ownerOperator: false, odometer: 412300,
    fuelType: 'Diesel', fuelCard: 'WEX ••4821', eldProvider: 'Samsara', registrationExp: '2026-11-30',
    insuranceExp: '2026-09-15', inspectionExp: '2026-08-02', assignedDriverId: 'D-1', maintenanceFlag: false,
    docs: [doc('dc1', 'Registration.pdf', 'Registration', '2026-01-10'), doc('dc2', 'Insurance-COI.pdf', 'Insurance', '2026-01-10')], notes: '',
  },
  {
    id: 'T-102', unitNumber: '102', vin: '3AKJHHDR1KSKL5567', year: 2020, make: 'Kenworth', model: 'T680',
    plate: 'TX 9911-BK', status: 'ACTIVE', fleet: 'Reefer Fleet', ownerOperator: false, odometer: 523900,
    fuelType: 'Diesel', fuelCard: 'WEX ••1190', eldProvider: 'Motive', registrationExp: '2026-07-19',
    insuranceExp: '2026-12-01', inspectionExp: '2026-07-25', assignedDriverId: 'D-2', maintenanceFlag: false,
    docs: [doc('dc3', 'Registration.pdf', 'Registration', '2026-02-01')], notes: 'Reefer unit serviced Apr 2026.',
  },
  {
    id: 'T-103', unitNumber: '103', vin: '1XKYD49X8MJ334412', year: 2022, make: 'Peterbilt', model: '579',
    plate: 'OK 4420-CD', status: 'IN_MAINTENANCE', fleet: 'Flatbed Fleet', ownerOperator: false, odometer: 288100,
    fuelType: 'Diesel', fuelCard: 'WEX ••7734', eldProvider: 'Samsara', registrationExp: '2027-01-14',
    insuranceExp: '2026-10-22', inspectionExp: '2026-06-28', assignedDriverId: null, maintenanceFlag: true,
    docs: [], notes: 'In shop — brake job in progress.',
  },
  {
    id: 'T-104', unitNumber: '104', vin: '1FUJGLDRXCLBP9981', year: 2019, make: 'Volvo', model: 'VNL 760',
    plate: 'TX 3388-DE', status: 'ACTIVE', fleet: 'Dry Van Fleet', ownerOperator: true, odometer: 611200,
    fuelType: 'Diesel', fuelCard: 'Owner', eldProvider: 'Motive', registrationExp: '2026-09-05',
    insuranceExp: '2026-08-11', inspectionExp: '2026-11-19', assignedDriverId: 'D-4', maintenanceFlag: false,
    docs: [], notes: 'Owner-operator: J. Alvarez.',
  },
  {
    id: 'T-105', unitNumber: '105', vin: '3AKJHHDR7LSKL2210', year: 2023, make: 'Freightliner', model: 'Cascadia',
    plate: 'TX 7712-EF', status: 'ACTIVE', fleet: 'Reefer Fleet', ownerOperator: false, odometer: 154700,
    fuelType: 'Diesel', fuelCard: 'WEX ••5540', eldProvider: 'Samsara', registrationExp: '2027-03-20',
    insuranceExp: '2026-11-30', inspectionExp: '2026-10-05', assignedDriverId: 'D-5', maintenanceFlag: false,
    docs: [], notes: '',
  },
  {
    id: 'T-106', unitNumber: '106', vin: '1XKYD49X0NJ556677', year: 2021, make: 'Kenworth', model: 'W990',
    plate: 'AR 2201-FG', status: 'IDLE', fleet: 'Flatbed Fleet', ownerOperator: false, odometer: 342800,
    fuelType: 'Diesel', fuelCard: 'WEX ••3301', eldProvider: 'Motive', registrationExp: '2026-12-12',
    insuranceExp: '2026-07-30', inspectionExp: '2026-09-14', assignedDriverId: null, maintenanceFlag: false,
    docs: [], notes: '',
  },
  {
    id: 'T-107', unitNumber: '107', vin: '1FUJGLDR4CLBP4456', year: 2018, make: 'International', model: 'LT625',
    plate: 'TX 6690-GH', status: 'OUT_OF_SERVICE', fleet: 'Dry Van Fleet', ownerOperator: false, odometer: 788400,
    fuelType: 'Diesel', fuelCard: 'WEX ••9902', eldProvider: 'Samsara', registrationExp: '2026-06-30',
    insuranceExp: '2026-08-19', inspectionExp: '2026-05-30', assignedDriverId: null, maintenanceFlag: true,
    docs: [], notes: 'Awaiting engine diagnosis. Registration + inspection lapsed.',
  },
  {
    id: 'T-108', unitNumber: '108', vin: '3AKJHHDR9MSKL7788', year: 2022, make: 'Peterbilt', model: '389',
    plate: 'TX 1145-HJ', status: 'ACTIVE', fleet: 'Dry Van Fleet', ownerOperator: false, odometer: 201500,
    fuelType: 'Diesel', fuelCard: 'WEX ••6612', eldProvider: 'Motive', registrationExp: '2027-02-28',
    insuranceExp: '2026-12-15', inspectionExp: '2026-11-01', assignedDriverId: 'D-8', maintenanceFlag: false,
    docs: [], notes: '',
  },
]

export const seedTrailers: Trailer[] = [
  { id: 'TR-201', unitNumber: '201', vin: '1JJV532W1KL201001', year: 2020, make: 'Wabash', equipmentType: 'Dry Van', plate: 'TX DV-201', status: 'ACTIVE', maxWeight: 45000, registrationExp: '2026-10-10', inspectionExp: '2026-08-15', assignedTruckId: 'T-101', maintenanceFlag: false, docs: [], notes: '' },
  { id: 'TR-202', unitNumber: '202', vin: '1UYVS2530LU202002', year: 2021, make: 'Utility', equipmentType: 'Reefer', plate: 'TX RF-202', status: 'ACTIVE', maxWeight: 43500, registrationExp: '2026-07-14', inspectionExp: '2026-09-01', assignedTruckId: 'T-102', maintenanceFlag: false, docs: [], notes: 'Thermo King unit.' },
  { id: 'TR-203', unitNumber: '203', vin: '1DW1A5323LB203003', year: 2019, make: 'Great Dane', equipmentType: 'Flatbed', plate: 'OK FB-203', status: 'IN_MAINTENANCE', maxWeight: 48000, registrationExp: '2026-11-22', inspectionExp: '2026-06-20', assignedTruckId: null, maintenanceFlag: true, docs: [], notes: 'Deck boards being replaced.' },
  { id: 'TR-204', unitNumber: '204', vin: '1JJV532W5KL204004', year: 2022, make: 'Wabash', equipmentType: 'Dry Van', plate: 'TX DV-204', status: 'ACTIVE', maxWeight: 45000, registrationExp: '2027-01-30', inspectionExp: '2026-10-18', assignedTruckId: 'T-104', maintenanceFlag: false, docs: [], notes: '' },
  { id: 'TR-205', unitNumber: '205', vin: '1UYVS2537MU205005', year: 2023, make: 'Utility', equipmentType: 'Reefer', plate: 'TX RF-205', status: 'ACTIVE', maxWeight: 43500, registrationExp: '2027-04-05', inspectionExp: '2026-11-12', assignedTruckId: 'T-105', maintenanceFlag: false, docs: [], notes: '' },
  { id: 'TR-206', unitNumber: '206', vin: '1DW1A5321MB206006', year: 2021, make: 'Great Dane', equipmentType: 'Flatbed', plate: 'AR FB-206', status: 'IDLE', maxWeight: 48000, registrationExp: '2026-12-28', inspectionExp: '2026-07-22', assignedTruckId: null, maintenanceFlag: false, docs: [], notes: '' },
  { id: 'TR-207', unitNumber: '207', vin: '1JJV532W9KL207007', year: 2020, make: 'Hyundai', equipmentType: 'Dry Van', plate: 'TX DV-207', status: 'ACTIVE', maxWeight: 45000, registrationExp: '2026-09-08', inspectionExp: '2026-12-03', assignedTruckId: 'T-108', maintenanceFlag: false, docs: [], notes: '' },
  { id: 'TR-208', unitNumber: '208', vin: '1NNVT4826MT208008', year: 2018, make: 'Polar', equipmentType: 'Tanker', plate: 'TX TK-208', status: 'IDLE', maxWeight: 42000, registrationExp: '2026-08-01', inspectionExp: '2026-06-15', assignedTruckId: null, maintenanceFlag: false, docs: [], notes: 'Food-grade tanker.' },
]

export const seedDrivers: Driver[] = [
  { id: 'D-1', name: 'Marcus Reed', phone: '(214) 555-0142', email: 'mreed@carrier.co', homeCity: 'Dallas, TX', status: 'DRIVING', hireDate: '2022-03-14', cdlNumber: 'TX-DL-88421', cdlExp: '2027-03-14', medicalCardExp: '2026-08-01', endorsements: ['H', 'N'], hosRemaining: 6.5, payRatePerMile: 0.62, assignedTruckId: 'T-101', docs: [], notes: '' },
  { id: 'D-2', name: 'Elena Vasquez', phone: '(469) 555-0177', email: 'evasquez@carrier.co', homeCity: 'Fort Worth, TX', status: 'DRIVING', hireDate: '2021-07-02', cdlNumber: 'TX-DL-77190', cdlExp: '2026-07-20', medicalCardExp: '2026-11-05', endorsements: ['N', 'T'], hosRemaining: 3.0, payRatePerMile: 0.64, assignedTruckId: 'T-102', docs: [], notes: 'CDL renewal due soon.' },
  { id: 'D-3', name: 'David Okoro', phone: '(972) 555-0198', email: 'dokoro@carrier.co', homeCity: 'Arlington, TX', status: 'AVAILABLE', hireDate: '2023-01-20', cdlNumber: 'TX-DL-33412', cdlExp: '2028-01-20', medicalCardExp: '2027-01-15', endorsements: ['H'], hosRemaining: 11.0, payRatePerMile: 0.58, assignedTruckId: null, docs: [], notes: '' },
  { id: 'D-4', name: 'Jose Alvarez', phone: '(214) 555-0110', email: 'jalvarez@owner.co', homeCity: 'Garland, TX', status: 'ON_DUTY', hireDate: '2020-09-10', cdlNumber: 'TX-DL-55098', cdlExp: '2026-09-10', medicalCardExp: '2026-07-15', endorsements: ['T', 'X'], hosRemaining: 8.0, payRatePerMile: 0.70, assignedTruckId: 'T-104', docs: [], notes: 'Owner-operator.' },
  { id: 'D-5', name: 'Tasha Bell', phone: '(682) 555-0165', email: 'tbell@carrier.co', homeCity: 'Irving, TX', status: 'DRIVING', hireDate: '2022-11-05', cdlNumber: 'TX-DL-22107', cdlExp: '2027-11-05', medicalCardExp: '2026-10-20', endorsements: ['N'], hosRemaining: 5.0, payRatePerMile: 0.61, assignedTruckId: 'T-105', docs: [], notes: '' },
  { id: 'D-6', name: 'Frank Delgado', phone: '(214) 555-0133', email: 'fdelgado@carrier.co', homeCity: 'Mesquite, TX', status: 'AVAILABLE', hireDate: '2019-05-18', cdlNumber: 'TX-DL-11540', cdlExp: '2026-06-30', medicalCardExp: '2026-09-01', endorsements: ['H', 'N', 'T'], hosRemaining: 11.0, payRatePerMile: 0.66, assignedTruckId: null, docs: [], notes: 'CDL EXPIRED — do not dispatch.' },
  { id: 'D-7', name: 'Priya Nair', phone: '(469) 555-0144', email: 'pnair@carrier.co', homeCity: 'Plano, TX', status: 'OFF_DUTY', hireDate: '2023-06-12', cdlNumber: 'TX-DL-66223', cdlExp: '2028-06-12', medicalCardExp: '2027-06-01', endorsements: [], hosRemaining: 0.0, payRatePerMile: 0.57, assignedTruckId: null, docs: [], notes: 'Home time until Wed.' },
  { id: 'D-8', name: 'Wes Carter', phone: '(972) 555-0189', email: 'wcarter@carrier.co', homeCity: 'Denton, TX', status: 'AVAILABLE', hireDate: '2021-02-28', cdlNumber: 'TX-DL-44819', cdlExp: '2027-02-28', medicalCardExp: '2026-12-10', endorsements: ['N', 'T'], hosRemaining: 10.5, payRatePerMile: 0.63, assignedTruckId: 'T-108', docs: [], notes: '' },
  { id: 'D-9', name: 'Grace Kim', phone: '(214) 555-0121', email: 'gkim@carrier.co', homeCity: 'Richardson, TX', status: 'AVAILABLE', hireDate: '2024-04-01', cdlNumber: 'TX-DL-99031', cdlExp: '2029-04-01', medicalCardExp: '2027-04-01', endorsements: ['H'], hosRemaining: 11.0, payRatePerMile: 0.55, assignedTruckId: null, docs: [], notes: '' },
]

const stop = (id: string, type: 'PICKUP' | 'DELIVERY', location: string, city: string, state: string, window: string, commodity: string, completed = false, loadingType: 'Live' | 'Hook' | 'Drop & Hook' = 'Live', scheduleType: 'APPOINTMENT' | 'FCFS' = 'APPOINTMENT') =>
  ({ id, type, location, city, state, window, commodity, completed, loadingType, scheduleType })

export const seedLoads: Load[] = [
  {
    id: 'L-5001', loadNumber: 'L-5001', customer: 'Sysco Foods', poNumber: 'PO-88213', commodity: 'Frozen goods', equipmentType: 'Reefer', weight: 41200,
    status: 'IN_TRANSIT', flag: 'RUNNING_LATE', originCity: 'Fort Worth', originState: 'TX', destCity: 'Oklahoma City', destState: 'OK', miles: 206, customerRate: 560, carrierRate: 0,
    stops: [stop('s1', 'PICKUP', 'Sysco DC 12', 'Fort Worth', 'TX', 'Jul 8, 06:00', 'Frozen goods', true, 'Live'), stop('s2', 'DELIVERY', 'Sysco OKC', 'Oklahoma City', 'OK', 'Jul 8, 14:00', 'Frozen goods', false, 'Live')],
    driverId: 'D-2', truckId: 'T-102', trailerId: 'TR-202', pickupDate: '2026-07-08', deliveryDate: '2026-07-08', progress: 68, podUploaded: false,
  },
  {
    id: 'L-5002', loadNumber: 'L-5002', customer: 'Home Depot', poNumber: 'PO-44190', commodity: 'Building materials', equipmentType: 'Flatbed', weight: 46800,
    status: 'IN_TRANSIT', flag: 'NONE', originCity: 'Dallas', originState: 'TX', destCity: 'Little Rock', destState: 'AR', miles: 318, customerRate: 815, carrierRate: 0,
    stops: [stop('s3', 'PICKUP', 'HD Supply Yard', 'Dallas', 'TX', 'Jul 8, 07:30', 'Lumber', true, 'Live'), stop('s4', 'DELIVERY', 'HD Store 6612', 'Little Rock', 'AR', 'Jul 8, 16:30', 'Lumber', false, 'Live')],
    driverId: 'D-4', truckId: 'T-104', trailerId: 'TR-204', pickupDate: '2026-07-08', deliveryDate: '2026-07-08', progress: 42, podUploaded: false,
  },
  {
    id: 'L-5003', loadNumber: 'L-5003', customer: 'Walmart DC', poNumber: 'PO-90021', commodity: 'Consumer goods', equipmentType: 'Dry Van', weight: 38400,
    status: 'IN_TRANSIT', flag: 'TEMP_DISCREPANCY', originCity: 'Dallas', originState: 'TX', destCity: 'Houston', destState: 'TX', miles: 240, customerRate: 640, carrierRate: 0,
    stops: [stop('s5', 'PICKUP', 'Walmart DC 6094', 'Dallas', 'TX', 'Jul 8, 05:00', 'Consumer goods', true, 'Drop & Hook'), stop('s6', 'DELIVERY', 'Walmart Store 512', 'Houston', 'TX', 'Jul 8, 12:00', 'Consumer goods', false, 'Live')],
    driverId: 'D-1', truckId: 'T-101', trailerId: 'TR-201', pickupDate: '2026-07-08', deliveryDate: '2026-07-08', progress: 85, podUploaded: false,
  },
  {
    id: 'L-5004', loadNumber: 'L-5004', customer: 'Kroger', poNumber: 'PO-77450', commodity: 'Dairy', equipmentType: 'Reefer', weight: 40100,
    status: 'DISPATCHED', flag: 'NONE', originCity: 'Irving', originState: 'TX', destCity: 'Tulsa', destState: 'OK', miles: 258, customerRate: 670, carrierRate: 0,
    stops: [stop('s7', 'PICKUP', 'Kroger DC', 'Irving', 'TX', 'Jul 9, 06:00', 'Dairy', false, 'Live'), stop('s8', 'DELIVERY', 'Kroger Tulsa', 'Tulsa', 'OK', 'Jul 9, 13:00', 'Dairy', false, 'Live')],
    driverId: 'D-5', truckId: 'T-105', trailerId: 'TR-205', pickupDate: '2026-07-09', deliveryDate: '2026-07-09', progress: 0, podUploaded: false,
  },
  {
    id: 'L-5005', loadNumber: 'L-5005', customer: 'PepsiCo', poNumber: 'PO-55120', commodity: 'Beverages', equipmentType: 'Dry Van', weight: 44300,
    status: 'DISPATCHED', flag: 'CAUTION', originCity: 'Denton', originState: 'TX', destCity: 'Shreveport', destState: 'LA', miles: 288, customerRate: 725, carrierRate: 0,
    stops: [stop('s9', 'PICKUP', 'Pepsi Plant 4', 'Denton', 'TX', 'Jul 9, 08:00', 'Beverages', false, 'Live'), stop('s10', 'DELIVERY', 'Pepsi DC LA', 'Shreveport', 'LA', 'Jul 9, 17:00', 'Beverages', false, 'Live')],
    driverId: 'D-8', truckId: 'T-108', trailerId: 'TR-207', pickupDate: '2026-07-09', deliveryDate: '2026-07-09', progress: 0, podUploaded: false,
  },
  {
    id: 'L-5006', loadNumber: 'L-5006', customer: 'Amazon Freight', poNumber: 'PO-31882', commodity: 'Mixed parcels', equipmentType: 'Dry Van', weight: 36700,
    status: 'NOT_COVERED', flag: 'IMPORTANT', originCity: 'Dallas', originState: 'TX', destCity: 'San Antonio', destState: 'TX', miles: 274, customerRate: 715, carrierRate: 0,
    stops: [stop('s11', 'PICKUP', 'Amazon DFW7', 'Dallas', 'TX', 'Jul 9, 10:00', 'Parcels', false, 'Drop & Hook'), stop('s12', 'DELIVERY', 'Amazon SAT2', 'San Antonio', 'TX', 'Jul 9, 18:00', 'Parcels', false, 'Drop & Hook')],
    driverId: null, truckId: null, trailerId: null, pickupDate: '2026-07-09', deliveryDate: '2026-07-09', progress: 0, podUploaded: false,
  },
  {
    id: 'L-5007', loadNumber: 'L-5007', customer: 'US Foods', poNumber: 'PO-66701', commodity: 'Produce', equipmentType: 'Reefer', weight: 39900,
    status: 'NOT_COVERED', flag: 'CRITICAL', originCity: 'Fort Worth', originState: 'TX', destCity: 'Austin', destState: 'TX', miles: 190, customerRate: 550, carrierRate: 0,
    stops: [stop('s13', 'PICKUP', 'US Foods FW', 'Fort Worth', 'TX', 'Jul 9, 04:00', 'Produce', false, 'Live'), stop('s14', 'DELIVERY', 'US Foods Austin', 'Austin', 'TX', 'Jul 9, 11:00', 'Produce', false, 'Live')],
    driverId: null, truckId: null, trailerId: null, pickupDate: '2026-07-09', deliveryDate: '2026-07-09', progress: 0, podUploaded: false,
  },
  {
    id: 'L-5008', loadNumber: 'L-5008', customer: 'Coca-Cola', poNumber: 'PO-12009', commodity: 'Beverages', equipmentType: 'Dry Van', weight: 43100,
    status: 'NOT_COVERED', flag: 'NONE', originCity: 'Dallas', originState: 'TX', destCity: 'El Paso', destState: 'TX', miles: 636, customerRate: 1495, carrierRate: 0,
    stops: [stop('s15', 'PICKUP', 'CocaCola Plant', 'Dallas', 'TX', 'Jul 10, 06:00', 'Beverages', false, 'Live'), stop('s16', 'DELIVERY', 'CocaCola EP DC', 'El Paso', 'TX', 'Jul 10, 22:00', 'Beverages', false, 'Live')],
    driverId: null, truckId: null, trailerId: null, pickupDate: '2026-07-10', deliveryDate: '2026-07-10', progress: 0, podUploaded: false,
  },
  {
    id: 'L-4998', loadNumber: 'L-4998', customer: 'Sysco Foods', poNumber: 'PO-88001', commodity: 'Frozen goods', equipmentType: 'Reefer', weight: 40500,
    status: 'DELIVERED', flag: 'NONE', originCity: 'Fort Worth', originState: 'TX', destCity: 'Waco', destState: 'TX', miles: 88, customerRate: 320, carrierRate: 0,
    stops: [stop('s17', 'PICKUP', 'Sysco DC 12', 'Fort Worth', 'TX', 'Jul 7, 06:00', 'Frozen goods', true), stop('s18', 'DELIVERY', 'Sysco Waco', 'Waco', 'TX', 'Jul 7, 10:00', 'Frozen goods', true)],
    driverId: 'D-5', truckId: 'T-105', trailerId: 'TR-205', pickupDate: '2026-07-07', deliveryDate: '2026-07-07', progress: 100, podUploaded: true,
  },
  {
    id: 'L-4999', loadNumber: 'L-4999', customer: 'Home Depot', poNumber: 'PO-44001', commodity: 'Building materials', equipmentType: 'Flatbed', weight: 47200,
    status: 'DELIVERED', flag: 'NONE', originCity: 'Dallas', originState: 'TX', destCity: 'Tyler', destState: 'TX', miles: 98, customerRate: 335, carrierRate: 0,
    stops: [stop('s19', 'PICKUP', 'HD Supply Yard', 'Dallas', 'TX', 'Jul 7, 08:00', 'Lumber', true), stop('s20', 'DELIVERY', 'HD Store 220', 'Tyler', 'TX', 'Jul 7, 12:00', 'Lumber', true)],
    driverId: 'D-4', truckId: 'T-104', trailerId: 'TR-204', pickupDate: '2026-07-07', deliveryDate: '2026-07-07', progress: 100, podUploaded: true,
  },
]

export const seedMaintenance: MaintenanceRecord[] = [
  { id: 'M-301', assetType: 'Truck', assetId: 'T-103', assetLabel: 'Truck 103', category: 'Brakes', description: 'Front brake pads + rotor replacement', status: 'IN_PROGRESS', datePerformed: null, dateDue: '2026-07-09', vendor: 'TXW Fleet Service', odometer: 288100, amount: 1850, poNumber: 'WO-301' },
  { id: 'M-302', assetType: 'Truck', assetId: 'T-107', assetLabel: 'Truck 107', category: 'Engine', description: 'Engine diagnostic — check-engine + power loss', status: 'OPEN', datePerformed: null, dateDue: '2026-07-08', vendor: 'Cummins Dallas', odometer: 788400, amount: 0, poNumber: 'WO-302' },
  { id: 'M-303', assetType: 'Trailer', assetId: 'TR-203', assetLabel: 'Trailer 203', category: 'DOT Repair', description: 'Deck board replacement + rail inspection', status: 'IN_PROGRESS', datePerformed: null, dateDue: '2026-07-10', vendor: 'Great Dane Service', odometer: null, amount: 940, poNumber: 'WO-303' },
  { id: 'M-304', assetType: 'Truck', assetId: 'T-101', assetLabel: 'Truck 101', category: 'Preventive', description: 'PM Service A — oil, filters, DOT inspection', status: 'COMPLETED', datePerformed: '2026-06-20', dateDue: null, vendor: 'In-house Shop', odometer: 408200, amount: 610, poNumber: 'WO-296' },
  { id: 'M-305', assetType: 'Truck', assetId: 'T-105', assetLabel: 'Truck 105', category: 'Tires', description: 'Replace 2 drive tires', status: 'COMPLETED', datePerformed: '2026-06-28', dateDue: null, vendor: 'Southwest Tire', odometer: 151900, amount: 1120, poNumber: 'WO-298' },
  { id: 'M-306', assetType: 'Truck', assetId: 'T-102', assetLabel: 'Truck 102', category: 'Preventive', description: 'PM Service due — 525k mi interval', status: 'OPEN', datePerformed: null, dateDue: '2026-07-14', vendor: 'In-house Shop', odometer: 523900, amount: 0, poNumber: 'WO-307' },
]

export const seedSafety: SafetyEvent[] = [
  { id: 'S-401', type: 'ROADSIDE_INSPECTION', date: '2026-06-30', driverId: 'D-1', truckId: 'T-101', trailerId: 'TR-201', location: 'I-35 Weigh Station, Hillsboro TX', level: 'Level 2', status: 'CLOSED', comments: 'No violations. Clean inspection.' },
  { id: 'S-402', type: 'ROADSIDE_INSPECTION', date: '2026-07-02', driverId: 'D-4', truckId: 'T-104', trailerId: 'TR-204', location: 'US-75 Sherman TX', level: 'Level 1', status: 'UNDER_REVIEW', comments: 'Minor: brake adjustment noted. CSA points pending.' },
  { id: 'S-403', type: 'ACCIDENT', date: '2026-06-18', driverId: 'D-8', truckId: 'T-108', trailerId: 'TR-207', location: 'Loop 12, Dallas TX', level: 'Minor — property only', status: 'OPEN', comments: 'Backed into dock plate. Trailer scuff. Claim filed with insurer.' },
]

/* ---------------- Financial / back-office seed ---------------- */
import type {
  Invoice, DriverSettlement, CarrierSettlement, FuelTransaction, TollTransaction,
  IftaJurisdiction, FactoringItem,
} from './types'

export const seedInvoices: Invoice[] = [
  { id: 'INV-2001', invoiceNumber: 'INV-2001', customer: 'Sysco Foods', loadNumbers: ['L-4998'], lineHaul: 320, accessorials: [{ type: 'Detention', amount: 75 }], amount: 395, status: 'PAID', issueDate: '2026-07-07', dueDate: '2026-08-06', paidDate: '2026-07-10', factored: true },
  { id: 'INV-2002', invoiceNumber: 'INV-2002', customer: 'Home Depot', loadNumbers: ['L-4999'], lineHaul: 335, accessorials: [], amount: 335, status: 'INVOICED', issueDate: '2026-07-07', dueDate: '2026-08-06', paidDate: null, factored: true },
  { id: 'INV-2003', invoiceNumber: 'INV-2003', customer: 'PepsiCo', loadNumbers: ['L-5005'], lineHaul: 725, accessorials: [{ type: 'Fuel Surcharge', amount: 90 }], amount: 815, status: 'RELEASED', issueDate: '2026-07-08', dueDate: '2026-08-07', paidDate: null, factored: false },
  { id: 'INV-2004', invoiceNumber: 'INV-2004', customer: 'Kroger', loadNumbers: ['L-5004'], lineHaul: 670, accessorials: [], amount: 670, status: 'RELEASED', issueDate: '2026-07-08', dueDate: '2026-08-07', paidDate: null, factored: false },
  { id: 'INV-2005', invoiceNumber: 'INV-2005', customer: 'Walmart DC', loadNumbers: ['L-5003'], lineHaul: 640, accessorials: [], amount: 640, status: 'INCOMPLETE', issueDate: '2026-07-08', dueDate: '2026-08-07', paidDate: null, factored: false },
  { id: 'INV-2006', invoiceNumber: 'INV-2006', customer: 'Coca-Cola', loadNumbers: ['L-5008'], lineHaul: 1495, accessorials: [{ type: 'Detention', amount: 120 }], amount: 1615, status: 'DISCREPANCY', issueDate: '2026-07-06', dueDate: '2026-08-05', paidDate: null, factored: false },
  { id: 'INV-2007', invoiceNumber: 'INV-2007', customer: 'US Foods', loadNumbers: ['L-4991', 'L-4992'], lineHaul: 980, accessorials: [{ type: 'Lumper', amount: 140 }], amount: 1120, status: 'PAID', issueDate: '2026-06-28', dueDate: '2026-07-28', paidDate: '2026-07-05', factored: true },
  { id: 'INV-2008', invoiceNumber: 'INV-2008', customer: 'Home Depot', loadNumbers: ['L-4988'], lineHaul: 815, accessorials: [], amount: 815, status: 'INVOICED', issueDate: '2026-06-20', dueDate: '2026-07-05', paidDate: null, factored: false },
]

const sl = (loadNumber: string, lane: string, miles: number, rate: number) => ({ loadNumber, lane, miles, rate, pay: Math.round(miles * rate) })

export const seedDriverSettlements: DriverSettlement[] = [
  { id: 'DS-3001', driverId: 'D-1', driverName: 'Marcus Reed', periodStart: '2026-07-01', periodEnd: '2026-07-07', lines: [sl('L-4970', 'Dallas → Houston', 240, 0.62), sl('L-4975', 'Houston → Dallas', 240, 0.62), sl('L-4982', 'Dallas → Waco', 88, 0.62)], gross: 351, deductions: 45, reimbursements: 30, net: 336, status: 'APPROVED' },
  { id: 'DS-3002', driverId: 'D-2', driverName: 'Elena Vasquez', periodStart: '2026-07-01', periodEnd: '2026-07-07', lines: [sl('L-4972', 'Fort Worth → OKC', 206, 0.64), sl('L-4979', 'OKC → Tulsa', 106, 0.64), sl('L-4984', 'Tulsa → Fort Worth', 258, 0.64)], gross: 365, deductions: 52, reimbursements: 20, net: 333, status: 'DRAFT' },
  { id: 'DS-3003', driverId: 'D-4', driverName: 'Jose Alvarez', periodStart: '2026-07-01', periodEnd: '2026-07-07', lines: [sl('L-4971', 'Dallas → Little Rock', 318, 0.70), sl('L-4980', 'Little Rock → Dallas', 318, 0.70)], gross: 445, deductions: 0, reimbursements: 0, net: 445, status: 'DRAFT' },
  { id: 'DS-3004', driverId: 'D-5', driverName: 'Tasha Bell', periodStart: '2026-07-01', periodEnd: '2026-07-07', lines: [sl('L-4998', 'Fort Worth → Waco', 88, 0.61), sl('L-4977', 'Waco → Irving', 96, 0.61), sl('L-4985', 'Irving → Tulsa', 258, 0.61)], gross: 269, deductions: 38, reimbursements: 15, net: 246, status: 'PAID' },
]

export const seedCarrierSettlements: CarrierSettlement[] = [
  { id: 'CS-4001', carrier: 'Lone Star Logistics', mcNumber: 'MC-778210', loadNumbers: ['L-4965'], amount: 1180, status: 'APPROVED', dueDate: '2026-07-18' },
  { id: 'CS-4002', carrier: 'Redline Transport', mcNumber: 'MC-901133', loadNumbers: ['L-4968'], amount: 2240, status: 'DRAFT', dueDate: '2026-07-22' },
]

const ft = (id: string, date: string, truckId: string, driverId: string | null, location: string, state: string, gallons: number, ppg: number, card: string): FuelTransaction =>
  ({ id, date, truckId, driverId, location, state, gallons, pricePerGal: ppg, amount: Math.round(gallons * ppg * 100) / 100, cardLast4: card })

export const seedFuel: FuelTransaction[] = [
  ft('FT-01', '2026-07-08', 'T-102', 'D-2', 'Loves #221', 'TX', 142, 4.12, '4821'),
  ft('FT-02', '2026-07-08', 'T-101', 'D-1', 'Pilot #503', 'TX', 128, 4.05, '4821'),
  ft('FT-03', '2026-07-07', 'T-104', 'D-4', 'TA Little Rock', 'AR', 156, 4.24, '1190'),
  ft('FT-04', '2026-07-07', 'T-105', 'D-5', 'Loves #112', 'TX', 134, 4.09, '5540'),
  ft('FT-05', '2026-07-06', 'T-108', 'D-8', 'Pilot #778', 'TX', 148, 4.15, '6612'),
  ft('FT-06', '2026-07-06', 'T-102', 'D-2', 'Flying J OKC', 'OK', 138, 4.18, '4821'),
  ft('FT-07', '2026-07-05', 'T-101', 'D-1', 'Loves #340', 'TX', 120, 4.02, '4821'),
  ft('FT-08', '2026-07-05', 'T-104', 'D-4', 'TA Shreveport', 'LA', 160, 4.31, '1190'),
  ft('FT-09', '2026-07-04', 'T-105', 'D-5', 'Pilot #221', 'TX', 130, 4.07, '5540'),
  ft('FT-10', '2026-07-03', 'T-108', 'D-8', 'Loves #556', 'TX', 145, 4.11, '6612'),
]

export const seedTolls: TollTransaction[] = [
  { id: 'TL-01', date: '2026-07-08', truckId: 'T-101', location: 'TX-121 Toll', state: 'TX', amount: 18.4, transponder: 'TxTag ••2231' },
  { id: 'TL-02', date: '2026-07-08', truckId: 'T-102', location: 'Turner Turnpike', state: 'OK', amount: 12.75, transponder: 'PikePass ••8890' },
  { id: 'TL-03', date: '2026-07-07', truckId: 'T-104', location: 'DFW Toll Plaza', state: 'TX', amount: 9.6, transponder: 'TxTag ••4412' },
  { id: 'TL-04', date: '2026-07-07', truckId: 'T-108', location: 'PGBT', state: 'TX', amount: 14.2, transponder: 'TxTag ••6612' },
  { id: 'TL-05', date: '2026-07-06', truckId: 'T-105', location: 'Sam Rayburn Tollway', state: 'TX', amount: 11.05, transponder: 'TxTag ••5540' },
  { id: 'TL-06', date: '2026-07-05', truckId: 'T-102', location: 'Turner Turnpike', state: 'OK', amount: 12.75, transponder: 'PikePass ••8890' },
]

export const seedIfta: IftaJurisdiction[] = [
  { state: 'TX', miles: 8420, taxableGallons: 1295, taxPaidGallons: 1410, taxRate: 0.20, netTax: -23.0 },
  { state: 'OK', miles: 2180, taxableGallons: 335, taxPaidGallons: 276, taxRate: 0.19, netTax: 11.21 },
  { state: 'AR', miles: 1640, taxableGallons: 252, taxPaidGallons: 156, taxRate: 0.285, netTax: 27.36 },
  { state: 'LA', miles: 1290, taxableGallons: 198, taxPaidGallons: 160, taxRate: 0.20, netTax: 7.6 },
  { state: 'NM', miles: 980, taxableGallons: 151, taxPaidGallons: 0, taxRate: 0.21, netTax: 31.71 },
  { state: 'TN', miles: 720, taxableGallons: 111, taxPaidGallons: 0, taxRate: 0.27, netTax: 29.97 },
]

export const seedFactoring: FactoringItem[] = [
  { id: 'FC-01', invoiceNumber: 'INV-2001', customer: 'Sysco Foods', amount: 395, advanceRate: 0.97, advance: 383.15, feeRate: 0.03, fee: 11.85, status: 'SETTLED', submittedDate: '2026-07-07' },
  { id: 'FC-02', invoiceNumber: 'INV-2002', customer: 'Home Depot', amount: 335, advanceRate: 0.95, advance: 318.25, feeRate: 0.025, fee: 8.38, status: 'ADVANCED', submittedDate: '2026-07-07' },
  { id: 'FC-03', invoiceNumber: 'INV-2007', customer: 'US Foods', amount: 1120, advanceRate: 0.97, advance: 1086.4, feeRate: 0.03, fee: 33.6, status: 'SETTLED', submittedDate: '2026-06-28' },
  { id: 'FC-04', invoiceNumber: 'INV-2003', customer: 'PepsiCo', amount: 815, advanceRate: 0.95, advance: 774.25, feeRate: 0.025, fee: 20.38, status: 'QUEUED', submittedDate: null },
]

/** Deterministic map positions (0..1 normalized within the TX/OK/AR/LA region canvas). */
export const mapPositions: Record<string, { x: number; y: number }> = {
  'L-5001': { x: 0.44, y: 0.30 },
  'L-5002': { x: 0.60, y: 0.44 },
  'L-5003': { x: 0.48, y: 0.66 },
}
