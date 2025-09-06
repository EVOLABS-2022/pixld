import { OrderFilled, OrderCancelled } from "../generated/Marketplace/Marketplace"
import { Collection, Token, User, Sale, Order, GlobalStats, DailyCollectionStats, WeeklyCollectionStats } from "../generated/schema"
import { Address, BigInt, Bytes, log } from "@graphprotocol/graph-ts"

export function handleOrderFilled(event: OrderFilled): void {
  let saleId = event.transaction.hash.toHexString() + "-" + event.logIndex.toString()
  let sale = new Sale(saleId)
  
  // Basic sale info
  sale.collection = event.params.collection
  sale.token = event.params.collection.toHexString() + "-" + event.params.tokenId.toString()
  sale.seller = event.params.maker
  sale.buyer = event.params.taker
  sale.price = event.params.totalPrice
  sale.currency = event.params.currency
  sale.platformFee = event.params.platformFee
  sale.royaltyFee = event.params.royaltyAmt
  sale.quantity = event.params.takerQuantity
  sale.txHash = event.transaction.hash
  sale.blockNumber = event.block.number
  sale.timestamp = event.block.timestamp
  sale.logIndex = event.logIndex
  
  sale.save()
  
  // Update collection stats
  let collection = Collection.load(event.params.collection)
  if (collection != null) {
    collection.volumeTotal = collection.volumeTotal.plus(event.params.totalPrice)
    collection.volume24h = collection.volume24h.plus(event.params.totalPrice)
    collection.updatedAt = event.block.timestamp
    
    // Update floor price logic - this is simplified, real implementation would track active listings
    if (collection.floorPrice == null || event.params.totalPrice.lt(collection.floorPrice!)) {
      collection.floorPrice = event.params.totalPrice
    }
    
    collection.save()
    
    // Update daily stats
    updateDailyStats(collection as Collection, event.params.totalPrice, event.block.timestamp)
    
    // Update weekly stats  
    updateWeeklyStats(collection as Collection, event.params.totalPrice, event.block.timestamp)
  }
  
  // Create/update users
  let seller = User.load(event.params.maker)
  if (seller == null) {
    seller = new User(event.params.maker)
    seller.address = event.params.maker
    seller.createdAt = event.block.timestamp
  }
  seller.updatedAt = event.block.timestamp
  seller.save()
  
  let buyer = User.load(event.params.taker)
  if (buyer == null) {
    buyer = new User(event.params.taker)
    buyer.address = event.params.taker
    buyer.createdAt = event.block.timestamp
  }
  buyer.updatedAt = event.block.timestamp
  buyer.save()
  
  // Update global stats
  let globalStats = GlobalStats.load("global")
  if (globalStats != null) {
    globalStats.totalVolume = globalStats.totalVolume.plus(event.params.totalPrice)
    globalStats.totalSales = globalStats.totalSales.plus(BigInt.fromI32(1))
    globalStats.updatedAt = event.block.timestamp
    globalStats.save()
  }
}

export function handleOrderCancelled(event: OrderCancelled): void {
  let order = Order.load(event.params.orderHash)
  if (order != null) {
    order.isActive = false
    order.isCancelled = true
    order.updatedAt = event.block.timestamp
    order.save()
  }
}

function updateDailyStats(collection: Collection, volume: BigInt, timestamp: BigInt): void {
  let date = new Date(timestamp.toI64() * 1000)
  let dateString = date.toISOString().slice(0, 10) // YYYY-MM-DD
  
  let dailyStatsId = collection.id.toHexString() + "-" + dateString
  let dailyStats = DailyCollectionStats.load(dailyStatsId)
  
  if (dailyStats == null) {
    dailyStats = new DailyCollectionStats(dailyStatsId)
    dailyStats.collection = collection.id
    dailyStats.date = dateString
    dailyStats.volume = BigInt.fromI32(0)
    dailyStats.sales = BigInt.fromI32(0)
    dailyStats.avgPrice = BigInt.fromI32(0)
  }
  
  dailyStats.volume = dailyStats.volume.plus(volume)
  dailyStats.sales = dailyStats.sales.plus(BigInt.fromI32(1))
  dailyStats.avgPrice = dailyStats.volume.div(dailyStats.sales)
  
  dailyStats.save()
}

function updateWeeklyStats(collection: Collection, volume: BigInt, timestamp: BigInt): void {
  let date = new Date(timestamp.toI64() * 1000)
  let dayOfWeek = date.getDay()
  let monday = new Date(date.getTime() - (dayOfWeek - 1) * 24 * 60 * 60 * 1000)
  let mondayString = monday.toISOString().slice(0, 10) // YYYY-MM-DD
  
  let weeklyStatsId = collection.id.toHexString() + "-" + mondayString
  let weeklyStats = WeeklyCollectionStats.load(weeklyStatsId)
  
  if (weeklyStats == null) {
    weeklyStats = new WeeklyCollectionStats(weeklyStatsId)
    weeklyStats.collection = collection.id
    weeklyStats.weekStart = mondayString
    weeklyStats.volume = BigInt.fromI32(0)
    weeklyStats.sales = BigInt.fromI32(0)
    weeklyStats.avgPrice = BigInt.fromI32(0)
  }
  
  weeklyStats.volume = weeklyStats.volume.plus(volume)
  weeklyStats.sales = weeklyStats.sales.plus(BigInt.fromI32(1))
  weeklyStats.avgPrice = weeklyStats.volume.div(weeklyStats.sales)
  
  weeklyStats.save()
}