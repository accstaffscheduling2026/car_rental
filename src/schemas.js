const { z } = require('zod');

const auPhone = z.string().regex(
  /^(\+61|0)[2-478](\d{8}|\d{2}\s\d{4}\s\d{4}|\d{4}\s\d{4})$/,
  'Enter a valid Australian phone number (e.g. 0412 345 678)'
);

const ReservationCreate = z.object({
  vehicle_id:      z.number().int().positive(),
  customer_name:   z.string().min(2).max(100),
  customer_email:  z.string().email(),
  customer_phone:  auPhone,
  intended_use:    z.string().max(500).optional(),
  addons_json:     z.array(z.string()).optional(),
  start_utc:       z.string().datetime({ offset: true }),
  end_utc:         z.string().datetime({ offset: true }),
  terms_accepted:  z.literal(true, { errorMap: () => ({ message: 'You must accept the terms and conditions' }) }),
});

const PaymentForm = z.object({
  reservation_id:  z.number().int().positive(),
  cardholder_name: z.string().min(2).max(100),
  billing_email:   z.string().email(),
  billing_phone:   auPhone,
  card_last4:      z.string().length(4).regex(/^\d{4}$/),
  expiry_month:    z.string().regex(/^(0[1-9]|1[0-2])$/),
  expiry_year:     z.string().regex(/^\d{4}$/),
  amount_aud:      z.string().regex(/^\d+\.\d{2}$/),
});

const VehicleCreate = z.object({
  name:               z.string().min(2).max(200),
  type:               z.enum(['sedan', 'wagon', 'van', 'wheelchair']),
  capacity:           z.number().int().min(1).max(20),
  plate:              z.string().max(20).optional(),
  accessibility_notes:z.string().max(500).optional(),
  hourly_rate_cents:  z.number().int().min(0),
  daily_rate_cents:   z.number().int().min(0),
  buffer_minutes:     z.number().int().min(0).default(30),
  status:             z.enum(['active', 'maintenance', 'retired']).default('active'),
  maintenance_until:  z.string().datetime({ offset: true }).optional().nullable(),
});

const CancelRequest = z.object({
  customer_email: z.string().email(),
  reason:         z.string().max(500).optional(),
});

const AdminLogin = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

const EmployeeCreate = z.object({
  emp_id: z.string().min(1).max(30),
  name:   z.string().min(2).max(100),
  email:  z.string().email(),
  phone:  z.string().max(20).optional(),
});

const CodeValidate = z.object({
  code: z.string().length(12),
});

module.exports = { ReservationCreate, PaymentForm, VehicleCreate, CancelRequest, AdminLogin, EmployeeCreate, CodeValidate };
