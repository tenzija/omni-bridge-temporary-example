import {
    setNetwork,
    OmniBridgeAPI,
    omniTransfer,
    omniAddress,
    ChainKind,
} from 'omni-bridge-sdk'
import { ethers } from "ethers";

const config = {
    BASE_RPC_URL: "https://rpc.ankr.com/eth",
    BASE_PRIVATE_KEY: "3ff3f4ef5845b2e737328958452197a9611de539495e3663e9eb32794d81b21f",
    TOKEN_ADDRESS: "0x0000000000000000000000000000000000000000",
    NEAR_ACCOUNT_ID: "test.testnet",
    AMOUNT: "1000000000000000000",
};

async function main() {

    const {
        BASE_RPC_URL,
        BASE_PRIVATE_KEY: PRIVATE_KEY,
        TOKEN_ADDRESS,
        NEAR_ACCOUNT_ID,
        AMOUNT,
    } = config

    if (
        !BASE_RPC_URL ||
        !PRIVATE_KEY ||
        !TOKEN_ADDRESS ||
        !NEAR_ACCOUNT_ID ||
        !AMOUNT
    ) {
        console.error(
            "Missing one of BASE_RPC_URL, PRIVATE_KEY, TOKEN_ADDRESS, NEAR_ACCOUNT_ID or AMOUNT in .env",
        );
        process.exit(1);
    }

    // 1️⃣ Tell the SDK which chains we're on
    setNetwork("mainnet"); // or "testnet" if you’re on testnets :contentReference[oaicite:0]{index=0}

    // 2️⃣ Setup Base provider & signer
    const provider = new ethers.providers.JsonRpcProvider(BASE_RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    const senderAddress = await wallet.getAddress();

    // 3️⃣ Prepare Omni addresses
    const sender = omniAddress(ChainKind.Base, senderAddress);
    const token = omniAddress(ChainKind.Base, TOKEN_ADDRESS);
    const recipient = omniAddress(ChainKind.Near, NEAR_ACCOUNT_ID);

    // 4️⃣ Estimate fees via relayer
    const api = new OmniBridgeAPI();
    const fees = await api.getFee(sender, recipient, token);
    console.log("Estimated fees:", {
        tokenFee: fees.transferred_token_fee.toString(),
        nativeFee: fees.native_token_fee.toString(),
    });

    // 5️⃣ Dispatch the bridge tx
    const transfer = {
        tokenAddress: token,
        recipient,
        amount: BigInt(AMOUNT),
        fee: BigInt(fees.transferred_token_fee),
        nativeFee: BigInt(fees.native_token_fee),
    };

    console.log("Sending bridge transaction on Base...");
    const result = await omniTransfer(wallet, transfer);
    console.log("✅ Bridge tx sent:", result.txHash);
    console.log("Relayer nonce:", result.nonce);
    console.log(
        "Your tokens are now in flight — relayer will finalize on NEAR shortly.",
    );
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});