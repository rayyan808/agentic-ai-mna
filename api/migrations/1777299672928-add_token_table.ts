import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTokenTable1777299672928 implements MigrationInterface {
    name = 'AddTokenTable1777299672928'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."sale_record_timestamp_idx"`);
        await queryRunner.query(`CREATE TABLE "token" ("name" character varying NOT NULL, "decimals" integer NOT NULL, CONSTRAINT "PK_dc9680c2bbb75483a58b9c4fc50" PRIMARY KEY ("name"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "token"`);
        await queryRunner.query(`CREATE INDEX "sale_record_timestamp_idx" ON "sale_record" ("timestamp") `);
    }

}
