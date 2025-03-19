# @bitte-ai/wallet

This is the [Bitte Wallet](https://wallet.bitte.ai) SDK package.

check our [React integration](https://github.com/BitteProtocol/react/blob/main/README.md)


<p  align="center">

<img  src='https://img.shields.io/npm/dw/@bitte-ai/wallet'  />

<img  src='https://img.shields.io/bundlephobia/min/@bitte-ai/wallet'>

</p>


## Installation and Usage

The easiest way to use this package is to install it from the NPM registry,


```bash
# Using Yarn
yarn add @bitte-ai/wallet

# Using NPM.
npm install  @bitte-ai/wallet

# Using PNPM.
pnpm  install  @bitte-ai/wallet
```


Then use it in your dApp:

```ts

import { setupWalletSelector } from "@near-wallet-selector/core";

import { setupBitteWallet } from "@bitte-ai/wallet";

const wallet = setupBitteWallet({
	network:  'mainnet',
});

const  selector = await  setupWalletSelector({
	network:  "mainnet",
	modules: [wallet],
});

```


## setupBitteWallet

  -  `network:` Near Networks

-  `walletUrl:` valid wallet urls


## Troubleshooting

**Client-side only:**

The wallet runs only on client-side.

Any other questions or issues you can contact support on our [Telegram Channel](https://telegram.me/mintdev).


## License

This repository is distributed under the terms of both the MIT license and the Apache License (Version 2.0).