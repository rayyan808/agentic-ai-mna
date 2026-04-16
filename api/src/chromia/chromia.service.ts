import { IClient, RawGtv, SignatureProvider } from "postchain-client";
import { ops, queries, TX_STATUS } from "./chromia.constants";
import {
  crafting_station,
  player_asset_info,
  shop_listing,
} from "./chromia.dtos";
import { Injectable } from "@nestjs/common";

@Injectable()
export class ChromiaService {
  async callOperation(
    client: IClient,
    signatureProvider: SignatureProvider,
    opName: string,
    args: RawGtv[],
  ): Promise<TX_STATUS> {
    try {
      await client.signAndSendUniqueTransaction(
        {
          operations: [
            {
              name: opName,
              args: args,
            },
          ],
          signers: [signatureProvider.pubKey],
        },
        signatureProvider,
      );
      return TX_STATUS.SUCCESS;
    } catch (e) {
      console.log(`Error ${e}`);
      return TX_STATUS.FAILED;
    }
  }
  async get_account_id(client: IClient, evm_address: string): Promise<string> {
    const bufferAccountId = await client.query<Buffer>(queries.GET_ACCOUNT_ID, {
      evm_address: this.hexToByteArray(evm_address),
    });
    return this.bufferToString(bufferAccountId);
  }
  async get_ft4_inventory(
    client: IClient,
    accountID: string,
  ): Promise<player_asset_info[]> {
    console.log(`Getting FT4 inventory for ${accountID}`);
    try {
      const result = await client.query<player_asset_info[]>(
        queries.GET_FT4_INVENTORY,
        {
          account_id: accountID,
        },
      );
      return result;
    } catch (e) {
      console.log(e);
      return [];
    }
  }
  async get_all_shop_listings(client: IClient): Promise<shop_listing[]> {
    console.log(`Getting all shop listings..`);
    const result = await client.query<shop_listing[]>(
      queries.GET_ALL_SHOP_LISTINGS,
    );
    return result;
  }
  async get_stations(
    client: IClient,
    accountId: string,
  ): Promise<crafting_station[]> {
    console.log(`Getting crafting stations for ${accountId}`);
    const result = await client.query<crafting_station[]>(
      queries.GET_CRAFTING_STATIONS,
      {
        account_id: this.stringToBuffer(accountId),
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
}
