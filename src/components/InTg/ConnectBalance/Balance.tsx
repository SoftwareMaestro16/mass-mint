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
                <img src="https://cryptologos.cc/logos/toncoin-ton-logo.png" alt="TON" />
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