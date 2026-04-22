/**
 * Seed script: inserts dummy sale_record rows for "Gold" and "Silver"
 * with timestamps spaced at EMA_TIME_WINDOW intervals so the EMA
 * smoothing is clearly observable when the finance service processes them.
 *
 * Usage (from api/ directory):
 *   node scripts/seed-sale-records.js
 *
 * Set environment variables in .env or pass them directly:
 *   DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD, DB_NAME, EMA_TIME_WINDOW
 */

require('dotenv').config();
const { Client } = require('pg');

const HALF_LIFE_MS = parseInt(process.env.EMA_TIME_WINDOW || '3600000'); // default 1 hour
const STEP_MS = Math.floor(HALF_LIFE_MS / 2); // space at halfLife/2 → alpha ≈ 0.39 per step

// alpha = 1 - exp(-0.5) ≈ 0.393 per step: EMA visibly tracks price but is clearly smoothed

const GOLD_PRICES   = [100, 100, 100, 500, 1000, 1000, 500, 100, 100, 100];
const SILVER_PRICES = [ 50,  50, 400, 400,   50,   50, 400, 400,  50,  50];
// Gold:   steady low → gradual spike → gradual decay back (smooth S-curves both ways)
// Silver: abrupt spikes showing EMA lagging behind sudden price changes

async function main() {
  const client = new Client({
    host:     process.env.DB_HOST     || 'localhost',
    port:     parseInt(process.env.DB_PORT || '5432'),
    user:     process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME     || 'mna_agent',
  });

  await client.connect();
  console.log('Connected to database.\n');

  // Clean up previous seed data so the finance service starts fresh
  await client.query("DELETE FROM sale_record WHERE asset_name IN ('Gold', 'Silver')");
  await client.query("DELETE FROM asset_info   WHERE asset_name IN ('Gold', 'Silver')");
  console.log('Cleared existing Gold/Silver rows from sale_record and asset_info.\n');

  // Pre-create asset_info rows so the finance service doesn't get a null result
  // when it calls getAssetInfo(). ema=null triggers the seed-from-price branch.
  await client.query(
    `INSERT INTO asset_info (asset_name, currency, ema, "emaUpdatedAt")
     VALUES ('Gold', 'BJORN', 0, NULL),
            ('Silver', 'BJORN', 0, NULL)`,
  );
  console.log('Created asset_info entries for Gold and Silver.\n');

  // Start timestamps far enough in the past so all records are "unprocessed"
  // relative to whatever latestTimestamp is already stored.
  // We go back (N+1) steps so the oldest record pre-dates any existing cursor.
  const steps = Math.max(GOLD_PRICES.length, SILVER_PRICES.length);
  const baseTimestamp = Date.now() - (steps + 1) * STEP_MS;

  const records = [];

  GOLD_PRICES.forEach((price, i) => {
    records.push({ asset_name: 'Gold',   currency: 'BJORN', price, units: 1,
                   timestamp: baseTimestamp + i * STEP_MS });
  });

  SILVER_PRICES.forEach((price, i) => {
    records.push({ asset_name: 'Silver', currency: 'BJORN', price, units: 1,
                   timestamp: baseTimestamp + i * STEP_MS });
  });

  // Interleave by timestamp so the finance service processes them in order
  records.sort((a, b) => a.timestamp - b.timestamp);

  for (const r of records) {
    await client.query(
      'INSERT INTO sale_record (asset_name, currency, price, units, timestamp) VALUES ($1, $2, $3, $4, $5)',
      [r.asset_name, r.currency, r.price, r.units, r.timestamp],
    );
    console.log(
      `[${new Date(r.timestamp).toISOString()}]  ${r.asset_name.padEnd(6)}  ${String(r.price).padStart(5)} BJORN`,
    );
  }

  console.log(`\nInserted ${records.length} records (halfLife = ${HALF_LIFE_MS} ms).`);
  printExpectedEMA('Gold',   GOLD_PRICES,   STEP_MS, HALF_LIFE_MS);
  printExpectedEMA('Silver', SILVER_PRICES, STEP_MS, HALF_LIFE_MS);

  await client.end();
}

function printExpectedEMA(name, prices, stepMs, halfLifeMs) {
  const alpha = 1 - Math.exp(-stepMs / halfLifeMs);
  console.log(`\nExpected EMA for ${name} (alpha per step ≈ ${alpha.toFixed(4)}):`);
  let ema = null;
  prices.forEach((price, i) => {
    if (ema === null) {
      ema = price;
    } else {
      ema = price * alpha + ema * (1 - alpha);
    }
    console.log(`  step ${String(i).padStart(2)}: sold ${String(price).padStart(5)} → EMA ${ema.toFixed(2)}`);
  });
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
