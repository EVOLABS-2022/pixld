# 🚀 NFT Art Marketplace - Production Deployment Guide

## ✅ Pre-Deployment Checklist

### 1. Smart Contract Deployment
- [ ] **Install Hardhat dependencies**
  ```bash
  cd packages/contracts
  npm install
  ```

- [ ] **Configure Abstract network in hardhat.config.js**
  ```javascript
  networks: {
    abstract: {
      url: "https://api.testnet.abs.xyz",
      chainId: 11124,
      accounts: [process.env.PRIVATE_KEY]
    }
  }
  ```

- [ ] **Deploy contracts to Abstract testnet**
  ```bash
  cd packages/contracts
  npx hardhat run scripts/deploy.js --network abstract
  ```

- [ ] **Save deployed contract addresses**
  - Copy addresses from deployment output
  - Update addresses in apps/web/.env.local
  - Update apps/web/src/lib/contracts.ts

### 2. Database Setup
- [ ] **Set up PostgreSQL database** (recommended: Supabase, Railway, or AWS RDS)
- [ ] **Update DATABASE_URL** in environment variables
- [ ] **Generate Prisma client and run migrations**
  ```bash
  cd apps/web
  npx prisma generate
  npx prisma db push
  ```

### 3. External Service Configuration

#### IPFS Storage (Web3.Storage or Pinata)
- [ ] **Web3.Storage**: Get API token from https://web3.storage/
- [ ] **OR Pinata**: Get API key from https://pinata.cloud/
- [ ] Update `WEB3_STORAGE_TOKEN` in environment variables

#### The Graph Subgraph
- [ ] **Update subgraph/subgraph.yaml** with deployed contract addresses
- [ ] **Deploy subgraph**
  ```bash
  cd packages/subgraph
  graph auth --product hosted-service <ACCESS_TOKEN>
  graph deploy --product hosted-service <USERNAME>/art-marketplace
  ```
- [ ] Update `NEXT_PUBLIC_SUBGRAPH_URL` in environment

#### WalletConnect
- [ ] Get project ID from https://cloud.walletconnect.com/
- [ ] Update `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`

### 4. Frontend Deployment

#### Environment Variables
Update the following in your hosting platform:
```env
# Blockchain
NEXT_PUBLIC_ABSTRACT_RPC_URL=https://api.testnet.abs.xyz
NEXT_PUBLIC_CHAIN_ID=11124
NEXT_PUBLIC_MARKETPLACE_ADDRESS=<DEPLOYED_ADDRESS>
NEXT_PUBLIC_COLLECTION_FACTORY_ADDRESS=<DEPLOYED_ADDRESS>
NEXT_PUBLIC_ROYALTY_REGISTRY_ADDRESS=<DEPLOYED_ADDRESS>
NEXT_PUBLIC_OPERATOR_ALLOWLIST_ADDRESS=<DEPLOYED_ADDRESS>

# Database
DATABASE_URL=<PRODUCTION_DATABASE_URL>

# External Services
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=<YOUR_PROJECT_ID>
WEB3_STORAGE_TOKEN=<YOUR_TOKEN>
NEXT_PUBLIC_SUBGRAPH_URL=<YOUR_SUBGRAPH_URL>

# App Config
NEXT_PUBLIC_APP_NAME="Art Marketplace"
NEXT_PUBLIC_APP_URL=<YOUR_DOMAIN>
NEXT_PUBLIC_IPFS_GATEWAY=https://ipfs.io/ipfs/
NEXTAUTH_SECRET=<SECURE_RANDOM_STRING>
NEXTAUTH_URL=<YOUR_DOMAIN>
NODE_ENV=production
```

#### Deploy to Vercel
- [ ] **Connect GitHub repository** to Vercel
- [ ] **Set environment variables** in Vercel dashboard
- [ ] **Deploy from main branch**

#### Alternative: Deploy to Netlify
- [ ] **Build the application**
  ```bash
  cd apps/web
  npm run build
  ```
- [ ] **Upload build files** to Netlify
- [ ] **Configure environment variables**

## 🧪 Testing Checklist

### Smart Contract Verification
- [ ] **Run all tests**
  ```bash
  cd packages/contracts
  npx hardhat test
  ```
- [ ] **Verify contracts** on Abstract explorer (if available)

