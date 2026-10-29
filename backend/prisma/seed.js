/**
 * @file Database Seed Script
 * @description Seeds departments, locations, categories, users, assets, maintenance schedules & logs, checkouts, and notifications.
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('--- Cleaning up existing database records ---');
  await prisma.auditLog.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.usageLog.deleteMany({});
  await prisma.maintenanceLog.deleteMany({});
  await prisma.maintenanceSchedule.deleteMany({});
  await prisma.asset.deleteMany({});
  await prisma.location.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.department.deleteMany({});

  console.log('--- Creating Departments ---');
  const deptCS = await prisma.department.create({
    data: { name: 'Computer Science & Engineering', code: 'CSE' },
  });
  const deptECE = await prisma.department.create({
    data: { name: 'Electronics & Communication', code: 'ECE' },
  });
  const deptPhysics = await prisma.department.create({
    data: { name: 'Department of Physics', code: 'PHY' },
  });
  const deptChemistry = await prisma.department.create({
    data: { name: 'Department of Chemistry', code: 'CHM' },
  });

  console.log('--- Creating Locations ---');
  const locCSLab1 = await prisma.location.create({
    data: { name: 'Advanced Computing Lab', building: 'Turing Block', room: 'TB-201', departmentId: deptCS.id },
  });
  const locCSStore = await prisma.location.create({
    data: { name: 'CSE Hardware Store', building: 'Turing Block', room: 'TB-105', departmentId: deptCS.id },
  });
  const locECELab1 = await prisma.location.create({
    data: { name: 'VLSI & Embedded Systems Lab', building: 'Tesla Block', room: 'EB-302', departmentId: deptECE.id },
  });
  const locECEStore = await prisma.location.create({
    data: { name: 'ECE Instrumentation Store', building: 'Tesla Block', room: 'EB-101', departmentId: deptECE.id },
  });
  const locOpticsLab = await prisma.location.create({
    data: { name: 'Optics & Laser Lab', building: 'Newton Block', room: 'NB-110', departmentId: deptPhysics.id },
  });
  const locGeneralPhysics = await prisma.location.create({
    data: { name: 'Mechanics & Heat Lab', building: 'Newton Block', room: 'NB-114', departmentId: deptPhysics.id },
  });
  const locOrganicLab = await prisma.location.create({
    data: { name: 'Organic Synthesis Lab', building: 'Curie Block', room: 'CB-204', departmentId: deptChemistry.id },
  });
  const locChemStore = await prisma.location.create({
    data: { name: 'Chemical Reagents Store', building: 'Curie Block', room: 'CB-102', departmentId: deptChemistry.id },
  });

  console.log('--- Creating Categories ---');
  const catComputer = await prisma.category.create({
    data: { name: 'Computer & Peripherals', type: 'computer' },
  });
  const catOscilloscope = await prisma.category.create({
    data: { name: 'Electronic Instruments', type: 'instrument' },
  });
  const catFurniture = await prisma.category.create({
    data: { name: 'Laboratory Furniture', type: 'furniture' },
  });
  const catNetwork = await prisma.category.create({
    data: { name: 'Networking Hardware', type: 'computer' },
  });
  const catReagent = await prisma.category.create({
    data: { name: 'Chemical Reagents', type: 'consumable' },
  });
  const catGlassware = await prisma.category.create({
    data: { name: 'Lab Glassware & Supplies', type: 'consumable' },
  });

  console.log('--- Creating Users ---');
  const passwordHashAdmin = await bcrypt.hash('admin123', 10);
  const passwordHashLab = await bcrypt.hash('lab123', 10);
  const passwordHashStaff = await bcrypt.hash('staff123', 10);
  const passwordHashDept = await bcrypt.hash('dept123', 10);

  const admin1 = await prisma.user.create({
    data: {
      email: 'admin@college.edu',
      name: 'System Administrator',
      passwordHash: passwordHashAdmin,
      role: 'ADMIN',
      departmentId: deptCS.id,
    },
  });

  const admin2 = await prisma.user.create({
    data: {
      email: 'admin2@college.edu',
      name: 'Campus Facility Admin',
      passwordHash: passwordHashAdmin,
      role: 'ADMIN',
      departmentId: deptECE.id,
    },
  });

  const labInchargeCS = await prisma.user.create({
    data: {
      email: 'labincharge@college.edu',
      name: 'Prof. Alan Smith (CSE Lab Incharge)',
      passwordHash: passwordHashLab,
      role: 'LAB_INCHARGE',
      departmentId: deptCS.id,
    },
  });

  const labInchargeECE = await prisma.user.create({
    data: {
      email: 'labincharge2@college.edu',
      name: 'Dr. Sarah Connor (ECE Lab Incharge)',
      passwordHash: passwordHashLab,
      role: 'LAB_INCHARGE',
      departmentId: deptECE.id,
    },
  });

  const staff1 = await prisma.user.create({
    data: {
      email: 'staff@college.edu',
      name: 'John Doe (Research Scholar)',
      passwordHash: passwordHashStaff,
      role: 'STAFF',
      departmentId: deptCS.id,
    },
  });

  const staff2 = await prisma.user.create({
    data: {
      email: 'staff2@college.edu',
      name: 'Emily Davis (Lab Assistant)',
      passwordHash: passwordHashStaff,
      role: 'STAFF',
      departmentId: deptPhysics.id,
    },
  });

  const deptHeadCS = await prisma.user.create({
    data: {
      email: 'depthead@college.edu',
      name: 'Prof. Donald Knuth (CSE Dept Head)',
      passwordHash: passwordHashDept,
      role: 'DEPT_HEAD',
      departmentId: deptCS.id,
    },
  });

  const deptHeadECE = await prisma.user.create({
    data: {
      email: 'depthead2@college.edu',
      name: 'Dr. Claude Shannon (ECE Dept Head)',
      passwordHash: passwordHashDept,
      role: 'DEPT_HEAD',
      departmentId: deptECE.id,
    },
  });

  console.log('--- Creating 30 Assets ---');

  const assetsData = [
    // CSE Department Assets
    {
      assetCode: 'AST-CSE-00001',
      name: 'Dell Precision 3660 Workstation',
      categoryId: catComputer.id,
      departmentId: deptCS.id,
      locationId: locCSLab1.id,
      serialNumber: 'SN-DELL-3660-01',
      purchaseDate: new Date('2023-01-15'),
      vendor: 'Dell Technologies Inc.',
      cost: 1450.0,
      warrantyExpiry: new Date('2026-01-15'),
      condition: 'Good',
      status: 'Available',
    },
    {
      assetCode: 'AST-CSE-00002',
      name: 'Dell Precision 3660 Workstation',
      categoryId: catComputer.id,
      departmentId: deptCS.id,
      locationId: locCSLab1.id,
      serialNumber: 'SN-DELL-3660-02',
      purchaseDate: new Date('2023-01-15'),
      vendor: 'Dell Technologies Inc.',
      cost: 1450.0,
      warrantyExpiry: new Date('2026-01-15'),
      condition: 'Good',
      status: 'InUse',
      currentHolderId: staff1.id,
    },
    {
      assetCode: 'AST-CSE-00003',
      name: 'Cisco Catalyst 9300 48-Port Switch',
      categoryId: catNetwork.id,
      departmentId: deptCS.id,
      locationId: locCSStore.id,
      serialNumber: 'CAT9300-884920',
      purchaseDate: new Date('2022-08-10'),
      vendor: 'Cisco Direct',
      cost: 3200.0,
      warrantyExpiry: new Date('2025-08-10'),
      condition: 'Good',
      status: 'Available',
    },
    {
      assetCode: 'AST-CSE-00004',
      name: 'NVIDIA DGX Station A100 AI Server',
      categoryId: catComputer.id,
      departmentId: deptCS.id,
      locationId: locCSLab1.id,
      serialNumber: 'NV-A100-9948',
      purchaseDate: new Date('2023-06-20'),
      vendor: 'NVIDIA Enterprise',
      cost: 29500.0,
      warrantyExpiry: new Date('2026-06-20'),
      condition: 'Good',
      status: 'UnderMaintenance',
    },
    {
      assetCode: 'AST-CSE-00005',
      name: 'HP LaserJet Enterprise MFP M630',
      categoryId: catComputer.id,
      departmentId: deptCS.id,
      locationId: locCSStore.id,
      serialNumber: 'HP-M630-1123',
      purchaseDate: new Date('2020-03-12'),
      vendor: 'HP Inc.',
      cost: 950.0,
      warrantyExpiry: new Date('2023-03-12'),
      condition: 'Fair',
      status: 'Available',
    },
    {
      assetCode: 'AST-CSE-00006',
      name: 'Cat6 UTP Ethernet Cable Roll (305m)',
      categoryId: catNetwork.id,
      departmentId: deptCS.id,
      locationId: locCSStore.id,
      serialNumber: null,
      purchaseDate: new Date('2024-02-01'),
      vendor: 'D-Link Supplies',
      cost: 95.0,
      condition: 'Good',
      status: 'Available',
      quantity: 3, // LOW STOCK (min is 5)
      minThreshold: 5,
      maxLevel: 25,
    },
    {
      assetCode: 'AST-CSE-00007',
      name: 'RJ45 Modular Connectors (Pack of 100)',
      categoryId: catNetwork.id,
      departmentId: deptCS.id,
      locationId: locCSStore.id,
      serialNumber: null,
      purchaseDate: new Date('2024-02-01'),
      vendor: 'TechZone',
      cost: 15.0,
      condition: 'Good',
      status: 'Available',
      quantity: 12,
      minThreshold: 4,
      maxLevel: 20,
    },
    {
      assetCode: 'AST-CSE-00008',
      name: 'Anti-Static Lab Workstation Bench',
      categoryId: catFurniture.id,
      departmentId: deptCS.id,
      locationId: locCSLab1.id,
      serialNumber: 'FURN-ESD-01',
      purchaseDate: new Date('2021-11-05'),
      vendor: 'LabCrafters',
      cost: 650.0,
      condition: 'Good',
      status: 'Available',
    },

    // ECE Department Assets
    {
      assetCode: 'AST-ECE-00001',
      name: 'Tektronix TBS2000B Digital Oscilloscope (100MHz)',
      categoryId: catOscilloscope.id,
      departmentId: deptECE.id,
      locationId: locECELab1.id,
      serialNumber: 'TEK-TBS2104-5829',
      purchaseDate: new Date('2022-04-18'),
      vendor: 'Tektronix Systems',
      cost: 2150.0,
      warrantyExpiry: new Date('2025-04-18'),
      condition: 'Good',
      status: 'Available',
    },
    {
      assetCode: 'AST-ECE-00002',
      name: 'Keysight DSOX1204G Oscilloscope with Waveform Gen',
      categoryId: catOscilloscope.id,
      departmentId: deptECE.id,
      locationId: locECELab1.id,
      serialNumber: 'KEYS-DSOX-9938',
      purchaseDate: new Date('2022-09-10'),
      vendor: 'Keysight Technologies',
      cost: 2800.0,
      warrantyExpiry: new Date('2025-09-10'),
      condition: 'Good',
      status: 'InUse',
      currentHolderId: staff1.id,
    },
    {
      assetCode: 'AST-ECE-00003',
      name: 'Rigol DG1022Z Function/Arbitrary Waveform Generator',
      categoryId: catOscilloscope.id,
      departmentId: deptECE.id,
      locationId: locECELab1.id,
      serialNumber: 'RIG-DG1022-4411',
      purchaseDate: new Date('2023-03-05'),
      vendor: 'Rigol Instruments',
      cost: 580.0,
      warrantyExpiry: new Date('2026-03-05'),
      condition: 'Good',
      status: 'Available',
    },
    {
      assetCode: 'AST-ECE-00004',
      name: 'Xilinx Zynq-7000 FPGA Development Board',
      categoryId: catOscilloscope.id,
      departmentId: deptECE.id,
      locationId: locECEStore.id,
      serialNumber: 'XIL-Z7-8821',
      purchaseDate: new Date('2023-05-15'),
      vendor: 'Digilent Inc.',
      cost: 350.0,
      warrantyExpiry: new Date('2024-05-15'),
      condition: 'Good',
      status: 'Available',
    },
    {
      assetCode: 'AST-ECE-00005',
      name: 'HAKKO FX-888D Digital Soldering Station',
      categoryId: catOscilloscope.id,
      departmentId: deptECE.id,
      locationId: locECELab1.id,
      serialNumber: 'HK-FX888-02',
      purchaseDate: new Date('2021-08-20'),
      vendor: 'Hakko Corp.',
      cost: 160.0,
      condition: 'Good',
      status: 'Available',
    },
    {
      assetCode: 'AST-ECE-00006',
      name: 'Leaded Solder Wire Spool 60/40 (500g)',
      categoryId: catReagent.id,
      departmentId: deptECE.id,
      locationId: locECEStore.id,
      serialNumber: null,
      purchaseDate: new Date('2024-01-10'),
      vendor: 'Kester Electronics',
      cost: 25.0,
      condition: 'Good',
      status: 'Available',
      quantity: 2, // LOW STOCK (min is 5)
      minThreshold: 5,
      maxLevel: 30,
    },
    {
      assetCode: 'AST-ECE-00007',
      name: 'Legacy CRT Analog Oscilloscope (20MHz)',
      categoryId: catOscilloscope.id,
      departmentId: deptECE.id,
      locationId: locECEStore.id,
      serialNumber: 'LEG-OSC-1998',
      purchaseDate: new Date('2005-02-10'),
      vendor: 'GW Instek',
      cost: 300.0,
      condition: 'Damaged',
      status: 'Retired',
      retirementReason: 'Obsolete analog cathode tube, replaced by digital scopes.',
      retirementApprovedBy: admin1.id,
    },

    // Physics Department Assets
    {
      assetCode: 'AST-PHY-00001',
      name: 'Thorlabs He-Ne Laser System (632.8nm, 5mW)',
      categoryId: catOscilloscope.id,
      departmentId: deptPhysics.id,
      locationId: locOpticsLab.id,
      serialNumber: 'THOR-HNL-050R',
      purchaseDate: new Date('2021-07-12'),
      vendor: 'Thorlabs Inc.',
      cost: 2450.0,
      warrantyExpiry: new Date('2024-07-12'),
      condition: 'Good',
      status: 'Available',
    },
    {
      assetCode: 'AST-PHY-00002',
      name: 'Michelson Interferometer Precision Kit',
      categoryId: catOscilloscope.id,
      departmentId: deptPhysics.id,
      locationId: locOpticsLab.id,
      serialNumber: 'PASCO-MI-9255',
      purchaseDate: new Date('2022-02-28'),
      vendor: 'PASCO Scientific',
      cost: 1850.0,
      warrantyExpiry: new Date('2025-02-28'),
      condition: 'Good',
      status: 'Available',
    },
    {
      assetCode: 'AST-PHY-00003',
      name: 'Leybold Franck-Hertz Experiment Apparatus',
      categoryId: catOscilloscope.id,
      departmentId: deptPhysics.id,
      locationId: locGeneralPhysics.id,
      serialNumber: 'LEY-FH-55588',
      purchaseDate: new Date('2020-09-14'),
      vendor: 'LD DIDACTIC GmbH',
      cost: 4200.0,
      warrantyExpiry: new Date('2023-09-14'),
      condition: 'Fair',
      status: 'UnderMaintenance',
    },
    {
      assetCode: 'AST-PHY-00004',
      name: 'Shimadzu High Precision Analytical Balance (0.1mg)',
      categoryId: catOscilloscope.id,
      departmentId: deptPhysics.id,
      locationId: locGeneralPhysics.id,
      serialNumber: 'SHIM-AUW-220D',
      purchaseDate: new Date('2023-04-10'),
      vendor: 'Shimadzu Corp.',
      cost: 3100.0,
      warrantyExpiry: new Date('2026-04-10'),
      condition: 'Good',
      status: 'Available',
    },
    {
      assetCode: 'AST-PHY-00005',
      name: 'Heavy-Duty Optical Breadboard Table (1200x900mm)',
      categoryId: catFurniture.id,
      departmentId: deptPhysics.id,
      locationId: locOpticsLab.id,
      serialNumber: 'OPT-TBL-9012',
      purchaseDate: new Date('2021-06-15'),
      vendor: 'Newport Corp.',
      cost: 1750.0,
      condition: 'Good',
      status: 'Available',
    },
    {
      assetCode: 'AST-PHY-00006',
      name: 'Spectrometer Prism Assemblies (Set of 6)',
      categoryId: catGlassware.id,
      departmentId: deptPhysics.id,
      locationId: locOpticsLab.id,
      serialNumber: null,
      purchaseDate: new Date('2023-11-20'),
      vendor: 'Edmund Optics',
      cost: 120.0,
      condition: 'Good',
      status: 'Available',
      quantity: 4,
      minThreshold: 2,
      maxLevel: 10,
    },

    // Chemistry Department Assets
    {
      assetCode: 'AST-CHM-00001',
      name: 'Agilent 1260 Infinity II HPLC System',
      categoryId: catOscilloscope.id,
      departmentId: deptChemistry.id,
      locationId: locOrganicLab.id,
      serialNumber: 'AGL-HPLC-1260-88',
      purchaseDate: new Date('2022-10-05'),
      vendor: 'Agilent Technologies',
      cost: 48000.0,
      warrantyExpiry: new Date('2025-10-05'),
      condition: 'Good',
      status: 'Available',
    },
    {
      assetCode: 'AST-CHM-00002',
      name: 'Thermo Scientific Nicolet iS50 FTIR Spectrometer',
      categoryId: catOscilloscope.id,
      departmentId: deptChemistry.id,
      locationId: locOrganicLab.id,
      serialNumber: 'THRM-FTIR-5002',
      purchaseDate: new Date('2023-08-15'),
      vendor: 'Thermo Fisher Scientific',
      cost: 38500.0,
      warrantyExpiry: new Date('2026-08-15'),
      condition: 'Good',
      status: 'Available',
    },
    {
      assetCode: 'AST-CHM-00003',
      name: 'Buchi Rotavapor R-300 Rotary Evaporator',
      categoryId: catOscilloscope.id,
      departmentId: deptChemistry.id,
      locationId: locOrganicLab.id,
      serialNumber: 'BUCHI-R300-192',
      purchaseDate: new Date('2022-01-20'),
      vendor: 'Buchi Labortechnik',
      cost: 5400.0,
      warrantyExpiry: new Date('2025-01-20'),
      condition: 'Good',
      status: 'Available',
    },
    {
      assetCode: 'AST-CHM-00004',
      name: 'Labconco Protector Chemical Fume Hood 6ft',
      categoryId: catFurniture.id,
      departmentId: deptChemistry.id,
      locationId: locOrganicLab.id,
      serialNumber: 'LBC-HOOD-6FT-01',
      purchaseDate: new Date('2021-03-10'),
      vendor: 'Labconco Corporation',
      cost: 7200.0,
      condition: 'Good',
      status: 'Available',
    },
    {
      assetCode: 'AST-CHM-00005',
      name: 'Ethanol Absolute AR Grade (2.5L Glass Bottle)',
      categoryId: catReagent.id,
      departmentId: deptChemistry.id,
      locationId: locChemStore.id,
      serialNumber: null,
      purchaseDate: new Date('2024-03-01'),
      vendor: 'Sigma-Aldrich / Merck',
      cost: 45.0,
      condition: 'Good',
      status: 'Available',
      quantity: 4, // LOW STOCK (min is 10)
      minThreshold: 10,
      maxLevel: 50,
    },
    {
      assetCode: 'AST-CHM-00006',
      name: 'Hydrochloric Acid 37% ACS Grade (2.5L)',
      categoryId: catReagent.id,
      departmentId: deptChemistry.id,
      locationId: locChemStore.id,
      serialNumber: null,
      purchaseDate: new Date('2024-02-15'),
      vendor: 'Fisher Chemical',
      cost: 35.0,
      condition: 'Good',
      status: 'Available',
      quantity: 18,
      minThreshold: 6,
      maxLevel: 40,
    },
    {
      assetCode: 'AST-CHM-00007',
      name: 'Borosil 250ml Borosilicate Glass Beakers (Pack of 12)',
      categoryId: catGlassware.id,
      departmentId: deptChemistry.id,
      locationId: locChemStore.id,
      serialNumber: null,
      purchaseDate: new Date('2023-12-01'),
      vendor: 'Borosil Scientific',
      cost: 28.0,
      condition: 'Good',
      status: 'Available',
      quantity: 25,
      minThreshold: 5,
      maxLevel: 30,
    },
    {
      assetCode: 'AST-CHM-00008',
      name: 'Pyrex 500ml Volumetric Flasks Class A (Pack of 6)',
      categoryId: catGlassware.id,
      departmentId: deptChemistry.id,
      locationId: locChemStore.id,
      serialNumber: null,
      purchaseDate: new Date('2023-12-01'),
      vendor: 'Corning Pyrex',
      cost: 65.0,
      condition: 'Good',
      status: 'Available',
      quantity: 8,
      minThreshold: 3,
      maxLevel: 15,
    },
  ];

  const createdAssets = [];
  for (const assetData of assetsData) {
    const a = await prisma.asset.create({ data: assetData });
    createdAssets.push(a);
  }

  console.log(`Created ${createdAssets.length} assets.`);

  console.log('--- Creating Maintenance Schedules & Logs ---');
  // Schedule 1: Tektronix Scope annual calibration
  const scopeAsset = createdAssets.find((a) => a.assetCode === 'AST-ECE-00001');
  const schedScope = await prisma.maintenanceSchedule.create({
    data: {
      assetId: scopeAsset.id,
      type: 'calibration',
      intervalDays: 365,
      alertDaysBefore: 15,
      nextDueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // Due in 10 days
      active: true,
    },
  });

  // Schedule 2: HPLC Calibration (overdue)
  const hplcAsset = createdAssets.find((a) => a.assetCode === 'AST-CHM-00001');
  const schedHplc = await prisma.maintenanceSchedule.create({
    data: {
      assetId: hplcAsset.id,
      type: 'calibration',
      intervalDays: 180,
      alertDaysBefore: 14,
      nextDueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // Overdue by 5 days
      active: true,
    },
  });

  // Schedule 3: DGX Server Quarterly Thermal Check
  const dgxAsset = createdAssets.find((a) => a.assetCode === 'AST-CSE-00004');
  const schedDgx = await prisma.maintenanceSchedule.create({
    data: {
      assetId: dgxAsset.id,
      type: 'maintenance',
      intervalDays: 90,
      alertDaysBefore: 7,
      nextDueDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000), // In 25 days
      active: true,
    },
  });

  // Schedule 4: Fume Hood Annual Airflow Certification
  const hoodAsset = createdAssets.find((a) => a.assetCode === 'AST-CHM-00004');
  await prisma.maintenanceSchedule.create({
    data: {
      assetId: hoodAsset.id,
      type: 'renewal',
      intervalDays: 365,
      alertDaysBefore: 30,
      nextDueDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // In 60 days
      active: true,
    },
  });

  // Schedule 5: Laser Alignment Inspection
  const laserAsset = createdAssets.find((a) => a.assetCode === 'AST-PHY-00001');
  await prisma.maintenanceSchedule.create({
    data: {
      assetId: laserAsset.id,
      type: 'maintenance',
      intervalDays: 120,
      alertDaysBefore: 10,
      nextDueDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), // In 4 days (upcoming)
      active: true,
    },
  });

  // Maintenance Logs
  await prisma.maintenanceLog.create({
    data: {
      assetId: scopeAsset.id,
      scheduleId: schedScope.id,
      performedDate: new Date('2023-10-15'),
      type: 'calibration',
      performedById: labInchargeECE.id,
      cost: 150.0,
      notes: 'Certified compliant with NIST standards. Signal jitter within 0.02%.',
      nextDueDate: schedScope.nextDueDate,
    },
  });

  await prisma.maintenanceLog.create({
    data: {
      assetId: hplcAsset.id,
      scheduleId: schedHplc.id,
      performedDate: new Date('2023-11-20'),
      type: 'maintenance',
      performedById: labInchargeCS.id,
      cost: 450.0,
      notes: 'Replaced high-pressure seal and degasser membrane.',
      nextDueDate: schedHplc.nextDueDate,
    },
  });

  await prisma.maintenanceLog.create({
    data: {
      assetId: dgxAsset.id,
      scheduleId: schedDgx.id,
      performedDate: new Date('2024-01-15'),
      type: 'maintenance',
      performedById: labInchargeCS.id,
      cost: 0.0,
      notes: 'Cleaned intake filters and updated firmware to version 23.1.',
    },
  });

  console.log('--- Creating Usage Logs (Checkouts) ---');
  const wsAsset = createdAssets.find((a) => a.assetCode === 'AST-CSE-00002');
  const keysightAsset = createdAssets.find((a) => a.assetCode === 'AST-ECE-00002');
  const precisionAsset = createdAssets.find((a) => a.assetCode === 'AST-CSE-00001');

  // Active Checkout 1
  await prisma.usageLog.create({
    data: {
      assetId: wsAsset.id,
      userId: staff1.id,
      purpose: 'Training deep learning model for computer vision thesis project',
      checkoutTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      expectedReturn: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
      status: 'CheckedOut',
    },
  });

  // Active Checkout 2 (Overdue)
  await prisma.usageLog.create({
    data: {
      assetId: keysightAsset.id,
      userId: staff1.id,
      purpose: 'RF filter signal integrity characterization',
      checkoutTime: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
      expectedReturn: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      status: 'Overdue',
    },
  });

  // Completed Returns
  await prisma.usageLog.create({
    data: {
      assetId: precisionAsset.id,
      userId: staff2.id,
      purpose: 'Numerical simulations in MATLAB',
      checkoutTime: new Date('2024-01-10T09:00:00Z'),
      expectedReturn: new Date('2024-01-15T17:00:00Z'),
      actualReturn: new Date('2024-01-15T15:30:00Z'),
      conditionOnReturn: 'Good',
      status: 'Returned',
    },
  });

  console.log('--- Creating Notifications ---');
  await prisma.notification.create({
    data: {
      userId: labInchargeECE.id,
      title: 'Calibration Due Soon',
      message: 'Tektronix TBS2000B Digital Oscilloscope is due for annual calibration in 10 days.',
      type: 'maintenance',
      read: false,
    },
  });

  await prisma.notification.create({
    data: {
      userId: labInchargeCS.id,
      title: 'Low Stock Alert: Cat6 Cable',
      message: 'Cat6 UTP Ethernet Cable Roll is below threshold (3 remaining, min is 5).',
      type: 'lowStock',
      read: false,
    },
  });

  await prisma.notification.create({
    data: {
      userId: staff1.id,
      title: 'Overdue Asset Return Reminder',
      message: 'Keysight DSOX1204G Oscilloscope return was expected yesterday. Please check it in.',
      type: 'overdue',
      read: false,
    },
  });

  console.log('--- Creating Audit Logs ---');
  await prisma.auditLog.create({
    data: {
      userId: admin1.id,
      action: 'CREATE',
      entityType: 'Asset',
      entityId: wsAsset.id,
      assetId: wsAsset.id,
      newValue: JSON.stringify({ name: wsAsset.name, assetCode: wsAsset.assetCode }),
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: labInchargeCS.id,
      action: 'CHECKOUT',
      entityType: 'UsageLog',
      entityId: wsAsset.id,
      assetId: wsAsset.id,
      newValue: JSON.stringify({ user: staff1.email, asset: wsAsset.assetCode }),
    },
  });

  console.log('--- Database seed completed successfully! ---');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

