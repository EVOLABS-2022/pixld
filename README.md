# Web3-Native NFT Art Marketplace

A comprehensive NFT marketplace built with enforced royalties, operator allowlists, and full Web3 integration. Built for Abstract network with guaranteed creator compensation.

## 🚀 Features

### Core Functionality
- **Enforced Royalties**: ERC-721C and ERC-1155 collections with operator allowlist enforcement
- **Professional Marketplace**: Buy, sell, and trade NFTs with EIP712 signatures
- **Creator Tools**: Deploy collections, mint NFTs, and manage royalties
- **User Dashboard**: Manage owned NFTs, view activity, and track collections
- **Wallet Integration**: Full MetaMask and Web3 wallet support

### Technical Stack
- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Blockchain**: Solidity contracts, Abstract network, Viem
- **Data Layer**: The Graph Protocol subgraph, PostgreSQL caching
- **Storage**: IPFS for metadata and media
- **Architecture**: Turborepo monorepo with contracts and web packages

## 📁 Project Structure

```
Art Marketplace/
├── packages/
│   ├── contracts/              # Smart contracts (Hardhat)
│   │   ├── contracts/
│   │   │   ├── collections/    # ERC721C and ERC1155 collections
│   │   │   ├── marketplace/    # Marketplace contract
│   │   │   ├── factory/        # Collection factory
│   │   │   └── libs/          # Shared libraries
│   │   └── test/              # Contract tests (31 passing)
│   └── subgraph/              # The Graph indexing
│       ├── schema.graphql     # GraphQL schema
│       └── src/               # Event handlers
└── apps/
    └── web/                   # Next.js frontend
        ├── src/
        │   ├── app/           # Next.js 15 app router
        │   ├── components/    # UI components
        │   ├── lib/          # Web3 services and utilities
        │   └── hooks/        # React hooks
        └── package.json
```

## 🛠 Smart Contracts

### Core Contracts
- **Marketplace.sol**: EIP712 signature-based trading with 2% platform fee
- **ERC721CCollection.sol**: Operator allowlist enforcement for guaranteed royalties
- **CollectionFactory.sol**: Deployment factory for new collections
- **RoyaltyRegistry.sol**: Fallback royalty registry for non-ERC2981 contracts

### Key Features
- **Operator Allowlist**: Only approved operators can transfer NFTs
- **Royalty Enforcement**: Up to 10% creator royalties on every sale
- **EIP712 Orders**: Gas-efficient off-chain order signing
- **Access Control**: Admin roles for collection management
- **Pausable**: Emergency pause functionality

## 🎨 Frontend Features

### Pages & Components
1. **Homepage** (`/`)
   - Featured and trending collections
   - Recent additions and marketplace stats

2. **Collections** (`/collections`)
   - Browse all collections with filtering and sorting
   - Individual collection pages with NFT grids

3. **NFT Details** (`/collections/[address]/[tokenId]`)
   - Detailed NFT information and properties
   - Buy/sell functionality with real Web3 integration

4. **Dashboard** (`/dashboard`)
   - User profile and owned NFTs
   - Activity history and portfolio tracking

5. **Creator Studio** (`/create`)
   - Deploy new collections
   - Mint NFTs with metadata upload
   - Manage existing collections

