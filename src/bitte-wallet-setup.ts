import type {
  WalletModuleFactory,
  WalletBehaviourFactory,
  Transaction,
  Network,
  Account,
  InjectedWallet,
} from "@near-wallet-selector/core";
import { icon } from "./icon";
import { createBitteWalletConnector } from "./bitte-wallet";

export interface BitteWalletParams {
  walletUrl?: string;
  iconUrl?: string;
  deprecated?: boolean;
  successUrl?: string;
  failureUrl?: string;
}

interface BitteWalletState {
  wallet: ReturnType<typeof createBitteWalletConnector>;
}

interface BitteWalletExtraOptions {
  walletUrl: string;
}

const resolveWalletUrl = (network: Network, walletUrl?: string) => {
  if (walletUrl) {
    return walletUrl;
  }

  switch (network.networkId) {
    case "mainnet":
      return "https://wallet.bitte.ai";
    case "testnet":
      return "https://testnet.wallet.bitte.ai";
    default:
      throw new Error("Invalid wallet url");
  }
};

const setupWalletState = async (
  params: BitteWalletExtraOptions,
  network: Network
): Promise<BitteWalletState> => {
  // Use the factory function instead of the class constructor
  const wallet = createBitteWalletConnector(params.walletUrl, network);

  return {
    wallet,
  };
};

const BitteWallet: WalletBehaviourFactory<
  InjectedWallet,
  { params: BitteWalletExtraOptions }
> = async ({ metadata, options, store, params, logger }) => {
  const state = await setupWalletState(params, options.network);

  const getAccounts = async (): Promise<Array<Account>> => {
    const accountId = state.wallet.getAccountId();
    const publicKey = state.wallet.getPublicKey();

    return [
      {
        accountId,
        publicKey: publicKey ? publicKey.toString() : "",
      },
    ];
  };

  return {
    async signIn({ contractId, methodNames }) {
      if (!state.wallet.isSignedIn()) {
        await state.wallet.requestSignIn({
          contractId,
          methodNames,
        });
      }

      return getAccounts();
    },

    async signOut() {
      state.wallet.signOut();
    },

    async getAccounts() {
      return getAccounts();
    },

    async verifyOwner() {
      throw new Error(`Method not supported by ${metadata.name}`);
    },

    async signMessage({
      message,
      nonce,
      recipient,
      callbackUrl,
      state: sgnState,
    }) {
      logger.log("sign message", { message });

      return await state.wallet.signMessage({
        message,
        nonce,
        recipient,
        callbackUrl,
        state: sgnState,
      });
    },

    async signAndSendTransaction({ signerId, receiverId, actions }) {
      logger.log("signAndSendTransaction", {
        signerId,
        receiverId,
        actions,
      });

      const { contract } = store.getState();

      if (!state.wallet.isSignedIn() || !contract) {
        throw new Error("Wallet not signed in");
      }

      const signedAccountId = state.wallet.getAccountId();

      if (signerId && signedAccountId !== signerId) {
        throw new Error(
          `Signed in as ${signedAccountId}, cannot sign for ${signerId}`
        );
      }

      console.log(actions, 'actions')

      return state.wallet.signAndSendTransaction({
        receiverId: receiverId || contract.contractId,
        actions,
      });
    },

    async signAndSendTransactions({ transactions }) {
      logger.log("signAndSendTransactions", { transactions });

      if (!state.wallet.isSignedIn()) {
        throw new Error("Wallet not signed in");
      }

      console.log(transactions, 'transactions')

      return state.wallet.signAndSendTransactions(
        transactions as Array<Transaction>
      );
    },

    buildImportAccountsUrl() {
      return `${params.walletUrl}/batch-import`;
    },
  };
};

export function setupBitteWallet({
  walletUrl,
  iconUrl = icon,
  deprecated = false,
}: BitteWalletParams = {}): WalletModuleFactory<InjectedWallet> {
  return async (moduleOptions) => {
    return {
      id: "bitte-wallet",
      type: "injected",
      metadata: {
        name: "Bitte Wallet",
        description:
          "NEAR wallet to store, buy, send and stake assets for DeFi.",
        iconUrl,
        deprecated,
        available: true,
        downloadUrl: resolveWalletUrl(moduleOptions.options.network, walletUrl),
      },
      init: (options) => {
        return BitteWallet({
          ...options,
          params: {
            walletUrl: resolveWalletUrl(options.options.network, walletUrl),
          },
        });
      },
    };
  };
}