const { Connection, clusterApiUrl, PublicKey, LAMPORTS_PER_SOL } = require('@solana/web3.js');

// Default to mainnet
const SOLANA_RPC = process.env.SOLANA_RPC || clusterApiUrl('mainnet-beta');

class SolanaClient {
  constructor() {
    this.connection = new Connection(SOLANA_RPC, {
      commitment: 'confirmed',
      wsEndpoint: process.env.SOLANA_WS || undefined
    });
  }

  async getWalletBalance(address) {
    try {
      const pubkey = new PublicKey(address);
      const balance = await this.connection.getBalance(pubkey);
      return {
        success: true,
        balance: balance / LAMPORTS_PER_SOL,
        address: address
      };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  async getWalletTransactions(address, limit = 10) {
    try {
      const pubkey = new PublicKey(address);
      const signatures = await this.connection.getSignaturesForAddress(pubkey, { limit });
      
      const transactions = [];
      for (const sig of signatures) {
        const tx = await this.connection.getParsedTransaction(sig.signature, {
          maxSupportedTransactionVersion: 0
        });
        if (tx) {
          transactions.push({
            signature: sig.signature,
            slot: sig.slot,
            blockTime: sig.blockTime,
            success: !sig.err,
            parsed: tx.transaction.message.instructions[0]?.parsed || {}
          });
        }
      }
      return { success: true, transactions };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  async getTokenAccounts(address) {
    try {
      const pubkey = new PublicKey(address);
      const tokenAccounts = await this.connection.getParsedTokenAccountsByOwner(pubkey, {
        programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA')
      });

      const tokens = tokenAccounts.value.map(account => {
        const info = account.account.data.parsed.info;
        return {
          mint: info.mint,
          tokenAmount: info.tokenAmount.uiAmount,
          decimals: info.tokenAmount.decimals
        };
      });

      return { success: true, tokens };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  async getTokenInfo(mintAddress) {
    try {
      // Simple token metadata fetch (supply, decimals)
      const mintPubkey = new PublicKey(mintAddress);
      const mintInfo = await this.connection.getParsedAccountInfo(mintPubkey);
      
      if (!mintInfo.value) {
        return { success: false, error: 'Token not found' };
      }

      const data = mintInfo.value.data.parsed.info;
      return {
        success: true,
        mint: mintAddress,
        supply: data.supply / Math.pow(10, data.decimals),
        decimals: data.decimals,
        authority: data.mintAuthority,
        freezeAuthority: data.freezeAuthority
      };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  async getTokenHolders(mintAddress, limit = 20) {
    try {
      // This is simplified - in production you'd use a indexer or Jupiter API
      // For CLI demo, we return placeholder
      return {
        success: true,
        holders: [
          { address: 'unknown', balance: 0, percentage: 0 }
        ],
        note: 'Full holder analysis requires indexing service (e.g., Jupiter, Dune)'
      };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  async getPrice(tokenMint = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyD7bG') {
    // Default to USDC price in SOL via Jupiter or simple price feed
    try {
      // For demo: return placeholder - real implementation would call Jupiter API or price feed
      return {
        success: true,
        price: 1.0, // placeholder
        token: tokenMint,
        currency: 'USD',
        note: 'Price feed integration requires external API (Jupiter/Pyth)'
      };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  async comparePortfolios(wallets) {
    try {
      const results = [];
      let totalValue = 0;

      for (const address of wallets) {
        const [balance, tokens] = await Promise.all([
          this.getWalletBalance(address),
          this.getTokenAccounts(address)
        ]);

        const wallet = {
          address: address.substring(0, 8) + '...',
          fullAddress: address,
          solBalance: balance.success ? balance.balance : 0,
          tokens: tokens.success ? tokens.tokens : [],
          totalValue: 0 // calculate in real implementation
        };

        results.push(wallet);
      }

      return { success: true, wallets: results };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
}

module.exports = new SolanaClient();
