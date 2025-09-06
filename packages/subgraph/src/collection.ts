import { Transfer, RoyaltySet, CollectionPaused, TokenFrozen, ERC721CCollection } from "../generated/templates/ERC721CCollection/ERC721CCollection"
import { Collection, Token, User, Transfer as TransferEntity, GlobalStats } from "../generated/schema"
import { Address, BigInt, Bytes } from "@graphprotocol/graph-ts"

export function handleTransfer(event: Transfer): void {
  let collectionAddress = event.address
  let collection = Collection.load(collectionAddress)
  
  if (collection == null) {
    return // Skip if collection not tracked
  }
  
  let tokenId = event.params.tokenId
  let tokenEntityId = collectionAddress.toHexString() + "-" + tokenId.toString()
  
  // Handle minting (from address(0))
  if (event.params.from.equals(Address.zero())) {
    let token = new Token(tokenEntityId)
    token.collection = collectionAddress
    token.tokenId = tokenId
    token.owner = event.params.to
    token.isFrozen = false
    token.createdAt = event.block.timestamp
    token.updatedAt = event.block.timestamp
    
    // Get token URI if possible
    let contract = ERC721CCollection.bind(event.address)
    let tokenURIResult = contract.try_tokenURI(tokenId)
    token.tokenURI = tokenURIResult.reverted ? null : tokenURIResult.value
    
    token.save()
    
    // Update collection total supply
    collection.totalSupply = collection.totalSupply.plus(BigInt.fromI32(1))
    collection.updatedAt = event.block.timestamp
    collection.save()
    
    // Update global stats
    let globalStats = GlobalStats.load("global")
    if (globalStats != null) {
      globalStats.totalTokens = globalStats.totalTokens.plus(BigInt.fromI32(1))
      globalStats.updatedAt = event.block.timestamp
      globalStats.save()
    }
  } else {
    // Handle transfer/sale
    let token = Token.load(tokenEntityId)
    if (token != null) {
      token.owner = event.params.to
      token.updatedAt = event.block.timestamp
      token.save()
    }
  }
  
  // Create transfer entity
  let transferId = event.transaction.hash.toHexString() + "-" + event.logIndex.toString()
  let transfer = new TransferEntity(transferId)
  transfer.collection = collectionAddress
  transfer.token = tokenEntityId
  transfer.from = event.params.from
  transfer.to = event.params.to
  transfer.quantity = BigInt.fromI32(1) // ERC721 is always 1
  transfer.txHash = event.transaction.hash
  transfer.blockNumber = event.block.number
  transfer.timestamp = event.block.timestamp
  transfer.logIndex = event.logIndex
  transfer.save()
  
  // Create or update users
  if (!event.params.from.equals(Address.zero())) {
    let fromUser = User.load(event.params.from)
    if (fromUser == null) {
      fromUser = new User(event.params.from)
      fromUser.address = event.params.from
      fromUser.createdAt = event.block.timestamp
    }
    fromUser.updatedAt = event.block.timestamp
    fromUser.save()
  }
  
  let toUser = User.load(event.params.to)
  if (toUser == null) {
    toUser = new User(event.params.to)
    toUser.address = event.params.to
    toUser.createdAt = event.block.timestamp
  }
  toUser.updatedAt = event.block.timestamp
  toUser.save()
}

export function handleRoyaltySet(event: RoyaltySet): void {
  let collection = Collection.load(event.params.collection)
  if (collection != null) {
    collection.royaltyBps = event.params.bps
    collection.royaltyReceiver = event.params.receiver
    collection.updatedAt = event.block.timestamp
    collection.save()
  }
}

export function handleCollectionPaused(event: CollectionPaused): void {
  let collection = Collection.load(event.params.collection)
  if (collection != null) {
    collection.isPaused = event.params.paused
    collection.updatedAt = event.block.timestamp
    collection.save()
  }
}

export function handleTokenFrozen(event: TokenFrozen): void {
  let tokenEntityId = event.params.collection.toHexString() + "-" + event.params.tokenId.toString()
  let token = Token.load(tokenEntityId)
  if (token != null) {
    token.isFrozen = true
    token.updatedAt = event.block.timestamp
    token.save()
  }
}