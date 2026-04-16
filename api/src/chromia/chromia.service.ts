import {
  IClient,
  RawGtv,
  ResponseStatus,
  SignatureProvider,
} from "postchain-client";
import { ops, queries, TX_STATUS } from "./chromia.constants";
import {
  crafting_station,
  player_asset_info,
  shop_listing,
} from "./chromia.dtos";
import { Injectable } from "@nestjs/common";
import { Session } from "@chromia/ft4";

@Injectable()
export class ChromiaService {
  async callOperation(
    session: Session,
    opName: string,
    args: RawGtv[],
  ): Promise<TX_STATUS> {
    console.log(`Calling op ${opName}..`);
    try {
      const txReceipt = await session.call({
        name: opName,
        args: args,
      });
      const x = txReceipt.receipt.status;
      console.log(`TX got receipt status: ${x.toString()}`);
      console.log(`TX RID: ${txReceipt.receipt.transactionRid}`);
      if (x == ResponseStatus.Rejected) throw "TX Rejected";
      return TX_STATUS.SUCCESS;
    } catch (e) {
      console.log(`Error ${e}`);
      return TX_STATUS.FAILED;
    }
  }
  async does_player_own_item(session: Session, asset_name: string) {
    const result = await session.query<boolean>(queries.DOES_PLAYER_OWN_ITEM, {
      account_id: session.account.id,
      asset_name,
    });
    return result;
  }
  async get_account_id(client: IClient, evm_address: string): Promise<string> {
    const bufferAccountId = await client.query<Buffer>(queries.GET_ACCOUNT_ID, {
      evm_address: this.hexToByteArray(evm_address),
    });
    return this.bufferToString(bufferAccountId);
  }
  async get_ft4_inventory(session: Session): Promise<player_asset_info[]> {
    console.log(`Getting FT4 inventory for ${session.account.id}`);
    try {
      const result = await session.query<player_asset_info[]>(
        queries.GET_FT4_INVENTORY,
        {
          account_id: session.account.id,
        },
      );
      console.log(
        JSON.stringify(result, (_, v) =>
          typeof v === "bigint" ? v.toString() : v,
        ),
      );
      return result;
    } catch (e) {
      console.log(e);
      return [];
    }
  }
  async get_all_shop_listings(session: Session): Promise<shop_listing[]> {
    console.log(`Getting all shop listings..`);
    const result = await session.query<shop_listing[]>(
      queries.GET_ALL_SHOP_LISTINGS,
    );
    return result;
  }
  async get_stations(session: Session): Promise<crafting_station[]> {
    console.log(
      `Getting crafting stations for ${this.bufferToString(session.account.id)}`,
    );
    const result = await session.query<crafting_station[]>(
      queries.GET_CRAFTING_STATIONS,
      {
        account_id: session.account.id,
      },
    );
    return result;
  }
  stringToBuffer(str: string): Buffer {
    return Buffer.from(str, "hex");
  }
  bufferToString(buf: Buffer): string {
    return buf.toString("hex");
  }
  hexToByteArray(address: string): Buffer {
    const cleanedAddress = address.replace(/^0x/i, "");
    return Buffer.from(cleanedAddress.toLowerCase(), "hex");
  }
  /*
  async getAuthDescriptor(
    client: IClient,
    accountId: string,
    evmAddress: string,
  ): Promise<string> {
    try {
      console.log(
        `Querying auth descriptor for ${accountId} and ${evmAddress}`,
      );
      const result = await client.query(system_queries.GET_AUTH_DESCRIPTOR, {
        account_id: this.stringToBuffer(accountId),
        evm_address: this.hexToByteArray(evmAddress),
      });

      const stringed = this.bufferToString(result[0].id);
      console.log(`Got auth descriptior id: ${stringed}`);
      return stringed;
    } catch (e) {
      console.log(e);
      return ""; //fix later
    }
  }*/
}
