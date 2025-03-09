import styles from "./Fees.module.scss";

function Fees() {

    return (
        <div className={styles.mintPrice}>
            <h1>Fees for Batch Mint</h1>
            <div className={styles.blocks}>
                <div className={styles.priceBlock}>
                    <img src="https://cryptologos.cc/logos/toncoin-ton-logo.png" alt="TON" />
                    <h2>0.01 Per NFT</h2>
                </div>
                <div className={styles.priceBlock}>
                    <img src="https://simple-coin.xyz/sc.png" alt="Simple Coin" />
                    <h2>100 Per NFT</h2>
                </div>
            </div>
        </div>
    );
}

export default Fees;