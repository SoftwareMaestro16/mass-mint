import styles from "./InTg.module.scss";
import Balance from "./ConnectBalance/Balance";
import Fees from "./Fees/Fees";
import Buttons from "./Buttons/Buttons";
import Footer from "./Footer/Footer";
import Media from "./Media/Media";

function InTg() {

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
        </>
    );
}

export default InTg;