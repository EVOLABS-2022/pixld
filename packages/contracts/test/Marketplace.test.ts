import { expect } from "chai";
import { ethers } from "hardhat";
import { Marketplace, ERC721CCollection, OperatorAllowlistRegistry, RoyaltyRegistry } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("Marketplace", function () {
  let marketplace: Marketplace;
  let collection: ERC721CCollection;
  let operatorRegistry: OperatorAllowlistRegistry;
  let royaltyRegistry: RoyaltyRegistry;
  let owner: HardhatEthersSigner;
  let seller: HardhatEthersSigner;
  let buyer: HardhatEthersSigner;
  let treasury: HardhatEthersSigner;
  let royaltyReceiver: HardhatEthersSigner;

  beforeEach(async function () {
    [owner, seller, buyer, treasury, royaltyReceiver] = await ethers.getSigners();

    // Deploy OperatorAllowlistRegistry
    const OperatorRegistryFactory = await ethers.getContractFactory("OperatorAllowlistRegistry");
    operatorRegistry = await OperatorRegistryFactory.deploy(owner.address);

    // Deploy RoyaltyRegistry
    const RoyaltyRegistryFactory = await ethers.getContractFactory("RoyaltyRegistry");
    royaltyRegistry = await RoyaltyRegistryFactory.deploy(owner.address);

    // Deploy Marketplace
    const MarketplaceFactory = await ethers.getContractFactory("Marketplace");
    marketplace = await MarketplaceFactory.deploy(
      treasury.address,
      await royaltyRegistry.getAddress(),
      owner.address
    );

    // Deploy test collection
    const CollectionFactory = await ethers.getContractFactory("ERC721CCollection");
    collection = await CollectionFactory.deploy(
      "Test Collection",
      "TEST",
      seller.address,
      royaltyReceiver.address,
      250, // 2.5% royalty
      await operatorRegistry.getAddress(),
      "ipfs://contract-uri"
    );

    // Add marketplace to operator allowlist
    await operatorRegistry.connect(owner).setOperator(
      await collection.getAddress(), 
      await marketplace.getAddress(), 
      true
    );

    // Mint token to seller
    await collection.connect(seller).mintTo(seller.address, "ipfs://token1");
    
    // Approve marketplace to transfer token
    await collection.connect(seller).setApprovalForAll(await marketplace.getAddress(), true);
  });

  describe("Deployment", function () {
    it("Should set correct treasury and platform fee", async function () {
      expect(await marketplace.treasury()).to.equal(treasury.address);
      expect(await marketplace.platformFeeBps()).to.equal(200); // 2%
    });

    it("Should allow native currency by default", async function () {
      expect(await marketplace.currencyAllowed(ethers.ZeroAddress)).to.be.true;
    });
  });

  describe("Order Creation and Filling", function () {
    it("Should fill a valid order", async function () {
      const price = ethers.parseEther("1");
      const nonce = 1;
      
      // Create ask order
      const ask = {
        maker: seller.address,
        collection: await collection.getAddress(),
        tokenId: 1,
        quantity: 1,
        currency: ethers.ZeroAddress,
        price: price,
        start: 0,
        end: 0,
        salt: 123,
        nonce: nonce,
        standard: 0, // ERC721
        strategy: 0  // FIXED_PRICE
      };

      // Sign the order
      const domain = {
        name: "ArtMarket",
        version: "1",
        chainId: (await ethers.provider.getNetwork()).chainId,
        verifyingContract: await marketplace.getAddress()
      };

      const types = {
        Ask: [
          { name: "maker", type: "address" },
          { name: "collection", type: "address" },
          { name: "tokenId", type: "uint256" },
          { name: "quantity", type: "uint256" },
          { name: "currency", type: "address" },
          { name: "price", type: "uint256" },
          { name: "start", type: "uint64" },
          { name: "end", type: "uint64" },
          { name: "salt", type: "uint256" },
          { name: "nonce", type: "uint256" },
          { name: "standard", type: "uint8" },
          { name: "strategy", type: "uint8" }
        ]
      };

      const signature = await seller.signTypedData(domain, types, ask);

      // Fill the order
      const initialBuyerBalance = await ethers.provider.getBalance(buyer.address);
      
      await expect(marketplace.connect(buyer).fill(ask, signature, 1, { value: price }))
        .to.emit(marketplace, "OrderFilled");

      // Check token ownership transferred
      expect(await collection.ownerOf(1)).to.equal(buyer.address);
      
      // Check nonce is used
      expect(await marketplace.nonceUsed(seller.address, nonce)).to.be.true;
    });

    it("Should calculate fees correctly", async function () {
      const price = ethers.parseEther("10"); // 10 ETH
      const nonce = 2;
      
      const ask = {
        maker: seller.address,
        collection: await collection.getAddress(),
        tokenId: 1,
        quantity: 1,
        currency: ethers.ZeroAddress,
        price: price,
        start: 0,
        end: 0,
        salt: 123,
        nonce: nonce,
        standard: 0,
        strategy: 0
      };

      const domain = {
        name: "ArtMarket",
        version: "1",
        chainId: (await ethers.provider.getNetwork()).chainId,
        verifyingContract: await marketplace.getAddress()
      };

      const types = {
        Ask: [
          { name: "maker", type: "address" },
          { name: "collection", type: "address" },
          { name: "tokenId", type: "uint256" },
          { name: "quantity", type: "uint256" },
          { name: "currency", type: "address" },
          { name: "price", type: "uint256" },
          { name: "start", type: "uint64" },
          { name: "end", type: "uint64" },
          { name: "salt", type: "uint256" },
          { name: "nonce", type: "uint256" },
          { name: "standard", type: "uint8" },
          { name: "strategy", type: "uint8" }
        ]
      };

      const signature = await seller.signTypedData(domain, types, ask);

      const initialSellerBalance = await ethers.provider.getBalance(seller.address);
      const initialTreasuryBalance = await ethers.provider.getBalance(treasury.address);
      const initialRoyaltyBalance = await ethers.provider.getBalance(royaltyReceiver.address);

      await marketplace.connect(buyer).fill(ask, signature, 1, { value: price });

      const finalSellerBalance = await ethers.provider.getBalance(seller.address);
      const finalTreasuryBalance = await ethers.provider.getBalance(treasury.address);
      const finalRoyaltyBalance = await ethers.provider.getBalance(royaltyReceiver.address);

      // Platform fee: 2% of 10 ETH = 0.2 ETH
      const expectedPlatformFee = price * 200n / 10000n;
      // Royalty: 2.5% of 10 ETH = 0.25 ETH
      const expectedRoyalty = price * 250n / 10000n;
      // Seller proceeds: 10 - 0.2 - 0.25 = 9.55 ETH
      const expectedSellerProceeds = price - expectedPlatformFee - expectedRoyalty;

      expect(finalTreasuryBalance - initialTreasuryBalance).to.equal(expectedPlatformFee);
      expect(finalRoyaltyBalance - initialRoyaltyBalance).to.equal(expectedRoyalty);
      expect(finalSellerBalance - initialSellerBalance).to.equal(expectedSellerProceeds);
    });

    it("Should reject invalid signatures", async function () {
      const price = ethers.parseEther("1");
      
      const ask = {
        maker: seller.address,
        collection: await collection.getAddress(),
        tokenId: 1,
        quantity: 1,
        currency: ethers.ZeroAddress,
        price: price,
        start: 0,
        end: 0,
        salt: 123,
        nonce: 3,
        standard: 0,
        strategy: 0
      };

      // Sign with wrong signer
      const domain = {
        name: "ArtMarket",
        version: "1",
        chainId: (await ethers.provider.getNetwork()).chainId,
        verifyingContract: await marketplace.getAddress()
      };

      const types = {
        Ask: [
          { name: "maker", type: "address" },
          { name: "collection", type: "address" },
          { name: "tokenId", type: "uint256" },
          { name: "quantity", type: "uint256" },
          { name: "currency", type: "address" },
          { name: "price", type: "uint256" },
          { name: "start", type: "uint64" },
          { name: "end", type: "uint64" },
          { name: "salt", type: "uint256" },
          { name: "nonce", type: "uint256" },
          { name: "standard", type: "uint8" },
          { name: "strategy", type: "uint8" }
        ]
      };

      const signature = await buyer.signTypedData(domain, types, ask); // Wrong signer

      await expect(marketplace.connect(buyer).fill(ask, signature, 1, { value: price }))
        .to.be.revertedWithCustomError(marketplace, "InvalidSignature");
    });

    it("Should reject used nonces", async function () {
      const price = ethers.parseEther("1");
      const nonce = 4;
      
      const ask = {
        maker: seller.address,
        collection: await collection.getAddress(),
        tokenId: 1,
        quantity: 1,
        currency: ethers.ZeroAddress,
        price: price,
        start: 0,
        end: 0,
        salt: 123,
        nonce: nonce,
        standard: 0,
        strategy: 0
      };

      const domain = {
        name: "ArtMarket",
        version: "1",
        chainId: (await ethers.provider.getNetwork()).chainId,
        verifyingContract: await marketplace.getAddress()
      };

      const types = {
        Ask: [
          { name: "maker", type: "address" },
          { name: "collection", type: "address" },
          { name: "tokenId", type: "uint256" },
          { name: "quantity", type: "uint256" },
          { name: "currency", type: "address" },
          { name: "price", type: "uint256" },
          { name: "start", type: "uint64" },
          { name: "end", type: "uint64" },
          { name: "salt", type: "uint256" },
          { name: "nonce", type: "uint256" },
          { name: "standard", type: "uint8" },
          { name: "strategy", type: "uint8" }
        ]
      };

      const signature = await seller.signTypedData(domain, types, ask);

      // Fill order first time
      await marketplace.connect(buyer).fill(ask, signature, 1, { value: price });

      // Try to fill again with same nonce
      await expect(marketplace.connect(buyer).fill(ask, signature, 1, { value: price }))
        .to.be.revertedWithCustomError(marketplace, "NonceUsed");
    });
  });

  describe("Admin Functions", function () {
    it("Should allow owner to update platform fee", async function () {
      await marketplace.connect(owner).setPlatformFeeBps(300); // 3%
      expect(await marketplace.platformFeeBps()).to.equal(300);
    });

    it("Should not allow setting platform fee too high", async function () {
      await expect(marketplace.connect(owner).setPlatformFeeBps(1001)) // >10%
        .to.be.revertedWith("fee too high");
    });

    it("Should allow owner to update treasury", async function () {
      await marketplace.connect(owner).setTreasury(buyer.address);
      expect(await marketplace.treasury()).to.equal(buyer.address);
    });
  });
});