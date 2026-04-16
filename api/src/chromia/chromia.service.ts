import { IClient, RawGtv, SignatureProvider } from "postchain-client";
export class ChromiaService {
  async callOperation(
    client: IClient,
    signatureProvider: SignatureProvider,
    opName: string,
    args: RawGtv[],
  ): Promise<string> {
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
      return "Executed";
    } catch (e) {
      console.log(`Error ${e}`);
      return `${e}`;
    }
  }
  async get_ft4_inventory(
    client: IClient,
    accountID: string,
  ): Promise<player_asset_info[]> {
    const result = await client.query<player_asset_info[]>(GET_FT4_INVENTORY, {
      account_id: this.stringToBuffer(accountID),
    });
    return result;
  }
  async get_all_shop_listings(client: IClient): Promise<shop_listing[]> {
    const result = await client.query<shop_listing[]>(GET_ALL_SHOP_LISTINGS);
    return result;
  }
  stringToBuffer(str: string): Buffer {
    return Buffer.from(str, "hex");
  }
  hexToByteArray(address: string): Buffer {
    const cleanedAddress = address.replace(/^0x/i, "");
    return Buffer.from(cleanedAddress.toLowerCase(), "hex");
  }
}
