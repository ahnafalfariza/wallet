import {
  internalActionToNaj,
  type Action,
  type FinalExecutionOutcome,
  type Network,
  type SignMessageParams,
  type Transaction,
} from "@near-wallet-selector/core";
import { connect, keyStores, providers } from "near-api-js";
import type { PublicKey } from "near-api-js/lib/utils/index.js";
import { KeyPair } from "near-api-js/lib/utils/index.js";
import { WalletConfig, WalletMessage, WalletResponseData, WalletState } from "./types";


// Constants
const DEFAULT_POPUP_WIDTH = 480;
const DEFAULT_POPUP_HEIGHT = 640;
const POLL_INTERVAL = 300;


// State management
const getInitialState = (): WalletState => ({
  signedAccountId: localStorage.getItem("bitte:signedAccountId") || "",
  functionCallKey: JSON.parse(localStorage.getItem("bitte:functionCallKey") || "null"),
});

const saveState = (state: WalletState): void => {
  localStorage.setItem("bitte:signedAccountId", state.signedAccountId);
  localStorage.setItem("bitte:functionCallKey", JSON.stringify(state.functionCallKey));
};

// Create wallet configuration
const createWalletConfig = (walletUrl: string, network: Network): WalletConfig => ({
  walletUrl,
  network,
  provider: new providers.JsonRpcProvider({ url: network.nodeUrl }),
});

// Core functions
const getAccountId = (state: WalletState): string => {
  return state.signedAccountId;
};

const getPublicKey = (state: WalletState): PublicKey | undefined => {
  if (state.functionCallKey) {
    return KeyPair.fromString(state.functionCallKey.privateKey as any).getPublicKey();
  }
  return undefined;
};

const isSignedIn = (state: WalletState): boolean => {
  return !!state.signedAccountId;
};

const signOut = (): WalletState => {
  const newState = {
    signedAccountId: "",
    functionCallKey: null,
  };
  saveState(newState);
  return newState;
};

const requestSignInUrl = (
  config: WalletConfig,
  { contractId, methodNames }: { contractId: string; methodNames?: Array<string> }
): { url: string; newState: WalletState } => {
  const currentUrl = new URL(window.location.href);
  const newUrl = new URL(`${config.walletUrl}/login/`);

  newUrl.searchParams.set("success_url", currentUrl.href);
  newUrl.searchParams.set("failure_url", currentUrl.href);

  let functionCallKey = null;

  if (contractId) {
    newUrl.searchParams.set("contract_id", contractId);

    const accessKey = KeyPair.fromRandom("ed25519");
    newUrl.searchParams.set(
      "public_key",
      accessKey.getPublicKey().toString()
    );

    functionCallKey = {
      privateKey: accessKey.toString(),
      contractId,
      methods: methodNames || [],
    };
  }

  if (methodNames) {
    methodNames.forEach((methodName) => {
      newUrl.searchParams.append("methodNames", methodName);
    });
  }

  const newState = getInitialState();
  newState.functionCallKey = functionCallKey;
  saveState(newState);

  return { url: newUrl.toString(), newState };
};

const requestSignIn = async (
  config: WalletConfig,
  state: WalletState,
  { contractId, methodNames }: { contractId: string; methodNames?: Array<string> }
): Promise<Array<{ accountId: string; publicKey: string }>> => {
  const { url, newState } = requestSignInUrl(config, { contractId, methodNames });

  return handlePopupTransaction(config, url, async (data) => {
    const responseData = data as WalletResponseData;
    const { public_key: publicKey, account_id: accountId } = responseData;

    if (accountId) {
      const updatedState = { ...newState, signedAccountId: accountId };
      saveState(updatedState);
      return [{ accountId, publicKey: publicKey || "" }];
    }
    throw new Error("Invalid response data from wallet");
  });
};

