import { Address, beginCell, Cell } from "@ton/core";
import { CHAIN, SendTransactionRequest } from "@tonconnect/ui-react";
import { NFT_COLLECTION_BASE64, NFT_ITEM_BASE64, SBT_ITEM_BASE64 } from "./constants";

const encodeRoyaltyParams = (params: { royaltyFactor: number; royaltyBase: number; royaltyAddress: Address }): Cell => {
    return beginCell()
        .storeUint(params.royaltyFactor, 16)
        .storeUint(params.royaltyBase, 16)
        .storeAddress(params.royaltyAddress)
        .endCell();
};

interface NFT {
    nftType: string;
    metadata: string;
    owner: string;
    tonConnectUi: any;
    wallet: any;
}

export async function mintCollection({ nftType, metadata, owner, tonConnectUi, wallet }: NFT) {
    if (!wallet) {
        console.error("Wallet is not connected");
        return;
    }

    const NFT_CODE = nftType === "SBT" ? SBT_ITEM_BASE64 : NFT_ITEM_BASE64;

    try {
        const royaltyAddress = Address.parse(owner);
        const royaltyParams = {
            royaltyFactor: 3,
            royaltyBase: 100,
            royaltyAddress
        };

        const royaltyParamsCell = encodeRoyaltyParams(royaltyParams);

        const commonContent1 = beginCell()
            .storeUint(1, 8)
            .storeStringTail(metadata)
            .endCell();

        const commonContent2 = beginCell().storeStringTail("").endCell();

        const collectionContent = beginCell()
            .storeUint(1, 8)
            .storeRef(commonContent1)
            .storeRef(commonContent2)
            .endCell();

        const collectionData = beginCell()
            .storeAddress(Address.parse(owner))
            .storeUint(0, 64)
            .storeRef(collectionContent)
            .storeRef(Cell.fromBase64(NFT_CODE))
            .storeRef(royaltyParamsCell)
            .endCell();

        const state = beginCell()
            .storeUint(6, 5)
            .storeRef(Cell.fromBase64(NFT_COLLECTION_BASE64))
            .storeRef(collectionData)
            .endCell();

        // const payload = beginCell()
        //     .storeUint(0, 32)
        //     .storeStringTail("simple coin comission")
        // .endCell()

        const smartContractAddress = new Address(0, state.hash()).toRawString();
        console.log("Smart contract address:", smartContractAddress);

        const messages: SendTransactionRequest["messages"] = [
            {
                address: smartContractAddress,
                amount: "50000000",
                stateInit: state.toBoc().toString("base64")
            }
        ];

        if (nftType === "SBT") {
            messages.push({
                address: "UQDkryNvZdYtQQqdSz_xS7h0PCBI58c_nekr6GWGl8_P3Vxw",
                amount: "15000000",
            });
        }

        const tx: SendTransactionRequest = {
            validUntil: Math.round(Date.now() / 1000) + 60 * 5,
            network: CHAIN.MAINNET,
            messages
        };

        if (!tonConnectUi) {
            console.error("TonConnect UI is not initialized");
            return;
        }

        const result = await tonConnectUi.sendTransaction(tx, {
            modals: "all",
            notifications: ["error"]
        });

        console.log("Transaction Hash:", result);
    } catch (e) {
        console.error("Error sending transaction:", e);
    }
}

