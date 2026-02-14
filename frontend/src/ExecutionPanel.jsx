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
    writeContract({
      address: tokenAddress,
      abi: ERC20_ABI,
      functionName: 'transfer',
      args: [recipient, parseUnits(amount, 18)], // Assuming 18 decimals, adjust if USDC (6)
    });
  };

  // Dynamically link to Uniswap to Buy/Sell this specific token
  const uniswapBuyLink = `https://app.uniswap.org/#/swap?outputCurrency=${tokenAddress}`;
  const uniswapSellLink = `https://app.uniswap.org/#/swap?inputCurrency=${tokenAddress}&outputCurrency=ETH`;

  return (
    <div style={{ padding: '20px', border: '2px solid black', marginTop: '20px' }}>
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
              style={{ display: 'block', margin: '10px 0', padding: '8px', width: '300px' }}
              onChange={(e) => setRecipient(e.target.value)} 
            />
            <input 
              placeholder="Amount" 
              type="number" 
              style={{ display: 'block', margin: '10px 0', padding: '8px', width: '300px' }}
              onChange={(e) => setAmount(e.target.value)} 
            />
            <button onClick={handleTransfer} style={{ padding: '10px', background: 'black', color: 'white', cursor: 'pointer' }}>
              Send {tokenSymbol} On-Chain
            </button>
          </div>

          {/* Trade / Swap Linking Section */}
          <div style={{ marginTop: '30px', paddingTop: '20px', borderTop: '1px solid #ccc' }}>
             <h3>Market Actions</h3>
             <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                 <a href={uniswapBuyLink} target="_blank" rel="noreferrer">
                   <button style={{ padding: '10px 20px', background: '#3b82f6', color: 'white', border: 'none', cursor: 'pointer' }}>
                     Buy {tokenSymbol}
                   </button>
                 </a>
                 <a href={uniswapSellLink} target="_blank" rel="noreferrer">
                   <button style={{ padding: '10px 20px', background: '#ef4444', color: 'white', border: 'none', cursor: 'pointer' }}>
                     Emergency Swap (Sell)
                   </button>
                 </a>
             </div>
          </div>
        </>
      ) : (
        <p style={{ marginTop: '20px', color: 'gray' }}>Connect your wallet to enable transfers and trading.</p>
      )}
    </div>
  );
}