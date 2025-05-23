import { useState } from "react";
import axios from "axios";
import styles from "./BatchMint.module.scss";
import { BackButton, MainButton } from "@twa-dev/sdk/react";
import * as XLSX from "xlsx";
import { useTonWallet, toUserFriendlyAddress, SendTransactionRequest, useTonConnectUI, CHAIN } from "@tonconnect/ui-react";
import { Address, beginCell, Cell, Dictionary, DictionaryValue, toNano } from "@ton/core";
import { getJettonWalletAddress } from "../../../utils/tonapi";
import { SIMPLE_COIN_ADDRESS } from "../../../utils/constants";

interface Attribute {
    trait_type: string;
    value: string;
}

interface Metadata {
    name?: string;
    description?: string;
    image?: string;
    content_url?: string; 
    attributes?: Attribute[];
}

interface NFT {
    name: string;
    image: string;
    description: string;
    content_url: string;
    attributes: Attribute[];
}

function BatchMint() {
    const [nfts, setNfts] = useState<NFT[]>([
        { name: "", image: "", description: "", content_url: "", attributes: [{ trait_type: "", value: "" }] },
    ]);
    const [paymentType, setPaymentType] = useState<string>("TON");
    const [nftType, setNftType] = useState<string>("NFT"); 
    const [, setMetadataUrls] = useState<string[]>([]); 
    const [uploading, setUploading] = useState(false);
    const [collectionAddress, setCollectionAddress] = useState<string>(""); 
    const [, setCollectionAddressError] = useState<string>("");
    const [walletAddresses, setWalletAddresses] = useState<string[]>([]);
    const [addressCount, setAddressCount] = useState<number>(0);
    const [fileError, setFileError] = useState<string>("");
    const [, setErrorMessage] = useState<string>("");
    const [metadataDistribution, setMetadataDistribution] = useState<string>("random"); 
    const wallet = useTonWallet();
    const [tonConnectUi] = useTonConnectUI();

    type CollectionMint = {
        amount: bigint;
        itemIndex: number;
        itemOwnerAddress: Address;
        itemContent: Cell;
    };
    
    const MintDictValue: DictionaryValue<CollectionMint> = {
        serialize(src, builder) {
            const nftMessage = beginCell();
            nftMessage.storeAddress(src.itemOwnerAddress);
            nftMessage.storeRef(src.itemContent);
    
            builder.storeCoins(src.amount);
            builder.storeRef(nftMessage);
        },
    
        parse() {
            return {
                amount: 0n,
                itemIndex: 0,
                itemOwnerAddress: new Address(0, Buffer.from([])),
                itemContent: Cell.EMPTY
            };
        }
    };
    
    type CollectionMintSBT = {
        amount: bigint;
        itemIndex: number;
        itemOwnerAddress: Address;
        itemContent: Cell;
        itemBoundAddress: Address;
    };
    
    const MintDictValueSBT: DictionaryValue<CollectionMintSBT> = {
        serialize(src, builder) {
            const sbtMessage = beginCell();
            sbtMessage.storeAddress(src.itemOwnerAddress);
            sbtMessage.storeRef(src.itemContent); 
            sbtMessage.storeAddress(src.itemBoundAddress);
    
            builder.storeCoins(src.amount);
            builder.storeRef(sbtMessage);
        },
    
        parse() {
            return {
                amount: 0n,
                itemIndex: 0,
                itemOwnerAddress: new Address(0, Buffer.from([])),
                itemContent: Cell.EMPTY,
                itemBoundAddress: new Address(0, Buffer.from([])),
            };
        }
    };
    
    const generateNFT = (index: number, amount: bigint, ownerAddress: Address, metadataUrl: string) => {
        return {
            amount,
            itemIndex: index,
            itemOwnerAddress: ownerAddress,
            itemContent: beginCell().storeStringTail(metadataUrl).endCell()
        };
    };
    
    const generateSBT = (index: number, amount: bigint, ownerAddress: Address, boundAddress: Address, metadataUrl: string) => {
        return {
            amount,
            itemIndex: index,
            itemOwnerAddress: ownerAddress,
            itemContent: beginCell().storeStringTail(metadataUrl).endCell(),
            itemBoundAddress: boundAddress
        };
    };
    
    const onSendMintBatch = async (owners: string[], metadataUrls: string[]) => {
        if (!wallet) {
            console.error('Wallet is not connected');
            return;
        }
    
        try {
            const passAmountPerItem = toNano(0.0385);
            const feeInTon = toNano(0.01);
            const commissionPerNFT = toNano(0.0455);
            const numOfNfts = owners.length;
            const jwAddress = await getJettonWalletAddress(Address.parse(SIMPLE_COIN_ADDRESS).toRawString(), wallet!.account.address);
    
            const totalAmount = commissionPerNFT * BigInt(numOfNfts);
            const totalFeesInTon = BigInt(numOfNfts) * feeInTon;
            const totalFeesInSC = BigInt(numOfNfts * 100);
    
            const tonResponse = await fetch(`https://tonapi.io/v2/accounts/${wallet!.account.address}`);
            const tonData = await tonResponse.json();
            const tonBalance = BigInt(tonData?.balance || 0);
    
            const scResponse = await fetch(`https://tonapi.io/v2/accounts/${wallet!.account.address}/jettons/${SIMPLE_COIN_ADDRESS}`);
            const scData = await scResponse.json();
            const scBalance = BigInt(scData?.balance || 0);
    
            if (paymentType === "TON") {
                const requiredTon = totalAmount + totalFeesInTon;
                if (tonBalance < requiredTon) {
                    alert(`Недостаточно TON на балансе!\nТребуется: ${(Number(requiredTon) / 1e9).toFixed(4)} TON\nДоступно: ${(Number(tonBalance) / 1e9).toFixed(4)} TON`);
                    return;
                }
            } else if (paymentType === "SC") {
                if (tonBalance < totalAmount) {
                    alert(`Недостаточно TON для оплаты транзакции!\nТребуется: ${(Number(totalAmount) / 1e9).toFixed(4)} TON\nДоступно: ${(Number(tonBalance) / 1e9).toFixed(4)} TON`);
                    return;
                }
                if (scBalance < totalFeesInSC * BigInt(1e9)) {
                    alert(`Недостаточно Simple Coin для оплаты комиссии!\nТребуется: ${totalFeesInSC} SC\nДоступно: ${(Number(scBalance) / 1e9).toFixed(4)} SC`);
                    return;
                }
            }
    
            const nfts: CollectionMint[] = [];
            const usedIndices = new Set<number>();
    
            if (metadataDistribution === "random") {
                while (nfts.length < numOfNfts) {
                    for (let i = 0; i < numOfNfts; i++) {
                        const owner = owners[i];
                        const randomMetadataUrl = metadataUrls[Math.floor(Math.random() * metadataUrls.length)];
                        const randomIndex = Math.floor(Math.random() * 1000);
            
                        if (!usedIndices.has(randomIndex)) {
                            usedIndices.add(randomIndex);
                            nfts.push(generateNFT(randomIndex, passAmountPerItem, Address.parse(owner), randomMetadataUrl));
                        }
                    }
                }
            } else {
                for (let i = 0; i < numOfNfts; i++) {
                    const owner = owners[i];
                    const metadataUrl = metadataUrls[i % metadataUrls.length];
                    const index = i;
                    
                    nfts.push(generateNFT(index, passAmountPerItem, Address.parse(owner), metadataUrl));
                    usedIndices.add(index);
                }
            }
    
            const batchDict = Dictionary.empty(Dictionary.Keys.Uint(64), MintDictValue);
            for (const nft of nfts) {
                batchDict.set(nft.itemIndex, nft);
            }
    
            const payload = beginCell()
                .storeUint(2, 32)
                .storeUint(123, 64)
                .storeDict(batchDict)
                .endCell()
                .toBoc()
                .toString('base64');
    
            const jettonPayload = beginCell()
                .storeUint(0x0f8a7ea5, 32)
                .storeUint(123, 64)
                .storeCoins(totalFeesInSC * BigInt(1e9))
                .storeAddress(Address.parse("UQDkryNvZdYtQQqdSz_xS7h0PCBI58c_nekr6GWGl8_P3Vxw"))
                .storeAddress(null)
                .storeMaybeRef()
                .storeCoins(0)
                .storeMaybeRef()
                .endCell().toBoc().toString('base64');
    
            const messages: SendTransactionRequest["messages"] = [{
                address: collectionAddress,
                amount: totalAmount.toString(),
                payload
            }];
    
            if (paymentType === "TON") {
                messages.push({
                    address: "UQDkryNvZdYtQQqdSz_xS7h0PCBI58c_nekr6GWGl8_P3Vxw",
                    amount: totalFeesInTon.toString(),
                });
            } else if (paymentType === "SC") {
                messages.push({
                    address: jwAddress,
                    amount: '55000000',
                    payload: jettonPayload
                });
            }
    
            const tx: SendTransactionRequest = {
                validUntil: Math.round(Date.now() / 1000) + 60 * 5,
                network: CHAIN.MAINNET,
                messages
            };
    
            const result = await tonConnectUi.sendTransaction(tx, {
                modals: 'all',
                notifications: ['error']
            });
    
            const imMsgCell = Cell.fromBase64(result.boc);
            console.log(imMsgCell.hash().toString('hex'));
    
        } catch (e) {
            console.error('Error sending transaction:', e);
        }
    };
    
    const onSendMintBatchSbt = async (owners: string[], metadataUrls: string[]) => {
        if (!wallet) {
            console.error('Wallet is not connected');
            return;
        }
    
        try {
            const passAmountPerItem = toNano(0.0385);
            const feeInTon = toNano(0.01);
            const commissionPerSBT = toNano(0.0455);
            const numOfSbts = owners.length;
            console.log('nums', numOfSbts);
            
            const jwAddress = await getJettonWalletAddress(Address.parse(SIMPLE_COIN_ADDRESS).toRawString(), wallet!.account.address);
    
            const totalAmount = (commissionPerSBT * BigInt(numOfSbts));
            console.log(totalAmount, 'total');
            const totalFeesInTon = (BigInt(numOfSbts) * feeInTon);
            console.log('fees in ton', totalFeesInTon);
            
            const totalFeesInSC = BigInt(numOfSbts * 100);
    
            const tonResponse = await fetch(`https://tonapi.io/v2/accounts/${wallet!.account.address}`);
            const tonData = await tonResponse.json();
            const tonBalance = BigInt(tonData?.balance || 0);
    
            const scResponse = await fetch(`https://tonapi.io/v2/accounts/${wallet!.account.address}/jettons/${SIMPLE_COIN_ADDRESS}`);
            const scData = await scResponse.json();
            const scBalance = BigInt(scData?.balance || 0);
    
            if (paymentType === "TON") {
                const requiredTon = totalAmount + totalFeesInTon;
                if (tonBalance < requiredTon) {
                    alert(`Недостаточно TON на балансе!\nТребуется: ${(Number(requiredTon) / 1e9).toFixed(4)} TON\nДоступно: ${(Number(tonBalance) / 1e9).toFixed(4)} TON`);
                    return;
                }
            } else if (paymentType === "SC") {
                if (tonBalance < totalAmount) {
                    alert(`Недостаточно TON для оплаты транзакции!\nТребуется: ${(Number(totalAmount) / 1e9).toFixed(4)} TON\nДоступно: ${(Number(tonBalance) / 1e9).toFixed(4)} TON`);
                    return;
                }
                if (scBalance < totalFeesInSC * BigInt(1e9)) {
                    alert(`Недостаточно Simple Coin для оплаты комиссии!\nТребуется: ${totalFeesInSC} SC\nДоступно: ${(Number(scBalance) / 1e9).toFixed(4)} SC`);
                    return;
                }
            }
    
            const sbts: CollectionMintSBT[] = [];
            const usedIndices = new Set<number>();
    
            if (metadataDistribution === "random") {
                while (sbts.length < numOfSbts) {
                    for (let i = 0; i < numOfSbts; i++) {
                        const owner = owners[i];
                        const randomBoundAddress = owner;
                        const randomMetadataUrl = metadataUrls[Math.floor(Math.random() * metadataUrls.length)];
                        const randomIndex = Math.floor(Math.random() * 1000);
            
                        if (!usedIndices.has(randomIndex)) {
                            usedIndices.add(randomIndex);
                            sbts.push(generateSBT(randomIndex, passAmountPerItem, Address.parse(owner), Address.parse(randomBoundAddress), randomMetadataUrl));
                        }
                    }
                }
            } else {
                for (let i = 0; i < numOfSbts; i++) {
                    const owner = owners[i];
                    const boundAddress = owner;
                    const metadataUrl = metadataUrls[i % metadataUrls.length];
                    const index = i; 
                    
                    sbts.push(generateSBT(index, passAmountPerItem, Address.parse(owner), Address.parse(boundAddress), metadataUrl));
                    usedIndices.add(index);
                }
            }
    
            const batchDict = Dictionary.empty(Dictionary.Keys.Uint(64), MintDictValueSBT);
            for (const sbt of sbts) {
                batchDict.set(sbt.itemIndex, sbt);
            }
    
            const payload = beginCell()
                .storeUint(2, 32)
                .storeUint(123, 64)
                .storeDict(batchDict)
                .endCell()
                .toBoc()
                .toString('base64');
    
            const jettonPayload = beginCell()
                .storeUint(0x0f8a7ea5, 32)
                .storeUint(123, 64)
                .storeCoins(totalFeesInSC * BigInt(1e9))
                .storeAddress(Address.parse("UQDkryNvZdYtQQqdSz_xS7h0PCBI58c_nekr6GWGl8_P3Vxw"))
                .storeAddress(null)
                .storeMaybeRef()
                .storeCoins(0)
                .storeMaybeRef()
                .endCell().toBoc().toString('base64');          
    
            const messages: SendTransactionRequest["messages"] = [{
                address: collectionAddress,
                amount: totalAmount.toString(),
                payload
            }];
    
            if (paymentType === "TON") {
                messages.push({
                    address: "UQDkryNvZdYtQQqdSz_xS7h0PCBI58c_nekr6GWGl8_P3Vxw",
                    amount: totalFeesInTon.toString(),
                });
            } else if (paymentType === "SC") {
                messages.push({
                    address: jwAddress,
                    amount: '55000000',
                    payload: jettonPayload
                });
            }
    
            const tx: SendTransactionRequest = {
                validUntil: Math.round(Date.now() / 1000) + 60 * 5,
                network: CHAIN.MAINNET,
                messages
            };
    
            const result = await tonConnectUi.sendTransaction(tx, {
                modals: 'all',
                notifications: ['error']
            });
    
            const imMsgCell = Cell.fromBase64(result.boc);
            console.log(imMsgCell.hash().toString('hex'));
    
        } catch (e) {
            console.error('Error sending transaction:', e);
        }
    };

    const validateCollectionAddress = (address: string) => {
        if (!/^(EQ|UQ)/.test(address)) {
            setCollectionAddressError("Адрес коллекции должен начинаться с EQ, UQ, kQ или 0Q.");
            return false;
        }
        setCollectionAddressError("");
        return true;
    };

    const checkAdminRights = async (): Promise<boolean> => {
        try {
            if (!validateCollectionAddress(collectionAddress)) {
                setErrorMessage("Enter correct Address.");
                return false;
            }
    
            const response = await axios.get(`https://tonapi.io/v2/nfts/collections/${collectionAddress}`);
            const ownerAddressRaw = response.data.owner?.address;
    
            if (!ownerAddressRaw) {
                setErrorMessage("Не удалось получить данные о владельце коллекции.");
                return false;
            }
    
            const ownerAddress = Address.parse(ownerAddressRaw).toString();
    
            if (!wallet || !wallet.account || !wallet.account.address) {
                setErrorMessage("Не удается найти ваш кошелек.");
                return false;
            }
    
            const walletAddress = toUserFriendlyAddress(wallet.account.address);
    
            console.log("Адрес владельца коллекции:", ownerAddress);
            console.log("Адрес пользователя:", walletAddress);
    
            if (Address.parse(walletAddress).toRawString() !== Address.parse(ownerAddress).toRawString()) {
                alert("You are not the Owner of the Collection.");
                setErrorMessage("Вы не являетесь администратором данной коллекции.");
                return false;
            }
    
            console.log("Администратор подтвержден:", wallet);
            return true;
        } catch (error) {
            console.error("Ошибка при проверке владельца коллекции:", error);
            setErrorMessage("Ошибка при получении данных о коллекции.");
            return false;
        }
    };
    
    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
    
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: "array" });
                const sheet = workbook.Sheets[workbook.SheetNames[0]];
                const json = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1 });
    
                const addresses = json.flat().filter((address: string) => typeof address === "string" && address.trim() !== "");
    
                if (addresses.length === 0) {
                    throw new Error("Файл не должен быть пустым.");
                }
    
                if (addresses.length > 70) {
                    throw new Error("Максимальное количество адресов — 70.");
                }
    
                const isValid = addresses.every((address: string) => /^(EQ|UQ)/.test(address));
                if (!isValid) {
                    throw new Error("Файл содержит некорректные адреса.");
                }
    
                setWalletAddresses(addresses);
                setAddressCount(addresses.length);
                setFileError("");
            } catch (error) {
                setWalletAddresses([]);
                setAddressCount(0);
            }
        };
    
        reader.readAsArrayBuffer(file);
    };

    const addNFT = () => {
        if (nfts.length < 35) {
            setNfts([...nfts, { name: "", image: "", description: "", content_url: "", attributes: [{ trait_type: "", value: "" }] }]);
        }
    };

    const removeNFT = () => {
        if (nfts.length > 1) {
            setNfts(nfts.slice(0, -1));
        }
    };

    const updateNFT = (index: number, field: keyof NFT, value: string) => {
        const updatedNfts = [...nfts];
        if (field === 'attributes') {
            updatedNfts[index].attributes = value as unknown as Attribute[]; 
        } else {
            updatedNfts[index][field] = value;
        }
        setNfts(updatedNfts);
    };

    const updateAttribute = (nftIndex: number, attrIndex: number, field: keyof Attribute, value: string) => {
        const updatedNfts = [...nfts];
        updatedNfts[nftIndex].attributes[attrIndex][field] = value;
        setNfts(updatedNfts);
    };

    const addAttribute = (index: number) => {
        if (nfts[index].attributes.length < 10) {
            const updatedNfts = [...nfts];
            updatedNfts[index].attributes.push({ trait_type: "", value: "" });
            setNfts(updatedNfts);
        }
    };

    const removeAttribute = (nftIndex: number) => {
        if (nfts[nftIndex].attributes.length > 1) {
            const updatedNfts = [...nfts];
            updatedNfts[nftIndex].attributes.pop();
            setNfts(updatedNfts);
        }
    };

    const generateJSON = async () => {
        try {
            if (!wallet || !wallet.account || !wallet.account.address) {
                setErrorMessage("Не удается найти ваш кошелек.");
                return;
            }

            const isAdmin = await checkAdminRights();
            if (!isAdmin) {
                return;
            }

            if (!walletAddresses || walletAddresses.length === 0) {
                alert("Please upload a file with wallet addresses.");
                return;
            }
            
            if (walletAddresses.length > 70) {
                alert("The number of wallet addresses cannot exceed 70.");
                return;
            }
    
            if (!collectionAddress.trim()) {
                alert("Please enter the collection address.");
                return;
            }
    
            if (!validateCollectionAddress(collectionAddress)) {
                alert("Invalid collection address format.");
                return;
            }
    
            if (nfts.length === 0 || nfts.every(nft => !nft.name.trim() || !nft.image.trim())) {
                alert("Please add at least one NFT with valid metadata.");
                return;
            }
    
            setUploading(true);
    
            if (nfts.length === 0 || nfts.every(nft => !nft.name.trim() || !nft.image.trim())) {
                alert("Add 1 Metadata.");
                return;
            }
    
            setUploading(true);
            const metadataUrlsList = await Promise.all(nfts.map(async (nft) => {
                const metadata: Metadata = {}; 
    
                if (nft.name.trim()) metadata.name = nft.name;
                if (nft.description.trim()) metadata.description = nft.description;
                if (nft.image.trim()) metadata.image = nft.image;
                if (nft.content_url.trim()) metadata.content_url = nft.content_url;
    
                const attributes = nft.attributes.filter(attr => attr.trait_type.trim() && attr.value.trim());
                if (attributes.length > 0) metadata.attributes = attributes;
    
                console.log("Метаданные, которые отправляются на IPFS:", JSON.stringify(metadata, null, 2));
    
                const response = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
                    method: "POST",
                    headers: {
                        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiI1ZDZjMjczMS1lYzYwLTQwMzMtYTAxMS02NmU2Yjg5ZjE0YTAiLCJlbWFpbCI6ImRhbmlpbHNjaGVyYmFrb3YxQGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJwaW5fcG9saWN5Ijp7InJlZ2lvbnMiOlt7ImRlc2lyZWRSZXBsaWNhdGlvbkNvdW50IjoxLCJpZCI6IkZSQTEifSx7ImRlc2lyZWRSZXBsaWNhdGlvbkNvdW50IjoxLCJpZCI6Ik5ZQzEifV0sInZlcnNpb24iOjF9LCJtZmFfZW5hYmxlZCI6ZmFsc2UsInN0YXR1cyI6IkFDVElWRSJ9LCJhdXRoZW50aWNhdGlvblR5cGUiOiJzY29wZWRLZXkiLCJzY29wZWRLZXlLZXkiOiJjOGUwMzI3MTYyOTQwZGU1MGUxNSIsInNjb3BlZEtleVNlY3JldCI6IjEzYTRkN2NjMjg5ZDgwMjY0MTc2NmVlZjYyYTcxYzk2NDg1NDViNTYxMzU4ZjJlMWQyNDJkZDA4ZDI1ZjA3OTkiLCJleHAiOjE3NzY2ODk2MDZ9.dTD17OYLcMHzSzkwYCRv6W_gVuZRt-BkbHhyX0iuSzo', 
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(metadata),
                });
    
                if (!response.ok) {
                    throw new Error(`Ошибка при загрузке на IPFS: ${response.statusText}`);
                }
    
                const responseBody = await response.json();  
    
                console.log("Ответ от API Pinata:", responseBody);
    
                if (responseBody && responseBody.IpfsHash) {
                    const gatewayUrl = `https://gateway.pinata.cloud/ipfs/${responseBody.IpfsHash}`;
                    return gatewayUrl; 
                } else {
                    throw new Error('Ошибка: не удалось получить IpfsHash из ответа');
                }
            }));
    
            console.log("Метаданные успешно загружены на IPFS:", metadataUrlsList);
            setMetadataUrls(metadataUrlsList); 

            
            if (nftType === "SBT") {
                onSendMintBatchSbt(walletAddresses, metadataUrlsList);
            } else if (nftType === "NFT") {
                onSendMintBatch(walletAddresses, metadataUrlsList);
            }

        } catch (error) {
            console.error("Ошибка при генерации JSON:", error);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className={styles.container}>
            <h1>Batch Mint</h1>
            <BackButton />
            {nfts.map((nft, nftIndex) => (
                <div key={nftIndex} className={styles.nftBlock}>
                    <h2>Metadata #{nftIndex + 1}</h2>
                    <label>Name NFT:</label>
                    <input
                        type="text"
                        value={nft.name}
                        onChange={(e) => updateNFT(nftIndex, "name", e.target.value)}
                        required
                        className={nft.name.trim() ? "" : styles.errorInput}
                    />
    
                    <label>Description (Max 51 Words):</label>
                    <textarea
                        value={nft.description}
                        onChange={(e) => updateNFT(nftIndex, "description", e.target.value)}
                        maxLength={51}
                    />
    
                    <label>Image URL:</label>
                    <input
                        type="text"
                        value={nft.image}
                        onChange={(e) => updateNFT(nftIndex, "image", e.target.value)}
                        placeholder="https://example.com/image.jpg"
                        required
                        className={nft.image.trim() ? "" : styles.errorInput}
                    />
    
                    <label>Video URL (Optional):</label>
                    <input
                        type="text"
                        value={nft.content_url}
                        onChange={(e) => updateNFT(nftIndex, "content_url", e.target.value)}
                        placeholder="https://example.com/video.mp4"
                    />
    
                    <label>Attributes:</label>
                    {nft.attributes.map((attr, attrIndex) => (
                        <div key={attrIndex} className={styles.attributeBlock}>
                            <input
                                type="text"
                                placeholder="trait_type"
                                value={attr.trait_type}
                                onChange={(e) => updateAttribute(nftIndex, attrIndex, "trait_type", e.target.value)}
                            />
                            <input
                                type="text"
                                placeholder="value"
                                value={attr.value}
                                onChange={(e) => updateAttribute(nftIndex, attrIndex, "value", e.target.value)}
                            />
                        </div>
                    ))}
    
                    {nft.attributes.length < 10 && (
                        <button onClick={() => addAttribute(nftIndex)}>Add Attribute</button>
                    )}
                    {nft.attributes.length > 1 && (
                        <button className={styles.removeButton} onClick={() => removeAttribute(nftIndex)}>Remove Last Attribute</button>
                    )}
                </div>
            ))}
    
            {nfts.length < 35 && <button onClick={addNFT}>Add Metadata</button>}
            {nfts.length > 1 && <button className={styles.removeButton} onClick={removeNFT}>Remove Last Metadata</button>}
    
            <div className={styles.fileUpload}>
                <label className={styles.fileLabel}>
                    <input type="file" accept=".xlsx" onChange={handleFileUpload} />
                    File with Addresses (.xlsx) 70 max
                </label>
                {fileError && <p className={styles.errorText}>{fileError}</p>}
                {addressCount > 0 && <p className={styles.successText}>Addresses Found: {addressCount}</p>}
            </div>
    
            <label>Collection Address:</label>
            <input
                type="text"
                value={collectionAddress}
                onChange={(e) => setCollectionAddress(e.target.value)}
            />
    
            <label>Type of NFT:</label>
            <select className={styles.customSelect} value={nftType} onChange={(e) => setNftType(e.target.value)}>
                <option value="NFT">NFT</option>
                <option value="SBT">SBT</option>
            </select>
    
            <label>Pay Fees In:</label>
            <select className={styles.customSelect} value={paymentType} onChange={(e) => setPaymentType(e.target.value)}>
                <option value="TON">TON</option>
                <option value="SC">SC</option>
            </select>
    
            <label>Metadata Distribution:</label>
            <select 
                className={styles.customSelect} 
                value={metadataDistribution} 
                onChange={(e) => setMetadataDistribution(e.target.value)}
            >
                <option value="random">Random</option>
                <option value="sequential">Sequential</option>
            </select>
    
            <p className={styles.disc}>
                Please make sure to select the appropriate NFT type for minting that corresponds to your collection. 
                For example, if your collection is intended for regular NFTs, you will not be able to mint SBTs (Soulbound Tokens). 
                Minting the wrong type may result in a loss of funds, so choose carefully. 
                Metadata can be distributed either randomly or sequentially based on your selection.
            </p>
            
            <MainButton
                text={uploading ? "Uploading..." : "Mint Batch NFT"} 
                onClick={generateJSON}
                disabled={uploading} 
                color="#0b0b0b" 
                textColor="#ffffff" 
                hasShineEffect
            />
        </div>
    );
}

export default BatchMint;