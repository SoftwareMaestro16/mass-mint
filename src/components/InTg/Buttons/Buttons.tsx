import { useNavigate } from "react-router-dom";
import styles from "./Buttons.module.scss";

function Buttons() {
    const navigate = useNavigate();

    return (
        <div className={styles.buttons}>
            <button onClick={() => navigate("/mint_collection")}>Mint Collection</button>
            <button onClick={() => navigate("/mint_batch_nft")}>Mint Batch NFT</button>
        </div>
    );
}

export default Buttons;