"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var __async = (__this, __arguments, generator) => {
  return new Promise((resolve, reject) => {
    var fulfilled = (value) => {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    };
    var rejected = (value) => {
      try {
        step(generator.throw(value));
      } catch (e) {
        reject(e);
      }
    };
    var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
    step((generator = generator.apply(__this, __arguments)).next());
  });
};

// src/index.ts
var index_exports = {};
__export(index_exports, {
  setupBitteWallet: () => setupBitteWallet
});
module.exports = __toCommonJS(index_exports);

// src/bitte-wallet.ts
var nearAPI = __toESM(require("near-api-js"));

// src/utils.ts
var checkCallbackUrl = (callbackUrl) => {
  function isValidURL(url) {
    const urlPattern = /^(https?|ftp|http?):\/\/[^\s/$.?#].[^\s]*$/;
    return urlPattern.test(url);
  }
  if (callbackUrl !== null && callbackUrl.length > 0) {
    if (isValidURL(callbackUrl)) {
      if (callbackUrl.startsWith("https://") || callbackUrl.startsWith("http://")) {
        return callbackUrl.endsWith("/") ? callbackUrl.slice(0, -1) : callbackUrl;
      }
    } else {
      console.error(
        "callbackUrl set with wrong format. please use an URL with http:// or https:// instead.Further help available on our telegram channel: https://t.me/mintdev"
      );
      return new URL(window.location.href).toString();
    }
  } else {
    const globalCallBackUrl = localStorage.getItem(
      "mintbase-wallet:callback_url"
    );
    if (isValidURL(globalCallBackUrl)) {
      return globalCallBackUrl;
    } else {
      console.warn("We recommend you to set the callbackUrl property on setupMintbaseWallet  \n read more here:  \n https://docs.mintbase.xyz/dev/mintbase-sdk-ref/wallet#setupmintbasewallet  \n  \n further help available on our telegram channel:  \n https://t.me/mintdev");
      return new URL(window.location.href).toString();
    }
  }
  return new URL(window.location.href).toString();
};
var getCallbackUrl = (callbackUrl) => {
  var _a, _b, _c, _d, _e, _f;
  if (typeof window !== void 0) {
    let mbjsCallbackUrl = "";
    if (((_b = (_a = window == null ? void 0 : window["mbjs"]) == null ? void 0 : _a.keys) == null ? void 0 : _b.callbackUrl) && ((_d = (_c = window == null ? void 0 : window["mbjs"]) == null ? void 0 : _c.keys) == null ? void 0 : _d.callbackUrl.length) > 0) {
      mbjsCallbackUrl = (_f = (_e = window == null ? void 0 : window["mbjs"]) == null ? void 0 : _e.keys) == null ? void 0 : _f.callbackUrl;
    }
    const globalCBUrl = (localStorage == null ? void 0 : localStorage.getItem("mintbase-wallet:callback_url")) || mbjsCallbackUrl;
    const finalcbURL = callbackUrl != null ? callbackUrl : globalCBUrl;
    const callBackUrlRes = checkCallbackUrl(finalcbURL);
    return { cbUrl: callBackUrlRes };
  }
  return null;
};
var resolveBitteWallet = (network, walletUrl) => {
  if (walletUrl) {
    return walletUrl;
  }
  switch (network) {
    case "mainnet":
      return "https://wallet.bitte.ai";
    case "testnet":
      return "https://testnet.wallet.bitte.ai/";
    default:
      throw new Error("Invalid wallet url");
  }
};

// src/bitte-wallet.ts
var import_wallet_utils = require("@near-wallet-selector/wallet-utils");
var BitteWallet = (_0) => __async(void 0, [_0], function* ({
  metadata,
  options,
  successUrl,
  failureUrl,
  contractId,
  callback,
  networkId
}) {
  const setupWalletState = () => __async(void 0, null, function* () {
    if (typeof window !== void 0) {
      const { connect, WalletConnection, keyStores } = nearAPI;
      const connectionConfig = {
        networkId,
        keyStore: new keyStores.BrowserLocalStorageKeyStore(),
        nodeUrl: options.network.nodeUrl,
        walletUrl: metadata.walletUrl,
        headers: {}
      };
      const searchParams = new URL(window.location.href);
      const acc = searchParams.searchParams.get("account_id");
      if (acc && !contractId) {
        localStorage.setItem(
          "mintbase-wallet_wallet_auth_key",
          JSON.stringify({
            accountId: acc,
            allKeys: []
          })
        );
      }
      const nearConnection = yield connect(connectionConfig);
      const wallet = new WalletConnection(nearConnection, "mintbase-wallet");
      localStorage.setItem("mintbase-wallet:callback_url", callback);
      return {
        wallet
      };
    }
    return null;
  });
  const state = yield setupWalletState();
  let activeAccountId;
  const getAccountId = () => activeAccountId;
  const isSignedIn = () => __async(void 0, null, function* () {
    return !!activeAccountId;
  });
  const signIn = () => __async(void 0, null, function* () {
    var _a;
    const existingAccounts = yield getAccounts();
    const href = encodeURI((_a = window == null ? void 0 : window.location) == null ? void 0 : _a.href);
    if (existingAccounts.length) {
      return existingAccounts;
    }
    yield state.wallet.requestSignIn({
      methodNames: [],
      successUrl: successUrl || href,
      failureUrl: failureUrl || href,
      contractId
    });
    return getAccounts();
  });
  const signOut = () => __async(void 0, null, function* () {
    window.localStorage.removeItem("mintbase-wallet:account-data");
    if (state.wallet.isSignedIn()) {
      state.wallet.signOut();
    }
    return;
  });
  const assertValidSigner = (signerId) => {
    if (signerId && signerId !== state.wallet.getAccountId()) {
      throw new Error(
        `Cannot sign transactions for ${signerId} while signed in as ${activeAccountId}`
      );
    }
  };
  const signAndSendTransactions = (_02) => __async(void 0, [_02], function* ({ transactions, callbackUrl }) {
    if (!state.wallet.isSignedIn()) {
      throw new Error("Wallet not signed in");
    }
    const { cbUrl } = getCallbackUrl(callbackUrl != null ? callbackUrl : "");
    for (const { signerId } of transactions) {
      assertValidSigner(signerId);
    }
    const stringifiedParam = JSON.stringify(transactions);
    const urlParam = encodeURIComponent(stringifiedParam);
    const newUrl = new URL(`${metadata.walletUrl}/sign-transaction`);
    newUrl.searchParams.set("transactions_data", urlParam);
    newUrl.searchParams.set("callback_url", cbUrl);
    window.location.assign(newUrl.toString());
    return;
  });
  const signAndSendTransaction = (_02) => __async(void 0, [_02], function* ({
    receiverId,
    actions,
    signerId,
    callbackUrl
  }) {
    assertValidSigner(signerId);
    if (!receiverId && !contractId) {
      throw new Error("No receiver found to send the transaction to");
    }
    const { cbUrl } = getCallbackUrl(callbackUrl != null ? callbackUrl : "");
    const callback2 = cbUrl || successUrl;
    if (!contractId) {
      const newUrl = new URL(`${metadata.walletUrl}/sign-transaction`);
      const stringifiedParam = JSON.stringify([{ receiverId, signerId, actions }]);
      const urlParam = encodeURIComponent(stringifiedParam);
      newUrl.searchParams.set("transactions_data", urlParam);
      newUrl.searchParams.set("callback_url", callback2);
      window.location.assign(newUrl.toString());
    }
    const account = state.wallet.account();
    return yield account.signAndSendTransaction({
      receiverId: receiverId || contractId,
      actions: actions.map((action) => (0, import_wallet_utils.createAction)(action)),
      walletCallbackUrl: callback2
    });
  });
  const verifyOwner = () => __async(void 0, null, function* () {
    throw new Error(`The verifyOwner method is not supported by ${metadata.name}`);
  });
  const signMessage = (_02) => __async(void 0, [_02], function* ({ message, nonce, recipient, callbackUrl }) {
    const { cbUrl } = getCallbackUrl(callbackUrl != null ? callbackUrl : "");
    const newUrl = new URL(`${metadata.walletUrl}/sign-message`);
    newUrl.searchParams.set("message", message);
    newUrl.searchParams.set("nonce", Buffer.from(nonce).toString("base64"));
    newUrl.searchParams.set("recipient", recipient);
    newUrl.searchParams.set("callbackUrl", cbUrl);
    window.location.assign(newUrl.toString());
  });
  const verifyMessage = (_02) => __async(void 0, [_02], function* ({ accountId, publicKey, signature, message, nonce, recipient, callbackUrl }) {
    const newUrl = new URL(`${metadata.walletUrl}/api/verify-message`);
    newUrl.searchParams.set("message", message);
    newUrl.searchParams.set("accountId", accountId);
    newUrl.searchParams.set("publicKey", publicKey);
    newUrl.searchParams.set("signature", signature);
    newUrl.searchParams.set("nonce", Buffer.from(nonce).toString("base64"));
    newUrl.searchParams.set("recipient", recipient);
    newUrl.searchParams.set("callbackUrl", callbackUrl);
    try {
      const response = yield fetch(newUrl.toString());
      const data = yield response.json();
      const { isValid } = data;
      return isValid;
    } catch (e) {
      return false;
    }
  });
  const getAvailableBalance = () => __async(void 0, null, function* () {
    throw `The getAvailableBalance method is not supported by ${metadata.name}`;
  });
  const getAccounts = () => __async(void 0, null, function* () {
    var _a;
    const accountId = state.wallet.getAccountId();
    const account = state.wallet.account();
    if (!accountId || !account) {
      return [];
    }
    const currentAccount = window.localStorage.getItem(
      "mintbase-wallet:account-creation-data"
    );
    return [
      {
        accountId,
        publicKey: (_a = JSON.parse(currentAccount)) == null ? void 0 : _a.devicePublicKey
      }
    ];
  });
  const switchAccount = (id) => __async(void 0, null, function* () {
    setActiveAccountId(id);
    return null;
  });
  const setActiveAccountId = (accountId) => {
    activeAccountId = accountId;
    window.localStorage.setItem("mintbase-wallet:activeAccountId", accountId);
    return null;
  };
  return {
    getAccountId,
    isSignedIn,
    signIn,
    signOut,
    signAndSendTransaction,
    verifyOwner,
    signMessage,
    getAvailableBalance,
    getAccounts,
    switchAccount,
    signAndSendTransactions,
    verifyMessage
  };
});

// src/bitte-wallet-setup.ts
var icon = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iOTUiIGhlaWdodD0iOTUiIHZpZXdCb3g9IjAgMCA5NSA5NSIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik0xLjc3NjE3IDU5LjE4MjZMNjIuNzIyNyA2My4zMTNDNjMuMTE4NSA2My40MzA5IDYzLjQ3ODggNjMuNjQ1NiA2My43NzA4IDYzLjkzNzdDNjQuMDYyOSA2NC4yMjk3IDY0LjI3NzUgNjQuNTg5OSA2NC4zOTU0IDY0Ljk4NThMNjguNTI1OSA3OC44NTU1QzY4LjY3ODcgNzkuMzY4NiA2OC45OTMyIDc5LjgxODYgNjkuNDIyNCA4MC4xMzg3QzY5Ljg1MTYgODAuNDU4NyA3MC4zNzI3IDgwLjYzMTYgNzAuOTA4MiA4MC42MzE2QzcxLjQ0MzYgODAuNjMxNiA3MS45NjQ3IDgwLjQ1ODcgNzIuMzkzOSA4MC4xMzg3QzcyLjgyMzEgNzkuODE4NiA3My4xMzc2IDc5LjM2ODYgNzMuMjkwNCA3OC44NTU1TDc3LjQyMDkgNjQuOTg1OEM3Ny41Mzg4IDY0LjU4OTkgNzcuNzUzNCA2NC4yMjk3IDc4LjA0NTUgNjMuOTM3N0M3OC4zMzc2IDYzLjY0NTYgNzguNjk3OCA2My40MzA5IDc5LjA5MzYgNjMuMzEzTDkyLjk2MzMgNTkuMTgyNkM5My40NzY0IDU5LjAyOTcgOTMuOTI2NSA1OC43MTUzIDk0LjI0NjYgNTguMjg2MUM5NC41NjY2IDU3Ljg1NjggOTQuNzM5NSA1Ny4zMzU3IDk0LjczOTUgNTYuODAwM0M5NC43Mzk1IDU2LjI2NDkgOTQuNTY2NiA1NS43NDM4IDk0LjI0NjYgNTUuMzE0NkM5My45MjY1IDU0Ljg4NTMgOTMuNDc2NCA1NC41NzA5IDkyLjk2MzMgNTQuNDE4MUw3OS4wOTM3IDUwLjI4NzZDNzguNjk3OCA1MC4xNjk3IDc4LjMzNzYgNDkuOTU1IDc4LjA0NTUgNDkuNjYzQzc3Ljc1MzUgNDkuMzcwOSA3Ny41Mzg4IDQ5LjAxMDcgNzcuNDIwOSA0OC42MTQ4TDczLjI5MDQgMzQuNzQ1MkM3My4xMzc2IDM0LjIzMiA3Mi44MjMyIDMzLjc4MTkgNzIuMzkzOSAzMy40NjE5QzcxLjk2NDcgMzMuMTQxOSA3MS40NDM2IDMyLjk2OSA3MC45MDgyIDMyLjk2OUM3MC4zNzI4IDMyLjk2OSA2OS44NTE3IDMzLjE0MTkgNjkuNDIyNCAzMy40NjE5QzY4Ljk5MzIgMzMuNzgxOSA2OC42Nzg4IDM0LjIzMiA2OC41MjYgMzQuNzQ1Mkw2NC4zOTU0IDQ4LjYxNDhDNjQuMjc3NiA0OS4wMTA3IDY0LjA2MjkgNDkuMzcwOSA2My43NzA4IDQ5LjY2M0M2My40Nzg4IDQ5Ljk1NSA2My4xMTg1IDUwLjE2OTcgNjIuNzIyNyA1MC4yODc2TDEuNzc2MTggNTQuNDE4MUMxLjI2MzA1IDU0LjU3MDkgMC44MTI5NTYgNTQuODg1MyAwLjQ5MjkyIDU1LjMxNDZDMC4xNzI4ODQgNTUuNzQzOCAyLjI0NzU1ZS0wNiA1Ni4yNjQ5IDAgNTYuODAwM0MtMi4yNDc1MWUtMDYgNTcuMzM1NyAwLjE3Mjg4NyA1Ny44NTY4IDAuNDkyOTIgNTguMjg2MUMwLjgxMjk1MyA1OC43MTUzIDEuMjYzMDMgNTkuMDI5NyAxLjc3NjE3IDU5LjE4MjZaIiBmaWxsPSJibGFjayIvPgo8cGF0aCBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGNsaXAtcnVsZT0iZXZlbm9kZCIgZD0iTTMyLjE2MzcgMjkuNDg2OEw0MC4zNTc4IDMxLjkyNzFDNDAuNTkxNyAzMS45OTY3IDQwLjgwNDUgMzIuMTIzNiA0MC45NzcgMzIuMjk2MUM0MS4xNDk2IDMyLjQ2ODcgNDEuMjc2NCAzMi42ODE1IDQxLjM0NjEgMzIuOTE1NEw0My43ODYzIDQxLjEwOTVDNDMuODc2NiA0MS40MTI2IDQ0LjA2MjQgNDEuNjc4NSA0NC4zMTYgNDEuODY3NkM0NC41Njk2IDQyLjA1NjcgNDQuODc3NCA0Mi4xNTg4IDQ1LjE5MzcgNDIuMTU4OEM0NS41MTAxIDQyLjE1ODggNDUuODE3OSA0Mi4wNTY3IDQ2LjA3MTUgNDEuODY3NkM0Ni4zMjUxIDQxLjY3ODUgNDYuNTEwOSA0MS40MTI2IDQ2LjYwMTEgNDEuMTA5NUw0OS4wNDE0IDMyLjkxNTRDNDkuMTExMSAzMi42ODE1IDQ5LjIzNzkgMzIuNDY4NyA0OS40MTA0IDMyLjI5NjFDNDkuNTgzIDMyLjEyMzYgNDkuNzk1OCAzMS45OTY3IDUwLjAyOTcgMzEuOTI3MUw1OC4yMjM4IDI5LjQ4NjhDNTguNTI2OSAyOS4zOTY2IDU4Ljc5MjggMjkuMjEwOCA1OC45ODE5IDI4Ljk1NzJDNTkuMTcxIDI4LjcwMzYgNTkuMjczMSAyOC4zOTU4IDU5LjI3MzEgMjguMDc5NEM1OS4yNzMxIDI3Ljc2MzEgNTkuMTcxIDI3LjQ1NTMgNTguOTgxOSAyNy4yMDE3QzU4Ljc5MjggMjYuOTQ4MSA1OC41MjY5IDI2Ljc2MjMgNTguMjIzOCAyNi42NzJMNTAuMDI5NiAyNC4yMzE3QzQ5Ljc5NTggMjQuMTYyMSA0OS41ODI5IDI0LjAzNTIgNDkuNDEwNCAyMy44NjI3QzQ5LjIzNzkgMjMuNjkwMiA0OS4xMTEgMjMuNDc3MyA0OS4wNDE0IDIzLjI0MzRMNDYuNjAxMSAxNS4wNDkzQzQ2LjUxMDggMTQuNzQ2MiA0Ni4zMjUgMTQuNDgwMyA0Ni4wNzE1IDE0LjI5MTJDNDUuODE3OSAxNC4xMDIxIDQ1LjUxIDE0IDQ1LjE5MzcgMTRDNDQuODc3NCAxNCA0NC41Njk1IDE0LjEwMjEgNDQuMzE1OSAxNC4yOTEyQzQ0LjA2MjMgMTQuNDgwMyA0My44NzY2IDE0Ljc0NjIgNDMuNzg2MyAxNS4wNDkzTDQxLjM0NiAyMy4yNDM0QzQxLjI3NjQgMjMuNDc3MyA0MS4xNDk1IDIzLjY5MDIgNDAuOTc3IDIzLjg2MjdDNDAuODA0NCAyNC4wMzUyIDQwLjU5MTYgMjQuMTYyMSA0MC4zNTc4IDI0LjIzMTdMMzIuMTYzNyAyNi42NzJDMzEuODYwNSAyNi43NjIyIDMxLjU5NDYgMjYuOTQ4IDMxLjQwNTUgMjcuMjAxNkMzMS4yMTY0IDI3LjQ1NTIgMzEuMTE0MyAyNy43NjMxIDMxLjExNDMgMjguMDc5NEMzMS4xMTQzIDI4LjM5NTggMzEuMjE2NCAyOC43MDM3IDMxLjQwNTUgMjguOTU3MkMzMS41OTQ2IDI5LjIxMDggMzEuODYwNSAyOS4zOTY2IDMyLjE2MzcgMjkuNDg2OFoiIGZpbGw9ImJsYWNrIi8+Cjwvc3ZnPgo=";
function setupBitteWallet({
  walletUrl = "",
  deprecated = false,
  successUrl = "",
  failureUrl = "",
  callbackUrl = "",
  contractId = ""
} = {}) {
  return (moduleOptions) => __async(this, null, function* () {
    const wallet = {
      id: "bitte-wallet",
      type: "browser",
      metadata: {
        name: "Bitte Wallet",
        description: "NEAR wallet to store, buy, send and stake assets for DeFi.",
        iconUrl: icon,
        deprecated,
        available: true,
        successUrl,
        failureUrl,
        walletUrl: resolveBitteWallet(moduleOptions.options.network.networkId, walletUrl)
      },
      init: (options) => {
        return BitteWallet(__spreadValues({ callback: callbackUrl, networkId: moduleOptions.options.network.networkId, successUrl, failureUrl, contractId }, options));
      }
    };
    return wallet;
  });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  setupBitteWallet
});
//# sourceMappingURL=index.js.map