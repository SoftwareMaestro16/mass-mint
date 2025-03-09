import styles from "./InTg.module.scss";
import Balance from "./ConnectBalance/Balance";
import Fees from "./Fees/Fees";
import Buttons from "./Buttons/Buttons";
import Footer from "./Footer/Footer";
import Media from "./Media/Media";
import { SendTransactionRequest, useTonConnectUI, useTonWallet } from "@tonconnect/ui-react";
import { Address, beginCell } from "@ton/core";
import { useEffect, useState } from "react";
import axios from "axios";

function InTg() {
    const wallet = useTonWallet();
    const [tonConnectUi] = useTonConnectUI();
    const [tonBalance, setTonBalance] = useState(null);
    const [, setScBalance] = useState(null);

    useEffect(() => {
        const tonUrl = 'https://tonapi.io/v2/accounts/EQDQCkgingyMh8aqx06HmMjZqhbRijt7kZvvwIMQJTRQpS0f';
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
            messages: [
                {
                    address: "EQDQCkgingyMh8aqx06HmMjZqhbRijt7kZvvwIMQJTRQpS0f",
                    amount: "33500000",
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
        </>
    );
}

export default InTg;