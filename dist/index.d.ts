import { WalletModuleFactory, BrowserWallet } from '@near-wallet-selector/core';

interface BitteWalletSetup {
    callbackUrl?: string;
    successUrl?: string;
    walletUrl?: string;
    failureUrl?: string;
    deprecated?: boolean;
    contractId?: string;
    lak?: boolean;
}
declare function setupBitteWallet({ walletUrl, deprecated, successUrl, failureUrl, callbackUrl, contractId, }?: BitteWalletSetup): WalletModuleFactory<BrowserWallet>;

export { setupBitteWallet };
