import {
  createClient,
  IClient,
  RawGtv,
  ResponseStatus,
} from "postchain-client";
import { queries, TransactionResult, TX_STATUS } from "./chromia.constants";
import {
  crafting_station,
  paginated_sale_records,
  asset_list,
  shop_listing,
} from "./chromia.dtos";
import { Injectable, Scope } from "@nestjs/common";
import {
  createInMemoryEvmKeyStore,
  createInMemoryFtKeyStore,
  createKeyStoreInteractor,
  Session,
} from "@chromia/ft4";
import { encryption } from "postchain-client";

@Injectable({ scope: Scope.TRANSIENT })
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
    const keyPair = encryption.makeKeyPair(privateKey);
    const ftKeyStore = createInMemoryFtKeyStore(keyPair);
    const interactor = createKeyStoreInteractor(_client, ftKeyStore);
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
  async get_player_assets(session: Session): Promise<asset_list> {
    console.log(`Getting asset list for: ${session.account.id}`);
    try {
      const result = await session.query<asset_list>(
        queries.GET_PLAYER_ASSETS,
        {
          account_id: session.account.id,
        },
      );
      return result;
    } catch (e) {
      console.log(e); //@TODO: handle error better
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
  async get_sale_records(
    cursor: number,
    page_size: number,
  ): Promise<paginated_sale_records> {
    const client = await this.getChromiaClient();
    const result = await client.query<paginated_sale_records>(
      queries.GET_SALE_RECORDS,
      {
        cursor: [page_size, cursor],
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
