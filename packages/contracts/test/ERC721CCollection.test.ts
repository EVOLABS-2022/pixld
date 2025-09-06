import { expect } from "chai";
import { ethers } from "hardhat";
import { ERC721CCollection, OperatorAllowlistRegistry } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("ERC721CCollection", function () {
  let collection: ERC721CCollection;
  let operatorRegistry: OperatorAllowlistRegistry;
  let admin: HardhatEthersSigner;
  let user: HardhatEthersSigner;
  let operator: HardhatEthersSigner;
  let royaltyReceiver: HardhatEthersSigner;

  beforeEach(async function () {
    [admin, user, operator, royaltyReceiver] = await ethers.getSigners();

    // Deploy OperatorAllowlistRegistry
    const OperatorRegistryFactory = await ethers.getContractFactory("OperatorAllowlistRegistry");
    operatorRegistry = await OperatorRegistryFactory.deploy(admin.address);

    // Deploy ERC721CCollection
    const CollectionFactory = await ethers.getContractFactory("ERC721CCollection");
    collection = await CollectionFactory.deploy(
      "Test Collection",
      "TEST",
      admin.address,
      royaltyReceiver.address,
      250, // 2.5% royalty
      await operatorRegistry.getAddress(),
      "ipfs://contract-uri"
    );
  });

  describe("Deployment", function () {
    it("Should set the correct name and symbol", async function () {
      expect(await collection.name()).to.equal("Test Collection");
      expect(await collection.symbol()).to.equal("TEST");
    });

    it("Should set the correct admin", async function () {
      const ADMIN_ROLE = await collection.ADMIN_ROLE();
      expect(await collection.hasRole(ADMIN_ROLE, admin.address)).to.be.true;
    });

    it("Should set the correct royalty info", async function () {
      const [receiver, royalty] = await collection.royaltyInfo(1, 10000);
      expect(receiver).to.equal(royaltyReceiver.address);
      expect(royalty).to.equal(250); // 2.5% of 10000
    });
  });

  describe("Minting", function () {
    it("Should allow admin to mint", async function () {
      await expect(collection.connect(admin).mintTo(user.address, "ipfs://token1"))
        .to.emit(collection, "Transfer")
        .withArgs(ethers.ZeroAddress, user.address, 1);

      expect(await collection.ownerOf(1)).to.equal(user.address);
      expect(await collection.tokenURI(1)).to.equal("ipfs://token1");
    });

    it("Should not allow non-admin to mint", async function () {
      await expect(collection.connect(user).mintTo(user.address, "ipfs://token1"))
        .to.be.revertedWithCustomError(collection, "NotAuthorized");
    });

    it("Should allow batch minting", async function () {
      const tokenURIs = ["ipfs://token1", "ipfs://token2", "ipfs://token3"];
      
      await collection.connect(admin).batchMintTo(user.address, tokenURIs);

      expect(await collection.ownerOf(1)).to.equal(user.address);
      expect(await collection.ownerOf(2)).to.equal(user.address);
      expect(await collection.ownerOf(3)).to.equal(user.address);
    });
  });

  describe("Operator Allowlist Enforcement", function () {
    beforeEach(async function () {
      // Mint a token to user
      await collection.connect(admin).mintTo(user.address, "ipfs://token1");
    });

    it("Should allow owner to transfer directly", async function () {
      await expect(collection.connect(user).transferFrom(user.address, admin.address, 1))
        .to.emit(collection, "Transfer")
        .withArgs(user.address, admin.address, 1);
    });

    it("Should not allow approval to non-allowlisted operator", async function () {
      // User should not be able to approve non-allowlisted operator
      await expect(collection.connect(user).approve(operator.address, 1))
        .to.be.revertedWithCustomError(collection, "OperatorNotAllowed");
    });

    it("Should allow allowlisted operator to transfer", async function () {
      // Add operator to allowlist
      await operatorRegistry.connect(admin).setOperator(await collection.getAddress(), operator.address, true);
      
      // User approves operator
      await collection.connect(user).approve(operator.address, 1);
      
      // Operator should be able to transfer
      await expect(collection.connect(operator).transferFrom(user.address, admin.address, 1))
        .to.emit(collection, "Transfer")
        .withArgs(user.address, admin.address, 1);
    });

    it("Should not allow setApprovalForAll to non-allowlisted operator", async function () {
      await expect(collection.connect(user).setApprovalForAll(operator.address, true))
        .to.be.revertedWithCustomError(collection, "OperatorNotAllowed");
    });

    it("Should allow setApprovalForAll to allowlisted operator", async function () {
      // Add operator to allowlist
      await operatorRegistry.connect(admin).setOperator(await collection.getAddress(), operator.address, true);
      
      await expect(collection.connect(user).setApprovalForAll(operator.address, true))
        .to.not.be.reverted;
      
      expect(await collection.isApprovedForAll(user.address, operator.address)).to.be.true;
    });
  });

  describe("Admin Functions", function () {
    it("Should allow admin to update royalty", async function () {
      await collection.connect(admin).setRoyaltyInfo(admin.address, 500); // 5%
      
      const [receiver, royalty] = await collection.royaltyInfo(1, 10000);
      expect(receiver).to.equal(admin.address);
      expect(royalty).to.equal(500);
    });

    it("Should not allow setting royalty too high", async function () {
      await expect(collection.connect(admin).setRoyaltyInfo(admin.address, 1001)) // >10%
        .to.be.revertedWithCustomError(collection, "RoyaltyTooHigh");
    });

    it("Should allow admin to freeze token URI", async function () {
      await collection.connect(admin).mintTo(user.address, "ipfs://token1");
      
      await expect(collection.connect(admin).freezeTokenURI(1))
        .to.emit(collection, "TokenFrozen")
        .withArgs(await collection.getAddress(), 1);
      
      expect(await collection.frozen(1)).to.be.true;
    });

    it("Should allow admin to pause/unpause", async function () {
      await collection.connect(admin).pause(true);
      expect(await collection.paused()).to.be.true;
      
      // Should not allow minting when paused
      await expect(collection.connect(admin).mintTo(user.address, "ipfs://token1"))
        .to.be.revertedWithCustomError(collection, "EnforcedPause");
      
      await collection.connect(admin).pause(false);
      expect(await collection.paused()).to.be.false;
    });
  });
});