import "reflect-metadata";
import "dotenv/config";
import "@timescaledb/typeorm";
import { DataSource } from "typeorm";
import { Token } from "./token/token.entity";
import { Asset } from "./assets/entities/asset.entity";
import { ListenerConfig } from "./listener/entities/listener.entity";
import { FinanceConfig } from "./finance/finance.entity";
import { SaleRecord } from "./sale_record/sale.entity";

export const AppDataSource = new DataSource({
  type: "postgres",
  host: "127.", //only allow migrations within the system, dont wanna migrate a remote db accidentally
  port: parseInt(process.env.DB_PORT) ?? 5432,
  username: String(process.env.DB_USERNAME),
  password: String(process.env.DB_PASSWORD),
  database: String(process.env.DB_NAME),
  synchronize: false,
  logging: true,
  entities: [Token, Asset, SaleRecord, ListenerConfig, FinanceConfig],
  migrations: ["migrations/*.ts"],
});
