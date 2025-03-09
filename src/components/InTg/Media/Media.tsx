import styles from "./Media.module.scss";

function Media() {
    return (
        <div className={styles.mediaContainer}>
            <div className={styles.images}>
                <a href="https://t.me/just_a_simple_coin" target="_blank" rel="noopener noreferrer">
                    <img src="/telegram.png" alt="Telegram" />
                </a>
                <a href="https://dedust.io/swap/TON/EQB9QBqniFI0jOmw3PU6v1v4LU3Sivm9yPXDDB9Qf7cXTDft" target="_blank" rel="noopener noreferrer">
                    <img src="/dedust.png" alt="Dedust" />
                </a>
                <a href="https://www.geckoterminal.com/ru/ton/pools/EQCfCyLLCOq_bw_Ge1C1pMlSo7dqFUVSsmNKP4osxoxTxCZo" target="_blank" rel="noopener noreferrer">
                    <img src="/geckoterminal.png" alt="GeckoTerminal" />
                </a>
            </div>
        </div>
    );
}

export default Media;