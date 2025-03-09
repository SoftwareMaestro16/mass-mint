import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import App from './Main/App';
import CollectionMint from './InTg/CollectionMint/CollectionMint';
import BatchMint from './InTg/BatchMint/BatchMint';

function AppRouter() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<App />} /> 
                <Route path="/mint_collection" element={<CollectionMint />} /> 
                <Route path="/mint_batch_nft" element={<BatchMint />} />           
            </Routes>
        </Router>
    );
};

export default AppRouter;