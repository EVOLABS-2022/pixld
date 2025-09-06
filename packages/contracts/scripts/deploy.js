const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying NFT Marketplace to Abstract Network...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)));

  // Deploy Royalty Registry
  console.log("\n📋 Deploying RoyaltyRegistry...");
  const RoyaltyRegistry = await ethers.getContractFactory("RoyaltyRegistry");
  const royaltyRegistry = await RoyaltyRegistry.deploy(deployer.address);
  await royaltyRegistry.waitForDeployment();
  const royaltyRegistryAddress = await royaltyRegistry.getAddress();
  console.log("✅ RoyaltyRegistry deployed to:", royaltyRegistryAddress);

  // Deploy Operator Allowlist Registry
  console.log("\n🛡️ Deploying OperatorAllowlistRegistry...");
  const OperatorAllowlistRegistry = await ethers.getContractFactory("OperatorAllowlistRegistry");
  const operatorRegistry = await OperatorAllowlistRegistry.deploy(deployer.address);
  await operatorRegistry.waitForDeployment();
  const operatorRegistryAddress = await operatorRegistry.getAddress();
  console.log("✅ OperatorAllowlistRegistry deployed to:", operatorRegistryAddress);

  // Deploy Marketplace
  console.log("\n🏪 Deploying Marketplace...");
  const Marketplace = await ethers.getContractFactory("Marketplace");
  const marketplace = await Marketplace.deploy(
    deployer.address, // treasury
    royaltyRegistryAddress, // royalty registry
    deployer.address // initial owner
  );
  await marketplace.waitForDeployment();
  const marketplaceAddress = await marketplace.getAddress();
  console.log("✅ Marketplace deployed to:", marketplaceAddress);

  // Allow marketplace as operator
  console.log("\n🔗 Configuring operator allowlist...");
  await operatorRegistry.setOperatorAllowed(marketplaceAddress, true);
  console.log("✅ Marketplace added to operator allowlist");

  // Deploy Collection Factory
  console.log("\n🏭 Deploying CollectionFactory...");
  const CollectionFactory = await ethers.getContractFactory("CollectionFactory");
  const factory = await CollectionFactory.deploy();
  await factory.waitForDeployment();
  const factoryAddress = await factory.getAddress();
  console.log("✅ CollectionFactory deployed to:", factoryAddress);

  // Deploy a test ERC721C collection
  console.log("\n🎨 Deploying test ERC721C collection...");
  const ERC721CCollection = await ethers.getContractFactory("ERC721CCollection");
  const testCollection = await ERC721CCollection.deploy(
    "Test Art Collection",
    "TAC",
    deployer.address, // admin
    deployer.address, // royalty receiver
    750, // 7.5% royalty
    operatorRegistryAddress,
    "https://example.com/contract-metadata.json"
  );
  await testCollection.waitForDeployment();
  const testCollectionAddress = await testCollection.getAddress();
  console.log("✅ Test ERC721C Collection deployed to:", testCollectionAddress);

  // Mint a test NFT
  console.log("\n🎯 Minting test NFT...");
  await testCollection.mintTo(deployer.address, "https://example.com/token/1.json");
  console.log("✅ Test NFT minted to deployer");

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("🎉 DEPLOYMENT COMPLETE!");
  console.log("=".repeat(60));
  console.log("📋 Contract Addresses:");
  console.log("├─ RoyaltyRegistry:        ", royaltyRegistryAddress);
  console.log("├─ OperatorAllowlist:      ", operatorRegistryAddress);
  console.log("├─ Marketplace:            ", marketplaceAddress);
  console.log("├─ CollectionFactory:      ", factoryAddress);
  console.log("└─ Test Collection:        ", testCollectionAddress);
  console.log("\n💡 Next Steps:");
  console.log("1. Update frontend contract addresses in /apps/web/src/lib/contracts.ts");
  console.log("2. Deploy and configure subgraph with new contract addresses");
  console.log("3. Update environment variables for frontend");
  console.log("4. Test marketplace functionality with deployed contracts");

  // Save addresses to a file
  const addresses = {
    network: "abstract",
    deployedAt: new Date().toISOString(),
    contracts: {
      RoyaltyRegistry: royaltyRegistryAddress,
      OperatorAllowlistRegistry: operatorRegistryAddress,
      Marketplace: marketplaceAddress,
      CollectionFactory: factoryAddress,
      TestCollection: testCollectionAddress
    },
    deployer: deployer.address
  };

  const fs = require('fs');
  fs.writeFileSync(
    './deployments.json',
    JSON.stringify(addresses, null, 2)
  );
  console.log("\n📄 Contract addresses saved to deployments.json");

  // Verification info
  console.log("\n🔍 Verification Commands:");
  console.log(`npx hardhat verify --network abstract ${royaltyRegistryAddress} "${deployer.address}"`);
  console.log(`npx hardhat verify --network abstract ${operatorRegistryAddress} "${deployer.address}"`);
  console.log(`npx hardhat verify --network abstract ${marketplaceAddress} "${deployer.address}" "${royaltyRegistryAddress}" "${deployer.address}"`);
  console.log(`npx hardhat verify --network abstract ${factoryAddress}`);
  console.log(`npx hardhat verify --network abstract ${testCollectionAddress} "Test Art Collection" "TAC" "${deployer.address}" "${deployer.address}" 750 "${operatorRegistryAddress}" "https://example.com/contract-metadata.json"`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });