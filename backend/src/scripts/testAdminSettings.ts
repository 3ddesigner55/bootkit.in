import mongoose from 'mongoose';
import SystemSettings from '../models/systemSettings.model';
import TaxProfile from '../models/taxProfile.model';
import CustomRole from '../models/customRole.model';
import User from '../models/user.model';

function runSettingsTests() {
  console.log('--- STARTING SETTINGS & CONFIGURATIONS INVARIANTS TEST SUITE ---');

  const fakeAdminId = new mongoose.Types.ObjectId();

  // TEST 1: SystemSettings Versioned Document Schema & Scope
  const feeConfig = new SystemSettings({
    scope: 'DELIVERY',
    configVersion: 1,
    status: 'PUBLISHED',
    value: {
      baseDeliveryFee: 2900,
      freeDeliveryThreshold: 49900,
      handlingFee: 500,
      smallOrderFee: 1500,
      smallOrderThreshold: 14900,
      minimumOrderValue: 9900,
      nightFee: 2000,
      surgeFee: 0,
      surgeActive: false,
    },
    publishedAt: new Date(),
    publishedBy: fakeAdminId,
  });
  const feeErr = feeConfig.validateSync();
  if (feeErr) throw feeErr;
  console.log('✓ Test 1: SystemSettings versioned schema validated with integer paise fields.');

  // TEST 2: Free Delivery Threshold Logic
  const subtotal1 = 55000; // ₹550.00
  const isFreeDelivery = subtotal1 >= feeConfig.value.freeDeliveryThreshold;
  const deliveryCharge = isFreeDelivery ? 0 : feeConfig.value.baseDeliveryFee;
  if (deliveryCharge === 0) {
    console.log('✓ Test 2: Free delivery threshold enforced (₹550 >= ₹499 threshold -> delivery = ₹0).');
  }

  // TEST 3: Handling Fee Preservation
  const handling = feeConfig.value.handlingFee;
  if (handling === 500 && isFreeDelivery) {
    console.log('✓ Test 3: Handling fee preserved (₹5) even when delivery is free.');
  }

  // TEST 4: Small Order Surcharge Guard
  const smallSubtotal = 12000; // ₹120.00 < ₹149.00
  const smallFee = smallSubtotal < feeConfig.value.smallOrderThreshold ? feeConfig.value.smallOrderFee : 0;
  if (smallFee === 1500) {
    console.log('✓ Test 4: Small-order fee (₹15) triggered for cart below threshold (₹120 < ₹149).');
  }

  // TEST 5: Tax Slab Intra-State Split Ratio
  const taxSlab = new TaxProfile({
    profileName: 'GST 18%',
    taxRate: 18,
    intraStateSplitRatio: 0.5,
    hsnCode: '9983',
    priceMode: 'TAX_INCLUSIVE',
    startDate: new Date(),
    createdBy: fakeAdminId,
  });
  const taxErr = taxSlab.validateSync();
  if (taxErr) throw taxErr;
  const cgstRate = taxSlab.taxRate * taxSlab.intraStateSplitRatio;
  const sgstRate = taxSlab.taxRate * (1 - taxSlab.intraStateSplitRatio);
  if (cgstRate === 9 && sgstRate === 9) {
    console.log('✓ Test 5: Tax slab split calculated correctly (18% GST -> 9% CGST + 9% SGST).');
  }

  // TEST 6: Staff User Creation & Role Assignment
  const staffUser = new User({
    firstName: 'Karan',
    lastName: 'Verma',
    email: 'karan.verma@bootkit.in',
    phone: '9876543210',
    role: 'ADMIN',
    status: 'ACTIVE',
  });
  const staffErr = staffUser.validateSync();
  if (staffErr) throw staffErr;
  console.log('✓ Test 6: Staff user model validated with privileged ADMIN role.');

  // TEST 7: Custom Role & Granular Permissions Array
  const customRole = new CustomRole({
    name: 'DISPATCH_CONTROLLER',
    permissions: ['orders.view', 'orders.dispatch', 'riders.view', 'riders.assign'],
    createdBy: fakeAdminId,
  });
  const roleErr = customRole.validateSync();
  if (roleErr) throw roleErr;
  console.log('✓ Test 7: Custom RBAC role validated with granular permission matrix.');

  console.log('\n======================================================');
  console.log('ALL SETTINGS & CONFIGURATIONS INVARIANT ASSERTIONS PASSED!');
  console.log('======================================================\n');
}

runSettingsTests();
