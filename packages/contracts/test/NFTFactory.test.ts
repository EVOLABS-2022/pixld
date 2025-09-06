import { expect } from "chai";
import { ethers } from "hardhat";
import { NFTFactory, OperatorAllowlistRegistry, ERC721CCollection, ERC1155CCollection } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("NFTFactory", function () {
  let factory: NFTFactory;
  let operatorRegistry: OperatorAllowlistRegistry;
  let admin: HardhatEthersSigner;
  let creator: HardhatEthersSigner;
  let royaltyReceiver: HardhatEthersSigner;

  beforeEach(async function () {
    [admin, creator, royaltyReceiver] = await ethers.getSigners();

    // Deploy OperatorAllowlistRegistry
    const OperatorRegistryFactory = await ethers.getContractFactory("OperatorAllowlistRegistry");
    operatorRegistry = await OperatorRegistryFactory.deploy(admin.address);

    // Deploy NFTFactory
    const FactoryContract = await ethers.getContractFactory("NFTFactory");
    factory = await FactoryContract.deploy(
      await operatorRegistry.getAddress(),
      admin.address
    );
  });

  describe("Deployment", function () {
    it("Should set correct operator registry and platform admin", async function () {
      expect(await factory.operatorRegistry()).to.equal(await operatorRegistry.getAddress());
      expect(await factory.platformAdmin()).to.equal(admin.address);
    });
  });

  describe("ERC721C Collection Creation", function () {
    it("Should create ERC721C collection successfully", async function () {
      const tx = await factory.connect(creator).createERC721C(
        "Test Collection",
        "TEST",
        creator.address,
        royaltyReceiver.address,
        250, // 2.5%
        "ipfs://contract-uri"
      );

      const receipt = await tx.wait();
      const event = receipt?.logs.find(log => {
        try {
          return factory.interface.parseLog(log)?.name === "CollectionCreated";
        } catch {
          return false;
        }
      });

      expect(event).to.not.be.undefined;
      
      // Get the collection address from the event
      const parsedEvent = factory.interface.parseLog(event!);
      const collectionAddress = parsedEvent?.args[1];

      // Verify the collection was deployed correctly
      const Collection = await ethers.getContractFactory("ERC721CCollection");
      const collection = Collection.attach(collectionAddress) as ERC721CCollection;
      
      expect(await collection.name()).to.equal("Test Collection");
      expect(await collection.symbol()).to.equal("TEST");
      
      const ADMIN_ROLE = await collection.ADMIN_ROLE();
      expect(await collection.hasRole(ADMIN_ROLE, creator.address)).to.be.true;
      
      const [receiver, royalty] = await collection.royaltyInfo(1, 10000);
      expect(receiver).to.equal(royaltyReceiver.address);
      expect(royalty).to.equal(250);
    });

    it("Should reject royalty too high", async function () {
      await expect(factory.connect(creator).createERC721C(
        "Test Collection",
        "TEST",
        creator.address,
        royaltyReceiver.address,
        1001, // >10%
        "ipfs://contract-uri"
      )).to.be.revertedWithCustomError(factory, "RoyaltyTooHigh");
    });

    it("Should emit CollectionCreated event", async function () {
      await expect(factory.connect(creator).createERC721C(
        "Test Collection",
        "TEST",
        creator.address,
        royaltyReceiver.address,
        250,
        "ipfs://contract-uri"
      )).to.emit(factory, "CollectionCreated");
    });
  });

  describe("ERC1155C Collection Creation", function () {
    it("Should create ERC1155C collection successfully", async function () {
      const tx = await factory.connect(creator).createERC1155C(
        "Test Collection",
        "TEST",
        "ipfs://base-uri/{id}",
        creator.address,
        royaltyReceiver.address,
        250, // 2.5%
        "ipfs://contract-uri"
      );

      const receipt = await tx.wait();
      const event = receipt?.logs.find(log => {
        try {
          return factory.interface.parseLog(log)?.name === "CollectionCreated";
        } catch {
          return false;
        }
      });

      expect(event).to.not.be.undefined;
      
      // Get the collection address from the event
      const parsedEvent = factory.interface.parseLog(event!);
      const collectionAddress = parsedEvent?.args[1];

      // Verify the collection was deployed correctly
      const Collection = await ethers.getContractFactory("ERC1155CCollection");
      const collection = Collection.attach(collectionAddress) as ERC1155CCollection;
      
      expect(await collection.name()).to.equal("Test Collection");
      expect(await collection.symbol()).to.equal("TEST");
      
      const ADMIN_ROLE = await collection.ADMIN_ROLE();
      expect(await collection.hasRole(ADMIN_ROLE, creator.address)).to.be.true;
    });

    it("Should reject royalty too high for ERC1155C", async function () {
      await expect(factory.connect(creator).createERC1155C(
        "Test Collection",
        "TEST",
        "ipfs://base-uri/{id}",
        creator.address,
        royaltyReceiver.address,
        1001, // >10%
        "ipfs://contract-uri"
      )).to.be.revertedWithCustomError(factory, "RoyaltyTooHigh");
    });
  });

  describe("Integration", function () {
    it("Should create collection that can mint tokens", async function () {
      // Create collection
      const tx = await factory.connect(creator).createERC721C(
        "Test Collection",
        "TEST",
        creator.address,
        royaltyReceiver.address,
        250,
        "ipfs://contract-uri"
      );

      const receipt = await tx.wait();
      const event = receipt?.logs.find(log => {
        try {
          return factory.interface.parseLog(log)?.name === "CollectionCreated";
        } catch {
          return false;
        }
      });

      const parsedEvent = factory.interface.parseLog(event!);
      const collectionAddress = parsedEvent?.args[1];

      // Get the collection contract
      const Collection = await ethers.getContractFactory("ERC721CCollection");
      const collection = Collection.attach(collectionAddress) as ERC721CCollection;

      // Mint a token
      await expect(collection.connect(creator).mintTo(creator.address, "ipfs://token1"))
        .to.emit(collection, "Transfer");

      expect(await collection.ownerOf(1)).to.equal(creator.address);
      expect(await collection.tokenURI(1)).to.equal("ipfs://token1");
    });
  });
});