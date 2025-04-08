import styles from "./Fees.module.scss";

function Fees() {

    return (
        <div className={styles.mintPrice}>
            <h1>Fees for Batch Mint</h1>
            <div className={styles.blocks}>
                <div className={styles.priceBlock}>
                    <img src="https://www.google.com/url?sa=i&url=https%3A%2F%2Fcryptologos.cc%2Ftoncoin&psig=AOvVaw2RIwjFvP9Ukj9ZeBFUkQJY&ust=1744227217520000&source=images&cd=vfe&opi=89978449&ved=0CBQQjRxqFwoTCODFt--WyYwDFQAAAAAdAAAAABAZ" alt="TON" />
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