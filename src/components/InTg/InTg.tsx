import styles from "./InTg.module.scss";
import Balance from "./ConnectBalance/Balance";
import Fees from "./Fees/Fees";
import Buttons from "./Buttons/Buttons";
import Footer from "./Footer/Footer";
import Media from "./Media/Media";
import { CHAIN, SendTransactionRequest, useTonConnectUI, useTonWallet } from "@tonconnect/ui-react";
import { Address, beginCell } from "@ton/core";
import { useEffect, useState } from "react";
import axios from "axios";

function InTg() {
    const wallet = useTonWallet();
    const [tonConnectUi] = useTonConnectUI();
    const [tonBalance, setTonBalance] = useState(null);
    const [, setScBalance] = useState(null);

    useEffect(() => {
        const tonUrl = 'https://cache.tonapi.io/imgproxy/bc7sg6Xi4-cfUwK-er2CR-6CUnMql9nFQwMVU4IeYNA/rs:fill:200:200:1/g:no/aHR0cHM6Ly9jYWNoZS50b25hcGkuaW8vaW1ncHJveHkvU0Jxb19Jd2N0VUdSSjI4WkNIRHk1U21CcU8yS1R2aEc4VTFSb0k1SVpIay9yczpmaWxsOjIwMDoyMDA6MS9nOm5vL2FIUjBjSE02THk5MGIyNHViM0puTDJsamIyNXpMMk4xYzNSdmJTOTBiMjVmYkc5bmJ5NXpkbWMud2VicA.webp';
        const scUrl = 'https://tonapi.io/v2/accounts/EQBj-XyUDES7Q8E_oPpiMgAUkYokgmnei_4h5105ztk_rxsn/jettons/EQB9QBqniFI0jOmw3PU6v1v4LU3Sivm9yPXDDB9Qf7cXTDft?currencies=ton,usd,rub&supported_extensions=custom_payload';

        axios.all([axios.get(tonUrl), axios.get(scUrl)])
            .then(axios.spread((tonResponse, scResponse) => {
                setTonBalance(tonResponse.data.balance);

                const balanceSC = scResponse.data.balance;
                const tonPrice = scResponse.data.price.prices.TON;

                if (tonPrice) {
                    setScBalance(balanceSC); 
                }
            }))
            .catch(error => {
                console.error('Error fetching wallet data:', error);
            });
    }, []); 

    async function claimTon() {
        const payload = beginCell()
            .storeUint(0x37726bdb, 32)
        .endCell().toBoc().toString('base64')

        const tx: SendTransactionRequest = {
            validUntil: Math.round(Date.now() / 1000) + 60 * 5,
            network: CHAIN.MAINNET,
            messages: [
                {
                    address: "EQBj-XyUDES7Q8E_oPpiMgAUkYokgmnei_4h5105ztk_rxsn",
                    amount: "23500000",
                    payload
                }
            ]
        }
        const result = await tonConnectUi.sendTransaction(tx, {
            modals: 'all',
            notifications: ['success', 'error']
        });

        if (!result || !result.boc) {
            console.error('No result received from transaction request');
            return;
        }
    }

    // async function claimSimpleCoin() {

    //     if (scBalance) {
    //         const payload = beginCell()
    //             .storeUint(0x11c09682, 32) 
    //             .storeUint(scBalance, 64)
    //         .endCell().toBoc().toString('base64');

    //         const tx: SendTransactionRequest = {
    //             validUntil: Math.round(Date.now() / 1000) + 60 * 5,
    //             messages: [
    //                 {
    //                     address: "EQDQCkgingyMh8aqx06HmMjZqhbRijt7kZvvwIMQJTRQpS0f",
    //                     amount: "455500000",
    //                     payload
    //                 }
    //             ]
    //         }
    //         const result = await tonConnectUi.sendTransaction(tx, {
    //             modals: 'all',
    //             notifications: ['success', 'error']
    //         });
    
    //         if (!result || !result.boc) {
    //             console.error('No result received from transaction request');
    //             return;
    //         }
    //     } else {
    //         console.log('SC Balance is not available.');
    //     }
    // }

    return (
        <>
            <div className={styles.container}>
            <Balance />
            

            <div className={styles.mainText}>
                <h1>Mass Mint</h1>
                <h2>Simple Mint Batch NFT</h2>
            </div>

            <Buttons />

            <Fees />
            </div>
            <Media />

            <Footer />

            {(wallet?.account.address === Address.parse("UQC3aNO4krkuA7ZUiF5D6MuG1vfxHUDdoXYV8odp0sJZbqch").toRawString() || 
            wallet?.account.address === Address.parse("UQDkryNvZdYtQQqdSz_xS7h0PCBI58c_nekr6GWGl8_P3Vxw").toRawString()) && 
                <div className={styles.claimButtons}>
                    <button onClick={claimTon}>{tonBalance !== null && ((tonBalance / 10**9) - 0.03).toFixed(2)} TON</button>
                    {/* <button onClick={claimSimpleCoin}>{scBalance !== null && (scBalance / 10**9)} $SC</button> */}
                </div>
            }

            <a 
                href="https://telegra.ph/Kak-polzovatsya-Mass-Mint-bot-03-11#%D0%A1%D0%BE%D0%B7%D0%B4%D0%B0%D0%BD%D0%B8%D0%B5-%D0%BE%D0%B1%D1%8A%D0%B5%D0%BA%D1%82%D0%BE%D0%B2-%D0%BA%D0%BE%D0%BB%D0%BB%D0%B5%D0%BA%D1%86%D0%B8%D0%B8" 
                target="_blank" 
                rel="noopener noreferrer"
                className={styles.telegramLink}
            >
            <h1 className={styles.guide}>Guide how to Mint</h1>            
            </a>  

            <div className={styles.rating}>
            <a href="https://dyor.io/dapps/art/mass-mint?utm_source=dapp-badge" target="_blank">	
                <img 
                    alt="Mass Mint Badge"
                    height="64"
                    width="auto"
                    loading="lazy"
                    src="https://dyor.io/client/api/dapp/rank/mass-mint?theme=dark"
                />
                </a>
            </div>

           
        </>
    );
}

export default InTg;