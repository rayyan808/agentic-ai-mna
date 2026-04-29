import { MigrationInterface, QueryRunner } from "typeorm";

export class MaterializedViews1777392935153 implements MigrationInterface {
  name = "MaterializedViews1777392935153";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE MATERIALIZED VIEW hourly_trades
      WITH (timescaledb.continuous) AS
      SELECT
        time_bucket('1 hour', timestamp) AS bucket,
        asset_name,
        token_name,
        first(price::float, timestamp)   AS open,
        last(price::float, timestamp)    AS close,
        min(price::float)           AS low,
        max(price::float)           AS high,
        SUM(units)                  AS volume,
        SUM(price::float)           AS sum_price,
        SUM(units * price::float)   AS sum_price_volume,
        COUNT(*)                    AS trade_count
      FROM sale_record
      GROUP BY 1, 2, 3
      WITH NO DATA
    `);
    await queryRunner.query(`
      SELECT add_continuous_aggregate_policy('hourly_trades',
        start_offset    => INTERVAL '4 hours',
        end_offset      => INTERVAL '1 hour',
        schedule_interval => INTERVAL '10 minutes'
      );
    `);

    await queryRunner.query(`
      CREATE MATERIALIZED VIEW daily_trades 
      WITH (timescaledb.continuous) AS
      SELECT
        time_bucket('1 day', bucket) as bucket,
        asset_name,
        token_name,
        first(open, bucket) as open,
        last(close, bucket) as close,
        min(low) as low,
        max(high) as high,
        SUM(volume) as volume,
        SUM(sum_price) as sum_price,
        SUM(sum_price_volume) as sum_price_volume,
        SUM(trade_count) as trade_count
      FROM hourly_trades 
      GROUP BY 1, 2, 3
      WITH NO DATA
    `);
    await queryRunner.query(`
      SELECT add_continuous_aggregate_policy('daily_trades',
        start_offset    => INTERVAL '4 days',
        end_offset      => INTERVAL '1 day',
        schedule_interval => INTERVAL '1 hour'
      );
    `);

    await queryRunner.query(`
      CREATE MATERIALIZED VIEW weekly_trades 
      WITH (timescaledb.continuous) AS
      SELECT
        time_bucket('7 days', bucket) as bucket,
        asset_name,
        token_name,
        first(open, bucket) as open,
        last(close, bucket) as close,
        min(low) as low,
        max(high) as high,
        SUM(volume) as volume,
        SUM(sum_price) as sum_price,
        SUM(sum_price_volume) as sum_price_volume,
        SUM(trade_count) as trade_count
      FROM daily_trades
      GROUP BY 1, 2, 3
      WITH NO DATA
    `);
    await queryRunner.query(`
      SELECT add_continuous_aggregate_policy('weekly_trades',
        start_offset    => INTERVAL '4 weeks',
        end_offset      => INTERVAL '1 week',
        schedule_interval => INTERVAL '12 hours'
      );
    `);

    await queryRunner.query(`
      CREATE MATERIALIZED VIEW monthly_trades 
      WITH (timescaledb.continuous) AS
      SELECT
        time_bucket('4 weeks', bucket) as bucket,
        asset_name,
        token_name,
        first(open, bucket) as open,
        last(close, bucket) as close,
        min(low) as low,
        max(high) as high,
        SUM(volume) as volume,
        SUM(sum_price) as sum_price,
        SUM(sum_price_volume) as sum_price_volume,
        SUM(trade_count) as trade_count
      FROM weekly_trades
      GROUP BY 1, 2, 3
      WITH NO DATA
    `);
    await queryRunner.query(`
      SELECT add_continuous_aggregate_policy('monthly_trades',
        start_offset    => INTERVAL '16 weeks',
        end_offset      => INTERVAL '4 weeks',
        schedule_interval => INTERVAL '1 day'
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP MATERIALIZED VIEW IF EXISTS "monthly_trades"`,
    );
    await queryRunner.query(`DROP MATERIALIZED VIEW IF EXISTS "weekly_trades"`);
    await queryRunner.query(`DROP MATERIALIZED VIEW IF EXISTS "daily_trades"`);
    await queryRunner.query(`DROP MATERIALIZED VIEW IF EXISTS "hourly_trades"`);
  }
}
