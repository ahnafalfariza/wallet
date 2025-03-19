import { Network, SignedMessage } from "@near-wallet-selector/core";
import type { JsonRpcProvider } from "near-api-js/lib/providers";
import { createBitteWalletConnector } from "./bitte-wallet";

// Types
interface WalletMessage {
  status: "success" | "failure" | "pending";
  transactionHashes?: string;
  error?: string;
  [key: string]: unknown;
  signedRequest?: SignedMessage;
  errorMessage?: string;
  errorCode?: string;
}

interface FunctionCallKey {
  privateKey: string;
  contractId: string;
  methods: Array<string>;
}

interface WalletResponseData extends WalletMessage {
  public_key?: string;
  account_id: string;
}

interface WalletState {
  signedAccountId: string;
  functionCallKey: FunctionCallKey | null;
}

interface WalletConfig {
  walletUrl: string;
  network: Network;
  provider: JsonRpcProvider;
}

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

export type {
  WalletConfig,
  WalletState,
  WalletResponseData,
  WalletMessage,
  BitteWalletState,
  BitteWalletExtraOptions,
};
