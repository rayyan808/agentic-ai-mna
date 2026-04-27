import { MigrationInterface, QueryRunner } from "typeorm";

export class Initial1777303369548 implements MigrationInterface {
    name = 'Initial1777303369548'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "token" ("name" character varying NOT NULL, "decimals" integer NOT NULL, CONSTRAINT "PK_dc9680c2bbb75483a58b9c4fc50" PRIMARY KEY ("name"))`);
        await queryRunner.query(`CREATE TABLE "asset" ("asset_name" character varying NOT NULL, "token_name" character varying NOT NULL, "ema" double precision NOT NULL, "emaUpdatedAt" TIMESTAMP NOT NULL, CONSTRAINT "PK_a7217e61624f855f800b1d8ae88" PRIMARY KEY ("asset_name", "token_name"))`);
        await queryRunner.query(`CREATE TYPE "public"."listener_config_state_enum" AS ENUM('0', '1', '2')`);
        await queryRunner.query(`CREATE TABLE "listener_config" ("version" integer NOT NULL, "lastProcessedRow" integer NOT NULL, "state" "public"."listener_config_state_enum" NOT NULL DEFAULT '0', CONSTRAINT "PK_fd4bd13ebbbbf3b9146c5aadf4e" PRIMARY KEY ("version"))`);
        await queryRunner.query(`CREATE TABLE "finance_config" ("version" integer NOT NULL, "latestTimestamp" TIMESTAMP NOT NULL, CONSTRAINT "PK_20bab309ab0aed2085a729f4a75" PRIMARY KEY ("version"))`);
        await queryRunner.query(`CREATE TABLE "sale_record" ("id" SERIAL NOT NULL, "timestamp" TIMESTAMP WITH TIME ZONE NOT NULL, "asset_name" character varying NOT NULL, "price" integer NOT NULL, "units" integer NOT NULL, "token_name" character varying NOT NULL, CONSTRAINT "PK_f47c06cd2bb69f20ba482edc184" PRIMARY KEY ("id", "timestamp"))`);
        await queryRunner.query(`CREATE INDEX "IDX_c11b8d262f1654ba4a35a83516" ON "sale_record" ("asset_name", "token_name") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_c11b8d262f1654ba4a35a83516"`);
        await queryRunner.query(`DROP TABLE "sale_record"`);
        await queryRunner.query(`DROP TABLE "finance_config"`);
        await queryRunner.query(`DROP TABLE "listener_config"`);
        await queryRunner.query(`DROP TYPE "public"."listener_config_state_enum"`);
        await queryRunner.query(`DROP TABLE "asset"`);
        await queryRunner.query(`DROP TABLE "token"`);
    }

}
