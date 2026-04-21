import {
  createClient,
  IClient,
  RawGtv,
  ResponseStatus,
} from "postchain-client";
import { queries, TransactionResult, TX_STATUS } from "./chromia.constants";
import {
  crafting_station,
  player_asset_info,
  shop_listing,
} from "./chromia.dtos";
import { Injectable } from "@nestjs/common";
import {
  createInMemoryEvmKeyStore,
  createKeyStoreInteractor,
  Session,
} from "@chromia/ft4";
import { makeKeyPair } from "node_modules/postchain-client/built/src/encryption/encryption";

@Injectable()
export class ChromiaService {
  client: IClient | null;

  private async getChromiaClient() {
    if (this.client) return this.client;
    const nodeUrl = process.env.CHROMIA_NODE_URL;
    const brid = process.env.CHROMIA_BRID;
    if (!nodeUrl || !brid) {
      throw new Error("Set CHROMIA_NODE_URL and CHROMIA_BRID in api/.env");
    }
    this.client = await createClient({
      nodeUrlPool: [nodeUrl],
      blockchainRid: brid,
    });
    return this.client;
  }
  async createSession(privateKey: string): Promise<Session> {
    const _client = await this.getChromiaClient();
    //Keep da private key out of the model
    const keyPair = makeKeyPair(privateKey);
    const evmKeyStore = createInMemoryEvmKeyStore(keyPair);
    const interactor = createKeyStoreInteractor(_client, evmKeyStore);
    const accounts = await interactor.getAccounts();
    const account = accounts[0];
    const session = await interactor.getSession(account.id);
    return session;
  }

  async callOperation(
    session: Session,
    opName: string,
    args: RawGtv[],
  ): Promise<TransactionResult> {
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
      return {
        status: TX_STATUS.SUCCESS,
        data: this.bufferToString(txReceipt.receipt.transactionRid),
      };
    } catch (e) {
      console.log(`Error ${e}`);
      return {
        status: TX_STATUS.FAILED,
        data: e.toString(),
      };
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
  async get_ft4_inventory(
    session: Session,
  ): Promise<{ amount: string; name: string }[]> {
    console.log(`Getting FT4 inventory for ${session.account.id}`);
    try {
      const result = await session.query<player_asset_info[]>(
        queries.GET_FT4_INVENTORY,
        {
          account_id: session.account.id,
        },
      );

      return result.map((v) => {
        return {
          name: v.name,
          amount: v.amount.toString(),
        };
      });
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