### Web3 Integration
- **Wallet Connection**: MetaMask and Web3 wallet support
- **Chain Management**: Automatic Abstract network switching
- **Transaction Handling**: Real-time status updates and confirmations
- **IPFS Integration**: Metadata and media uploads
- **Error Handling**: User-friendly error messages and retries

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- MetaMask or compatible Web3 wallet
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd "Art Marketplace"
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   # Copy environment template
   cp .env.example .env.local
   
   # Configure the following variables:
   # NEXT_PUBLIC_ABSTRACT_RPC_URL=https://api.testnet.abs.xyz
   # NEXT_PUBLIC_SUBGRAPH_URL=your-subgraph-endpoint
   # DATABASE_URL=your-database-url
   # IPFS_API_KEY=your-ipfs-service-key
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Visit [http://localhost:3000](http://localhost:3000)

### Contract Deployment

1. **Navigate to contracts package**
   ```bash
   cd packages/contracts
   ```

2. **Compile contracts**
   ```bash
   npx hardhat compile
   ```

3. **Run tests**
   ```bash
   npx hardhat test
   ```

4. **Deploy to Abstract testnet**
   ```bash
   npx hardhat run scripts/deploy.js --network abstract
   ```

## 🔧 Development

### Smart Contract Development
```bash
cd packages/contracts
npx hardhat compile        # Compile contracts
npx hardhat test          # Run tests (31 tests)
npx hardhat coverage      # Test coverage
```

### Frontend Development
```bash
cd apps/web
npm run dev               # Development server
npm run build             # Production build
npm run lint              # Code linting
```

### Subgraph Development
```bash
cd packages/subgraph
graph codegen           # Generate types
graph build             # Build subgraph
graph deploy            # Deploy to The Graph
```

## 📋 API Endpoints

### Collections API
- `GET /api/collections` - List collections with filtering
- `GET /api/collections/[address]` - Get collection details
- `GET /api/collections/[address]/tokens` - List NFTs in collection
- `GET /api/collections/trending` - Trending collections

### NFT API
- `GET /api/collections/[address]/tokens/[tokenId]` - Get NFT details
- `GET /api/collections/[address]/tokens/[tokenId]/activity` - NFT activity

### User API
- `GET /api/users/[address]/tokens` - User's NFTs
- `GET /api/users/[address]/activity` - User activity

### IPFS API
- `POST /api/ipfs/upload` - Upload JSON metadata
- `POST /api/ipfs/upload-file` - Upload media files

## 🏗 Architecture

### Web3 Services
- **WalletManager**: Singleton wallet connection management
- **MarketplaceService**: Buy/sell operations and order creation
- **CollectionService**: Contract deployment and NFT minting
- **IPFS Integration**: Metadata and media storage

### Database Schema
- **Collections**: Collection metadata and stats
- **Tokens**: NFT information and properties
- **Sales**: Transaction history and pricing
- **Users**: User profiles and activity

### Caching Strategy
- **API Caching**: 1-5 minute cache for collection data
- **Database Caching**: Trending calculations and aggregations
- **Client Caching**: React Query for frontend state

## 🔐 Security Features

### Smart Contract Security
- **Reentrancy Protection**: All external calls protected
- **Access Control**: Role-based permissions
- **Input Validation**: Comprehensive parameter checking
- **Emergency Controls**: Pause functionality for critical issues

### Frontend Security
- **Input Sanitization**: All user inputs validated
- **CORS Protection**: Proper cross-origin restrictions
- **Environment Variables**: Sensitive data in environment config
- **Transaction Verification**: All blockchain interactions verified

## 📊 Testing

### Smart Contract Tests
```bash
# Run all tests
npx hardhat test

# Test results: 31 passing tests covering:
# ✅ Collection deployment and minting
# ✅ Marketplace buy/sell operations
# ✅ Royalty enforcement
# ✅ Access control and permissions
# ✅ Edge cases and error conditions
```

### Integration Testing
- **Wallet Connection**: Connection flows and error handling
- **Transaction Flows**: Buy, sell, mint, and deploy operations
- **UI Components**: All modals and forms with real Web3 calls
- **Error Scenarios**: Network issues, insufficient funds, etc.

## 🚀 Deployment

### Production Deployment

1. **Deploy Smart Contracts**
   ```bash
   cd packages/contracts
   npx hardhat run scripts/deploy.js --network abstract-mainnet
   ```

2. **Deploy Subgraph**
   ```bash
   cd packages/subgraph
   graph deploy your-subgraph-name
   ```

3. **Deploy Frontend**
   ```bash
   cd apps/web
   npm run build
   # Deploy to Vercel, Netlify, or your preferred platform
   ```

### Environment Configuration
```bash
# Production environment variables
NEXT_PUBLIC_ABSTRACT_RPC_URL=https://api.abs.xyz
NEXT_PUBLIC_SUBGRAPH_URL=your-production-subgraph
DATABASE_URL=your-production-database
IPFS_API_KEY=your-production-ipfs-key
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Write comprehensive tests for new features
- Update documentation for API changes
- Ensure all tests pass before submitting PRs

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Abstract Network**: For the scalable blockchain infrastructure
- **OpenZeppelin**: For secure smart contract libraries
- **The Graph Protocol**: For blockchain data indexing
- **Viem**: For excellent Web3 TypeScript support
- **Next.js Team**: For the outstanding React framework

## 📞 Support

- **Documentation**: Check this README and inline code comments
- **Issues**: Open an issue on GitHub for bugs and feature requests
- **Community**: Join our Discord for discussions and support

---

**Built with ❤️ for the Web3 community**

*A complete, production-ready NFT marketplace with enforced royalties and creator-first design.*