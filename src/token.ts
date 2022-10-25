import fetch from "cross-fetch";
import { Cluster, clusterApiUrl, Connection, PublicKey } from "@solana/web3.js";
import { getMint } from "@solana/spl-token";
import { TokenListProvider, TokenInfo, Strategy } from "@solana/spl-token-registry";
import { Metadata, PROGRAM_ID as METADATA_PROGRAM_ID } from "@metaplex-foundation/mpl-token-metadata";

const CHAIN_ID_MAP = {
  "mainnet-beta": 101,
  testnet: 102,
  devnet: 103,
};

export class Token {
  private readonly _connection: Connection;
  private readonly _cluster: Cluster;
  private readonly _mint: PublicKey;
  private _decimals: number;
  private _tokenInfo: TokenInfo;

  constructor({
    connection,
    cluster = "mainnet-beta",
    mint,
    decimals = 6,
  }: {
    connection?: Connection;
    cluster?: Cluster;
    mint: PublicKey;
    decimals?: number;
  }) {
    this._connection = connection || new Connection(clusterApiUrl(cluster));
    this._cluster = cluster;
    this._mint = mint;
    this._decimals = decimals;

    this._tokenInfo = {
      chainId: this.chainId,
      address: this._mint.toBase58(),
      name: this.rawName,
      decimals: this._decimals,
      symbol: this.rawSymbol,
    };
  }

  get address(): PublicKey {
    return this._mint;
  }

  get metadataAddress(): PublicKey {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("metadata"), METADATA_PROGRAM_ID.toBuffer(), this.address.toBuffer()],
      METADATA_PROGRAM_ID
    )[0];
  }

  get chainId(): number {
    return CHAIN_ID_MAP[this._cluster];
  }

  get decimals(): number {
    return this._decimals;
  }

  get rawName(): string {
    return `Token ${this.rawSymbol}`;
  }

  get rawSymbol(): string {
    return this.address.toBase58().substring(0, 6);
  }

  get tokenInfo(): TokenInfo {
    return this._tokenInfo;
  }

  setTokenInfo(tokenInfo: TokenInfo) {
    this._tokenInfo = tokenInfo;
    this._decimals = tokenInfo.decimals;
  }

  async loadTokenInfo(): Promise<TokenInfo> {
    return new Promise((resolve, reject) => {
      getMint(this._connection, this.address)
        .then((mintInfo) => {
          this.setTokenInfo({ ...this.tokenInfo, decimals: mintInfo.decimals });

          new TokenListProvider()
            .resolve(Strategy.Static)
            .then((tokens) => {
              // fetch token details from SPL token registry
              const legacyTokenInfo = tokens
                .filterByClusterSlug(this._cluster)
                .getList()
                .find((tokenInfo) => tokenInfo.address === this.address.toBase58());
              this.setTokenInfo({ ...this.tokenInfo, ...legacyTokenInfo });

              // fetch token details from onchain metadata
              Metadata.fromAccountAddress(this._connection, this.metadataAddress)
                .then(({ data }) => {
                  this.setTokenInfo({ ...this.tokenInfo, name: data.name, symbol: data.symbol });

                  // fetch logoURI from offchain metadata
                  fetch(data.uri)
                    .then((response) => response.json())
                    .then(({ image }: { image?: string }) => {
                      this.setTokenInfo({ ...this.tokenInfo, logoURI: image || this._tokenInfo.logoURI });
                      return resolve(this.tokenInfo);
                    })
                    .catch(() => resolve(this.tokenInfo));
                })
                .catch(() => resolve(this.tokenInfo));
            })
            .catch(() => resolve(this.tokenInfo));
        })
        .catch(reject);
    });
  }
}
