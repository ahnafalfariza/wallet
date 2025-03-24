import { WalletModuleFactory, InjectedWallet } from '@near-wallet-selector/core';

interface BitteWalletParams {
    walletUrl?: string;
    iconUrl?: string;
    deprecated?: boolean;
    successUrl?: string;
    failureUrl?: string;
}

declare function setupBitteWallet({ walletUrl, iconUrl, deprecated, }?: BitteWalletParams): WalletModuleFactory<InjectedWallet>;

export { setupBitteWallet };
