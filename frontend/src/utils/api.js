const BASE = '/api/v1';

async function request(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(json.error || 'Request failed'), { status: res.status, data: json });
  return json;
}

export const api = {
  get:    (path)         => request('GET',    path),
  post:   (path, body)   => request('POST',   path, body),
  patch:  (path, body)   => request('PATCH',  path, body),
  delete: (path)         => request('DELETE', path),
};

export async function getVehicles()             { return api.get('/vehicles'); }
export async function getVehicle(id)            { return api.get(`/vehicles/${id}`); }
export async function getAvailability(params)   {
  const qs = new URLSearchParams(params).toString();
  return api.get(`/availability?${qs}`);
}
export async function createReservation(body)   { return api.post('/reservations', body); }
export async function getReservation(id, email) { return api.get(`/reservations/${id}?email=${encodeURIComponent(email)}`); }
export async function cancelReservation(id, body) { return api.patch(`/reservations/${id}/cancel`, body); }
// Stripe Phase 2 payment
export async function createPaymentIntent(reservationId) {
  return api.post('/payments/intent', { reservation_id: reservationId });
}
export async function verifyPayment(paymentIntentId, reservationId) {
  return api.get(`/payments/verify?payment_intent=${encodeURIComponent(paymentIntentId)}&reservation_id=${encodeURIComponent(reservationId)}`);
}

// Booking codes (public)
export async function validateBookingCode(code)         { return api.post('/codes/validate', { code }); }

// Admin
export async function adminLogin(body)                  { return api.post('/admin/login', body); }
export async function adminLogout()                     { return api.post('/admin/logout'); }
export async function adminMe()                         { return api.get('/admin/me'); }
export async function adminGetReservations(params = {}) {
  const qs = new URLSearchParams(params).toString();
  return api.get(`/admin/reservations${qs ? '?' + qs : ''}`);
}
export async function adminGetReservation(id)           { return api.get(`/admin/reservations/${id}`); }
export async function adminPatchReservation(id, body)   { return api.patch(`/admin/reservations/${id}`, body); }
export async function adminGetVehicles()                { return api.get('/admin/vehicles'); }
export async function adminCreateVehicle(body)          { return api.post('/admin/vehicles', body); }
export async function adminPatchVehicle(id, body)       { return api.patch(`/admin/vehicles/${id}`, body); }
export async function adminDeleteVehicle(id)            { return api.delete(`/admin/vehicles/${id}`); }
export async function adminGetAudit()                   { return api.get('/admin/audit'); }

// Employees & booking codes (admin)
export async function adminGetEmployees()                            { return api.get('/admin/employees'); }
export async function adminGetEmployee(id)                          { return api.get(`/admin/employees/${id}`); }
export async function adminCreateEmployee(body)                     { return api.post('/admin/employees', body); }
export async function adminPatchEmployee(id, body)                  { return api.patch(`/admin/employees/${id}`, body); }
export async function adminDeleteEmployee(id)                       { return api.delete(`/admin/employees/${id}`); }
export async function adminGenerateCode(employeeId)                 { return api.post(`/admin/employees/${employeeId}/generate-code`, {}); }
export async function adminGetAllCodes()                            { return api.get('/admin/employees/codes/all'); }
export async function adminDisableCode(codeId)                      { return api.patch(`/admin/employees/codes/${codeId}/disable`, {}); }