const signMessage = async (
  config: WalletConfig,
  { message, nonce, recipient, callbackUrl, state: messageState }: SignMessageParams
) => {
  const url = callbackUrl || window.location.href;

  if (!url) {
    throw new Error(`BitteWallet: CallbackUrl is missing`);
  }

  const href = new URL(config.walletUrl);
  href.pathname = "sign-message";
  href.searchParams.append("message", message);
  href.searchParams.append("nonce", nonce.toString("base64"));
  href.searchParams.append("recipient", recipient);
  href.searchParams.append("callbackUrl", url);

  if (messageState) {
    href.searchParams.append("state", messageState);
  }

  return handlePopupTransaction(config, href.toString(), (value) => {
    return {
      accountId: value?.signedRequest?.accountId || "",
      publicKey: value?.signedRequest?.publicKey || "",
      signature: value?.signedRequest?.signature || "",
    };
  });
};

const storedKeyCanSign = (
  state: WalletState,
  receiverId: string,
  actions: Array<any>
): boolean => {
  if (
    state.functionCallKey &&
    state.functionCallKey.contractId === receiverId
  ) {
    return (
      actions[0].type === "FunctionCall" &&
      actions[0].params.deposit === "0" &&
      (state.functionCallKey.methods.length === 0 ||
        state.functionCallKey.methods.includes(actions[0].params.methodName))
    );
  }
  return false;
};

const signUsingKeyPair = async (
  config: WalletConfig,
  state: WalletState,
  { receiverId, actions }: { receiverId: string; actions: Array<Action> }
): Promise<FinalExecutionOutcome> => {
  // instantiate an account (NEAR API is a nightmare)
  const myKeyStore = new keyStores.InMemoryKeyStore();
  const keyPair = KeyPair.fromString(state.functionCallKey!.privateKey as any);

  await myKeyStore.setKey(
    config.network.networkId,
    state.signedAccountId,
    keyPair
  );

  const near = await connect({ ...config.network, keyStore: myKeyStore });
  const account = await near.account(state.signedAccountId);

  return account.signAndSendTransaction({
    receiverId,
    actions: actions.map((a) => internalActionToNaj(a as any)),
  });
};

const requestSignTransactionsUrl = (
  config: WalletConfig,
  txs: Array<Transaction>
): string => {
  const newUrl = new URL(`${config.walletUrl}/sign-transaction`);
  const stringifiedParam = JSON.stringify(txs, (_, v) => typeof v === 'bigint' ? v.toString() : v);
  const urlParam = encodeURIComponent(stringifiedParam);

  newUrl.searchParams.set('transactions_data', urlParam);
  newUrl.searchParams.set('callback_url', window.location.origin);

  return newUrl.toString();
};

const signAndSendTransactionsPopUp = async (
  config: WalletConfig,
  txs: Array<Transaction>
): Promise<Array<FinalExecutionOutcome>> => {
  const url = requestSignTransactionsUrl(config, txs);
  const txsHashes = (
    await handlePopupTransaction(config, url, (data) => data.transactionHashes)
  )?.split("%2C");

  if (!txsHashes) {
    throw new Error("No transaction hashes received");
  }
  return Promise.all(
    txsHashes.map((hash) => config.provider.txStatus(hash, "unused"))
  );
};



const signAndSendTransaction = async (
  config: WalletConfig,
  state: WalletState,
  { receiverId, actions }: { receiverId: string; actions: Array<Action> }
): Promise<FinalExecutionOutcome> => {
  if (actions.length === 1 && storedKeyCanSign(state, receiverId, actions)) {
    try {
      return await signUsingKeyPair(config, state, { receiverId, actions });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn(
        "Failed to sign using key pair, falling back to wallet",
        error
      );
    }
  }

  const results = await signAndSendTransactionsPopUp(config, [{ signerId: state.signedAccountId, receiverId, actions }]);
  return results[0];
};