### Frontend Integration Testing
- [ ] **Test wallet connection** (MetaMask, WalletConnect)
- [ ] **Test collection creation** with real contracts
- [ ] **Test NFT minting** with IPFS upload
- [ ] **Test marketplace buy/sell** flow
- [ ] **Verify transaction confirmations** and UI updates

### API Testing
- [ ] **Test database connections**
- [ ] **Verify subgraph data** syncing
- [ ] **Test caching** and performance
- [ ] **Check error handling** and logging

## 🔧 Production Configuration

### Contract Configuration
After deployment, configure the contracts:
```bash
# Allow marketplace as operator (run from deployer account)
cast send $OPERATOR_ALLOWLIST "setOperatorAllowed(address,bool)" $MARKETPLACE true --rpc-url $ABSTRACT_RPC --private-key $PRIVATE_KEY

# Set platform fee (2% = 200 basis points)
cast send $MARKETPLACE "setPlatformFeeBps(uint96)" 200 --rpc-url $ABSTRACT_RPC --private-key $PRIVATE_KEY

# Allow common ERC20 tokens if needed
cast send $MARKETPLACE "setCurrencyAllowed(address,bool)" $USDC_ADDRESS true --rpc-url $ABSTRACT_RPC --private-key $PRIVATE_KEY
```

### Monitoring Setup
- [ ] **Set up error tracking** (Sentry)
- [ ] **Configure analytics** (Google Analytics, PostHog)
- [ ] **Set up uptime monitoring**
- [ ] **Database performance monitoring**

## 🔐 Security Checklist

### Smart Contracts
- [x] ✅ Reentrancy protection implemented
- [x] ✅ Access control with roles
- [x] ✅ Input validation and bounds checking
- [x] ✅ Emergency pause functionality
- [x] ✅ Comprehensive test coverage (31/31 tests passing)

### Frontend Security
- [ ] **Environment variables** properly secured
- [ ] **API routes** have proper validation
- [ ] **User inputs** are sanitized
- [ ] **HTTPS** enabled on production domain
- [ ] **CSP headers** configured

### Database Security
- [ ] **Connection encryption** enabled
- [ ] **Access controls** properly configured
- [ ] **Backup strategy** in place
- [ ] **Monitoring** for suspicious activity

## 📊 Performance Optimization

### Database Performance
- [ ] **Index optimization** for queries
- [ ] **Connection pooling** configured
- [ ] **Caching layer** active (Redis recommended)
- [ ] **Query performance** monitoring

### Frontend Performance  
- [ ] **Image optimization** enabled
- [ ] **Bundle size** optimized
- [ ] **CDN** configured for static assets
- [ ] **Lighthouse score** > 90

## 🚀 Go-Live Steps

### Final Pre-Launch
1. [ ] **Deploy contracts** to Abstract mainnet
2. [ ] **Update all environment** variables to mainnet
3. [ ] **Run full integration** test suite
4. [ ] **Performance testing** under load
5. [ ] **Security audit** (if budget allows)

### Launch Day
1. [ ] **Deploy frontend** to production
2. [ ] **Monitor error** logs and metrics
3. [ ] **Test all critical** user flows
4. [ ] **Announce launch** to community
5. [ ] **Monitor gas** fees and transaction success rates

### Post-Launch
1. [ ] **User feedback** collection
2. [ ] **Performance monitoring** 
3. [ ] **Bug fixes** and improvements
4. [ ] **Feature expansion** planning

## 🆘 Troubleshooting

### Common Issues

**Contract deployment fails:**
- Check Abstract RPC URL and chain ID
- Verify private key has sufficient ETH
- Ensure contract compilation succeeds

**Database connection fails:**
- Verify DATABASE_URL format and credentials
- Check network connectivity from hosting platform
- Ensure Prisma client is generated

**IPFS uploads fail:**
- Verify Web3.Storage token is valid
- Check file size limits
- Ensure proper content type headers

**Subgraph not syncing:**
- Verify contract addresses in subgraph.yaml
- Check deployment logs for errors
- Ensure contracts are verified on explorer

## 📞 Support Resources

- **Abstract Network Docs**: https://docs.abs.xyz/
- **The Graph Docs**: https://thegraph.com/docs/
- **Hardhat Docs**: https://hardhat.org/docs/
- **Next.js Docs**: https://nextjs.org/docs
- **Prisma Docs**: https://www.prisma.io/docs/

---

**Ready to launch the future of creator-first NFT marketplaces! 🎨✨**