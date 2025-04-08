import styles from "./Fees.module.scss";

function Fees() {

    return (
        <div className={styles.mintPrice}>
            <h1>Fees for Batch Mint</h1>
            <div className={styles.blocks}>
                <div className={styles.priceBlock}>
                    <img src="https://cache.tonapi.io/imgproxy/bc7sg6Xi4-cfUwK-er2CR-6CUnMql9nFQwMVU4IeYNA/rs:fill:200:200:1/g:no/aHR0cHM6Ly9jYWNoZS50b25hcGkuaW8vaW1ncHJveHkvU0Jxb19Jd2N0VUdSSjI4WkNIRHk1U21CcU8yS1R2aEc4VTFSb0k1SVpIay9yczpmaWxsOjIwMDoyMDA6MS9nOm5vL2FIUjBjSE02THk5MGIyNHViM0puTDJsamIyNXpMMk4xYzNSdmJTOTBiMjVmYkc5bmJ5NXpkbWMud2VicA.webp" alt="TON" />
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