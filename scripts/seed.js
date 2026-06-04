const Database = require('better-sqlite3');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const dbPath = process.env.DATABASE_PATH || './data/rental.sqlite';
const db = new Database(dbPath);

const insert = db.prepare(`
  INSERT OR IGNORE INTO vehicles
    (name, type, capacity, plate, accessibility_notes, hourly_rate_cents, daily_rate_cents, buffer_minutes, status)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active')
`);

const WHEELCHAIR_NOTES = 'Rear wheelchair ramp, 2 anchor points, hand controls available';
const WAGON_NOTES = 'Large boot, fold-flat rear seats, easy entry';
const VAN_NOTES = 'Sliding door, step assist, 7 seats';
const SEDAN_NOTES = 'Standard sedan, 5 seats, full accessibility features';

const vehicles = [];

// 20 wheelchair-accessible vans
for (let i = 1; i <= 20; i++) {
  vehicles.push({
    name: `Toyota HiAce Wheelchair Van ${i}`,
    type: 'wheelchair',
    capacity: 4,
    plate: `WAC${String(i).padStart(3, '0')}`,
    notes: WHEELCHAIR_NOTES,
    hourly: 3000,   // $30.00/hr
    daily: 16500,   // $165.00/day (incl. $11 accessibility premium)
    buffer: 60,
  });
}

// 20 wheelchair vans — Toyota Tarago
for (let i = 1; i <= 20; i++) {
  vehicles.push({
    name: `Toyota Tarago Accessible Van ${i}`,
    type: 'wheelchair',
    capacity: 6,
    plate: `TAR${String(i).padStart(3, '0')}`,
    notes: 'Power-entry ramp, 3 anchor points, swivel seat option',
    hourly: 3000,
    daily: 16500,
    buffer: 60,
  });
}

// 20 people movers
for (let i = 1; i <= 20; i++) {
  vehicles.push({
    name: `Kia Carnival People Mover ${i}`,
    type: 'van',
    capacity: 8,
    plate: `KCC${String(i).padStart(3, '0')}`,
    notes: VAN_NOTES,
    hourly: 2500,
    daily: 13200,
    buffer: 30,
  });
}

// 20 station wagons
for (let i = 1; i <= 20; i++) {
  vehicles.push({
    name: `Subaru Outback Wagon ${i}`,
    type: 'wagon',
    capacity: 5,
    plate: `WAG${String(i).padStart(3, '0')}`,
    notes: WAGON_NOTES,
    hourly: 2200,
    daily: 13200,
    buffer: 30,
  });
}

// 20 sedans
for (let i = 1; i <= 20; i++) {
  vehicles.push({
    name: `Toyota Camry Sedan ${i}`,
    type: 'sedan',
    capacity: 5,
    plate: `SED${String(i).padStart(3, '0')}`,
    notes: SEDAN_NOTES,
    hourly: 2200,
    daily: 13200,
    buffer: 30,
  });
}

const seedMany = db.transaction((rows) => {
  for (const v of rows) {
    insert.run(v.name, v.type, v.capacity, v.plate, v.notes, v.hourly, v.daily, v.buffer);
  }
});

seedMany(vehicles);
db.close();
console.log(`Seeded ${vehicles.length} vehicles.`);
