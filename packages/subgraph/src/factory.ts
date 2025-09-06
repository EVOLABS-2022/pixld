import { CollectionCreated } from "../generated/NFTFactory/NFTFactory"
import { ERC721CCollection, ERC1155CCollection } from "../generated/templates"
import { Collection, User, GlobalStats } from "../generated/schema"
import { Address, BigInt, Bytes } from "@graphprotocol/graph-ts"

export function handleCollectionCreated(event: CollectionCreated): void {
  let collectionId = event.params.collection
  let collection = new Collection(collectionId)
  
  // Basic collection info
  collection.address = collectionId
  collection.creator = event.params.creator
  collection.deployedViaFactory = true
  collection.isWhitelisted = true // Auto-whitelisted when deployed via factory
  collection.isFeatured = false
  collection.royaltyBps = event.params.royaltyBps
  collection.royaltyReceiver = event.params.royaltyReceiver
  collection.standard = event.params.isERC721 ? "ERC721C" : "ERC1155"
  collection.totalSupply = BigInt.fromI32(0)
  collection.volume24h = BigInt.fromI32(0)
  collection.volumeTotal = BigInt.fromI32(0)
  collection.isPaused = false
  collection.createdAt = event.block.timestamp
  collection.updatedAt = event.block.timestamp
  
  // Get collection contract details
  if (event.params.isERC721) {
    let contract = ERC721CCollection.bind(Address.fromBytes(collectionId))
    let nameResult = contract.try_name()
    let symbolResult = contract.try_symbol()
    let contractURIResult = contract.try_contractURI()
    
    collection.name = nameResult.reverted ? "Unknown" : nameResult.value
    collection.symbol = symbolResult.reverted ? "UNKNOWN" : symbolResult.value
    collection.contractURI = contractURIResult.reverted ? null : contractURIResult.value
    
    // Start indexing this collection
    ERC721CCollection.create(collectionId)
  } else {
    let contract = ERC1155CCollection.bind(Address.fromBytes(collectionId))
    let nameResult = contract.try_name()
    let symbolResult = contract.try_symbol()
    let contractURIResult = contract.try_contractURI()
    
    collection.name = nameResult.reverted ? "Unknown" : nameResult.value
    collection.symbol = symbolResult.reverted ? "UNKNOWN" : symbolResult.value
    collection.contractURI = contractURIResult.reverted ? null : contractURIResult.value
    
    // Start indexing this collection
    ERC1155CCollection.create(collectionId)
  }
  
  collection.save()
  
  // Create or update creator user
  let creator = User.load(event.params.creator)
  if (creator == null) {
    creator = new User(event.params.creator)
    creator.address = event.params.creator
    creator.createdAt = event.block.timestamp
  }
  creator.updatedAt = event.block.timestamp
  creator.save()
  
  // Update global stats
  let globalStats = GlobalStats.load("global")
  if (globalStats == null) {
    globalStats = new GlobalStats("global")
    globalStats.totalCollections = BigInt.fromI32(0)
    globalStats.totalTokens = BigInt.fromI32(0)
    globalStats.totalVolume = BigInt.fromI32(0)
    globalStats.totalSales = BigInt.fromI32(0)
  }
  globalStats.totalCollections = globalStats.totalCollections.plus(BigInt.fromI32(1))
  globalStats.updatedAt = event.block.timestamp
  globalStats.save()
}