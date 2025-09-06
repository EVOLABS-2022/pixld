import { TransferSingle, TransferBatch, RoyaltySet, OpenEditionWindowSet, ERC1155CCollection } from "../generated/templates/ERC1155CCollection/ERC1155CCollection"
import { Collection, Token, User, Transfer as TransferEntity, GlobalStats } from "../generated/schema"
import { Address, BigInt, Bytes } from "@graphprotocol/graph-ts"

export function handleTransferSingle(event: TransferSingle): void {
  handleTransfer(
    event.address,
    event.params.from,
    event.params.to,
    event.params.id,
    event.params.value,
    event.transaction.hash,
    event.block.number,
    event.block.timestamp,
    event.logIndex
  )
}

export function handleTransferBatch(event: TransferBatch): void {
  let ids = event.params.ids
  let values = event.params.values
  
  for (let i = 0; i < ids.length; i++) {
    handleTransfer(
      event.address,
      event.params.from,
      event.params.to,
      ids[i],
      values[i],
      event.transaction.hash,
      event.block.number,
      event.block.timestamp,
      event.logIndex.plus(BigInt.fromI32(i))
    )
  }
}

function handleTransfer(
  contractAddress: Address,
  from: Address,
  to: Address,
  tokenId: BigInt,
  amount: BigInt,
  txHash: Bytes,
  blockNumber: BigInt,
  timestamp: BigInt,
  logIndex: BigInt
): void {
  let collection = Collection.load(contractAddress)
  if (collection == null) {
    return
  }
  
  let tokenEntityId = contractAddress.toHexString() + "-" + tokenId.toString()
  
  // Handle minting (from address(0))
  if (from.equals(Address.zero())) {
    let token = Token.load(tokenEntityId)
    if (token == null) {
      token = new Token(tokenEntityId)
      token.collection = contractAddress
      token.tokenId = tokenId
      token.totalSupply = BigInt.fromI32(0)
      token.maxSupply = BigInt.fromI32(0)
      token.openEditionStart = BigInt.fromI32(0)
      token.openEditionEnd = BigInt.fromI32(0)
      token.isFrozen = false
      token.createdAt = timestamp
    }
    
    token.totalSupply = token.totalSupply.plus(amount)
    token.owner = to // For 1155, this represents the primary holder
    token.updatedAt = timestamp
    
    // Get URI if possible
    let contract = ERC1155CCollection.bind(contractAddress)
    let uriResult = contract.try_uri(tokenId)
    token.tokenURI = uriResult.reverted ? null : uriResult.value
    
    token.save()
    
    // Update collection
    collection.totalSupply = collection.totalSupply.plus(amount)
    collection.updatedAt = timestamp
    collection.save()
    
    // Update global stats
    let globalStats = GlobalStats.load("global")
    if (globalStats != null) {
      globalStats.totalTokens = globalStats.totalTokens.plus(amount)
      globalStats.updatedAt = timestamp
      globalStats.save()
    }
  }
  
  // Create transfer entity
  let transferId = txHash.toHexString() + "-" + logIndex.toString()
  let transfer = new TransferEntity(transferId)
  transfer.collection = contractAddress
  transfer.token = tokenEntityId
  transfer.from = from
  transfer.to = to
  transfer.quantity = amount
  transfer.txHash = txHash
  transfer.blockNumber = blockNumber
  transfer.timestamp = timestamp
  transfer.logIndex = logIndex
  transfer.save()
  
  // Create/update users
  if (!from.equals(Address.zero())) {
    let fromUser = User.load(from)
    if (fromUser == null) {
      fromUser = new User(from)
      fromUser.address = from
      fromUser.createdAt = timestamp
    }
    fromUser.updatedAt = timestamp
    fromUser.save()
  }
  
  let toUser = User.load(to)
  if (toUser == null) {
    toUser = new User(to)
    toUser.address = to
    toUser.createdAt = timestamp
  }
  toUser.updatedAt = timestamp
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

export function handleOpenEditionWindowSet(event: OpenEditionWindowSet): void {
  let tokenEntityId = event.params.collection.toHexString() + "-" + event.params.idOrToken.toString()
  let token = Token.load(tokenEntityId)
  if (token != null) {
    token.openEditionStart = event.params.start
    token.openEditionEnd = event.params.end
    token.updatedAt = event.block.timestamp
    token.save()
  }
}