const signAndSendTransactions = async (
  config: WalletConfig,
  state: WalletState,
  transactionsWS: Array<Transaction>
): Promise<Array<FinalExecutionOutcome>> => {

  return signAndSendTransactionsPopUp(config, transactionsWS);
};

// Helper functions
const setupMessageHandler = <T>(
  config: WalletConfig,
  resolve: (value: T) => void,
  reject: (reason?: unknown) => void,
  childWindow: Window | null,
  callback: (result: WalletMessage) => T
): (event: MessageEvent) => Promise<void> => {
  const handler = async (event: MessageEvent) => {
    const message = event.data as WalletMessage;

    // check if the URL are the same
    const origin = new URL(event.origin);
    const walletBaseUrl = new URL(config.walletUrl);

    if (origin.origin !== walletBaseUrl.origin) {
      // eslint-disable-next-line no-console
      console.warn("Ignoring message from different origin", origin.origin);
      return;
    }

    switch (message.status) {
      case "success":
        childWindow?.close();
        resolve(callback(message));
        break;
      case "failure":
        childWindow?.close();
        reject(new Error(message.errorMessage || "Transaction failed"));
        break;
      default:
        // eslint-disable-next-line no-console
        console.warn("Unhandled message status:", message.status);
    }
  };

  return handler;
};

const handlePopupTransaction = <T>(
  config: WalletConfig,
  url: string,
  callback: (result: WalletMessage) => T
): Promise<T> => {
  const screenWidth = window.innerWidth || screen.width;
  const screenHeight = window.innerHeight || screen.height;
  const left = (screenWidth - DEFAULT_POPUP_WIDTH) / 2;
  const top = (screenHeight - DEFAULT_POPUP_HEIGHT) / 2;

  const childWindow = window.open(
    url,
    "BitteWallet",
    `width=${DEFAULT_POPUP_WIDTH},height=${DEFAULT_POPUP_HEIGHT},top=${top},left=${left}`
  );

  if (!childWindow) {
    throw new Error(
      "Popup window blocked. Please allow popups for this site."
    );
  }

  return new Promise<T>((resolve, reject) => {
    const messageHandler = setupMessageHandler(
      config,
      resolve,
      reject,
      childWindow,
      callback
    );

    window.addEventListener("message", messageHandler);

    const intervalId = setInterval(() => {
      if (childWindow.closed) {
        window.removeEventListener("message", messageHandler);
        clearInterval(intervalId);
        reject(new Error("User closed the window"));
      }
    }, POLL_INTERVAL);
  });
};


export const createBitteWalletConnector = (walletUrl: string, network: Network) => {
  const config = createWalletConfig(walletUrl, network);

  // Transform from previous wallet version
  const walletAuthKey = localStorage.getItem("mintbase-wallet_wallet_auth_key");
  if (walletAuthKey) {
    const { accountId } = JSON.parse(walletAuthKey) || {};
    localStorage.setItem("bitte:signedAccountId", accountId);
    localStorage.removeItem("mintbase-wallet_wallet_auth_key");
  }

  let state = getInitialState();

  return {
    getAccountId: () => getAccountId(state),
    getPublicKey: () => getPublicKey(state),
    isSignedIn: () => isSignedIn(state),
    signOut: () => {
      state = signOut();
      return null;
    },
    requestSignIn: async (params: { contractId: string; methodNames?: Array<string> }) => {
      const result = await requestSignIn(config, state, params);
      // Update state after sign-in
      state = getInitialState();
      return result;
    },
    requestSignInUrl: (params: { contractId: string; methodNames?: Array<string> }) => {
      const { url, newState } = requestSignInUrl(config, params);
      state = newState;
      return url;
    },
    signMessage: (params: SignMessageParams) => signMessage(config, params),
    signAndSendTransaction: (params: { receiverId: string; actions: Array<Action> }) =>
      signAndSendTransaction(config, state, params),
    signAndSendTransactions: (transactions: Array<Transaction>) =>
      signAndSendTransactions(config, state, transactions),
  };
};