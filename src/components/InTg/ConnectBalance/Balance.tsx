import { TonConnectButton, useTonAddress } from "@tonconnect/ui-react";
import styles from "./Balance.module.scss";
import { useState, useEffect } from "react";
import { SIMPLE_COIN_ADDRESS } from "../../../utils/constants";

function Balance() {
    const [tonBalance, setTonBalance] = useState(0);
    const [scBalance, setScBalance] = useState(0);
    const userFriendlyAddress = useTonAddress();

    useEffect(() => {
        if (!userFriendlyAddress) {
            setTonBalance(0);
            setScBalance(0);
            return;
        }

        fetch(`https://tonapi.io/v2/accounts/${userFriendlyAddress}`)
            .then(res => res.json())
            .then(data => {
                const balance = data?.balance ? Number(data.balance) / 1e9 : 0;
                setTonBalance(balance);
            })
            .catch(() => setTonBalance(0));

        fetch(`https://tonapi.io/v2/accounts/${userFriendlyAddress}/jettons/${SIMPLE_COIN_ADDRESS}?currencies=ton,usd,rub&supported_extensions=custom_payload`)
            .then(res => res.json())
            .then(data => {
                const balance = data?.balance ? Number(data.balance) / 1e9 : 0;
                setScBalance(balance);
            })
            .catch(() => setScBalance(0));
    }, [userFriendlyAddress]);

    const formatBalance = (balance: number) => {
        if (balance < 0.0001) return "0.00";
        return new Intl.NumberFormat("en", {
            notation: balance >= 999 ? "compact" : "standard",
            maximumFractionDigits: 2,
        }).format(balance);
    };

    return (
        <div className={styles.header}>
            <div className={styles.blocks}>
                <div className={styles.balanceBlock}>
                <img src="https://cache.tonapi.io/imgproxy/bc7sg6Xi4-cfUwK-er2CR-6CUnMql9nFQwMVU4IeYNA/rs:fill:200:200:1/g:no/aHR0cHM6Ly9jYWNoZS50b25hcGkuaW8vaW1ncHJveHkvU0Jxb19Jd2N0VUdSSjI4WkNIRHk1U21CcU8yS1R2aEc4VTFSb0k1SVpIay9yczpmaWxsOjIwMDoyMDA6MS9nOm5vL2FIUjBjSE02THk5MGIyNHViM0puTDJsamIyNXpMMk4xYzNSdmJTOTBiMjVmYkc5bmJ5NXpkbWMud2VicA.webp" alt="TON" />
                <h2>{formatBalance(tonBalance)}</h2>
            </div>
            <div className={styles.balanceBlock}>
                <img src="https://simple-coin.xyz/sc.png" alt="Simple Coin" />
                <h2>{formatBalance(scBalance)}</h2>
            </div>
        </div>   
        <div className={styles.tcBtn}>
            <TonConnectButton />
        </div>
        </div>
    );
}

export default Balance;