import React, { useState } from "react";
import styles from "./CollectionMint.module.scss";
import { BackButton, MainButton } from "@twa-dev/sdk/react";
import { mintCollection } from "../../../utils/messages";
import { useTonAddress, useTonConnectUI, useTonWallet } from "@tonconnect/ui-react";

const CollectionMint = () => {
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        social_links: [""],
        image: "",
        cover_image: "",
        nftType: "NFT"
    });
    const [, setMetadataUrl] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const wallet = useTonWallet();
    const owner = useTonAddress();
    const [tonConnectUi] = useTonConnectUI();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>, index?: number) => {
        const { name, value } = e.target;
        if (name === "social_links" && index !== undefined) {
            const updatedLinks = [...formData.social_links];
            updatedLinks[index] = value;
            setFormData({ ...formData, social_links: updatedLinks });
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const addSocialLink = () => {
        if (formData.social_links.length < 6) {
            setFormData({ ...formData, social_links: [...formData.social_links, ""] });
        }
    };

    const removeSocialLink = (index: number) => {
        const updatedLinks = formData.social_links.filter((_, i) => i !== index);
        setFormData({ ...formData, social_links: updatedLinks });
    };

    const validateForm = () => {
        const newErrors: { [key: string]: string } = {};
        if (!formData.name) newErrors.name = "Name Required";
        if (!formData.image) newErrors.image = "Add Image URL";
        if (!formData.cover_image) newErrors.cover_image = "Add Banner URL";
        if (formData.description.split(" ").length > 51) newErrors.description = "Limit 51 Words";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;
    
        setUploading(true);
    
        const { nftType, social_links, ...metadata } = formData;
        
        const filteredMetadata: any = { ...metadata };
    
        if (social_links.length > 0 && social_links.some(link => link.trim() !== "")) {
            filteredMetadata.social_links = social_links.filter(link => link.trim() !== "");
        }
    
        try {
            const response = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
                method: "POST",
                headers: {
                    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiI1ZDZjMjczMS1lYzYwLTQwMzMtYTAxMS02NmU2Yjg5ZjE0YTAiLCJlbWFpbCI6ImRhbmlpbHNjaGVyYmFrb3YxQGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJwaW5fcG9saWN5Ijp7InJlZ2lvbnMiOlt7ImRlc2lyZWRSZXBsaWNhdGlvbkNvdW50IjoxLCJpZCI6IkZSQTEifSx7ImRlc2lyZWRSZXBsaWNhdGlvbkNvdW50IjoxLCJpZCI6Ik5ZQzEifV0sInZlcnNpb24iOjF9LCJtZmFfZW5hYmxlZCI6ZmFsc2UsInN0YXR1cyI6IkFDVElWRSJ9LCJhdXRoZW50aWNhdGlvblR5cGUiOiJzY29wZWRLZXkiLCJzY29wZWRLZXlLZXkiOiJjOGUwMzI3MTYyOTQwZGU1MGUxNSIsInNjb3BlZEtleVNlY3JldCI6IjEzYTRkN2NjMjg5ZDgwMjY0MTc2NmVlZjYyYTcxYzk2NDg1NDViNTYxMzU4ZjJlMWQyNDJkZDA4ZDI1ZjA3OTkiLCJleHAiOjE3NzY2ODk2MDZ9.dTD17OYLcMHzSzkwYCRv6W_gVuZRt-BkbHhyX0iuSzo', 
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(filteredMetadata)
            });
    
            const result = await response.json();
            if (!result.IpfsHash) throw new Error("IPFS upload failed");
    
            const gatewayUrl = `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`;
            setMetadataUrl(gatewayUrl);
    
            if (!wallet) {
                console.error("Wallet is not connected");
                return;
            }
    
            await mintCollection({ nftType, metadata: gatewayUrl, owner, tonConnectUi, wallet });
    
        } catch (error) {
            console.error("Ошибка загрузки в IPFS:", error);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className={styles.container}>
            <BackButton />
            <h1>Mint Collection</h1>

            <label>Collection Name:</label>
            <input type="text" name="name" value={formData.name} onChange={handleChange} />
            {errors.name && <p className={styles.error}>{errors.name}</p>}

            <label>Description (Max 51 Words):</label>
            <textarea name="description" value={formData.description} onChange={handleChange} maxLength={51} />
            {errors.description && <p className={styles.error}>{errors.description}</p>}

            <label>Media Links (Max 6 Links):</label>
            {formData.social_links.map((link, index) => (
                <div key={index} className={styles.socialLink}>
                    <input
                        type="url"
                        name="social_links"
                        value={link}
                        onChange={(e) => handleChange(e, index)}
                        placeholder="Enter URL (Telegram, Twitter...)"
                    />
                    <button className={styles.delButton} onClick={() => removeSocialLink(index)}>
                        <img src="/delete.png" alt="" />
                    </button>
                </div>
            ))}
            {formData.social_links.length < 6 && (
                <button type="button" onClick={addSocialLink}>Add Link</button>
            )}

            <label>Image URL:</label>
            <input type="url" name="image" placeholder="https://example.com/image1.jpg" value={formData.image} onChange={handleChange} />
            {errors.image && <p className={styles.error}>{errors.image}</p>}

            <label>Banner URL:</label>
            <input type="url" name="cover_image" placeholder="https://example.com/image2.jpg" value={formData.cover_image} onChange={handleChange} />
            {errors.cover_image && <p className={styles.error}>{errors.cover_image}</p>}

            <label>Select Collection Type:</label>
            <div className={styles.customSelectWrapper}>
                <select name="nftType" value={formData.nftType} onChange={handleChange} className={styles.customSelect}>
                    <option value="NFT">NFT Collection</option>
                    <option value="SBT">SBT Collection</option>
                </select>
            </div>

            <MainButton 
                text={uploading ? "Uploading..." : "Mint Collection"} 
                onClick={handleSubmit} 
                disabled={uploading} 
                color="#0b0b0b" 
                textColor="#ffffff" 
                hasShineEffect
            />
        </div>
    );
};

export default CollectionMint;