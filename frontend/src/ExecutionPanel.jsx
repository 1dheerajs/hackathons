import { useAccount, useWriteContract } from 'wagmi';
import { parseUnits } from 'viem';
import { useState } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';

// A minimal ABI just for transferring tokens
const ERC20_ABI = [
  { type: 'function', name: 'transfer', inputs: [{ name: 'to', type: 'address' }, { name: 'value', type: 'uint256' }], outputs: [{ type: 'bool' }], stateMutability: 'nonpayable' }
];

export default function ExecutionPanel({ tokenAddress, tokenSymbol }) {
  const { address } = useAccount();
  const { writeContract } = useWriteContract();
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');

  const handleTransfer = () => {
    if (!recipient || !/^0x[a-fA-F0-9]{40}$/.test(recipient)) {
      alert("Invalid recipient address.");
      return;
    }
    if (!amount || amount <= 0) {
      alert("Please enter a valid amount.");
      return;
    }
    
    // USDC and USDT use 6 decimals on EVM, most others use 18
    const decimals = (tokenSymbol.includes('USDC') || tokenSymbol.includes('USDT')) ? 6 : 18;
    
    writeContract({
      address: tokenAddress,
      abi: ERC20_ABI,
      functionName: 'transfer',
      args: [recipient, parseUnits(amount, decimals)],
    });
  };

  // Dynamically link to Uniswap to Buy/Sell this specific token
  const uniswapBuyLink = `https://app.uniswap.org/#/swap?outputCurrency=${tokenAddress}`;
  const uniswapSellLink = `https://app.uniswap.org/#/swap?inputCurrency=${tokenAddress}&outputCurrency=ETH`;

  return (
    <div style={{ padding: '20px', border: '1px solid #333', backgroundColor: '#1a1a1a', borderRadius: '8px', marginTop: '20px', color: '#fff' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <h2>Execute: {tokenSymbol}</h2>
        <ConnectButton />
      </div>

      {address ? (
        <>
          {/* Transfer Section */}
          <div style={{ marginTop: '20px' }}>
            <h3>Transfer {tokenSymbol}</h3>
            <input 
              placeholder="Recipient (0x...)" 
              style={{ display: 'block', margin: '10px 0', padding: '8px', width: '300px', backgroundColor: '#222', color: '#fff', border: '1px solid #444', borderRadius: '4px' }}
              onChange={(e) => setRecipient(e.target.value)} 
            />
            <input 
              placeholder="Amount" 
              type="number" 
              style={{ display: 'block', margin: '10px 0', padding: '8px', width: '300px', backgroundColor: '#222', color: '#fff', border: '1px solid #444', borderRadius: '4px' }}
              onChange={(e) => setAmount(e.target.value)} 
            />
            <button onClick={handleTransfer} style={{ padding: '10px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
              Send {tokenSymbol} On-Chain
            </button>
          </div>

          {/* Trade / Swap Linking Section */}
          <div style={{ marginTop: '30px', paddingTop: '20px', borderTop: '1px solid #333' }}>
             <h3>Market Actions</h3>
             <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                 <button onClick={() => window.open(uniswapBuyLink, '_blank')} style={{ padding: '10px 20px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                   Buy {tokenSymbol}
                 </button>
                 <button onClick={() => window.open(uniswapSellLink, '_blank')} style={{ padding: '10px 20px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                   Emergency Swap (Sell)
                 </button>
             </div>
          </div>
        </>
      ) : (
        <p style={{ marginTop: '20px', color: 'gray' }}>Connect your wallet to enable transfers and trading.</p>
      )}
    </div>
  );
}