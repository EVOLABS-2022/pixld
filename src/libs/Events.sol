// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

library Events {
    // collections
    event RoyaltySet(address indexed collection, uint96 bps, address receiver);
    event OperatorAllowlistUpdated(address indexed collection, address indexed operator, bool allowed);
    event CollectionPaused(address indexed collection, bool paused);
    event TokenFrozen(address indexed collection, uint256 indexed tokenId);
    event OpenEditionWindowSet(address indexed collection, uint256 indexed idOrToken, uint64 start, uint64 end);

    // factory
    event CollectionCreated(address indexed creator, address indexed collection, bool is721, uint96 royaltyBps, address payout);

    // marketplace
    event OrderFilled(
        bytes32 indexed orderHash,
        address indexed collection,
        uint256 indexed tokenId,
        address maker,
        address taker,
        uint256 quantity,
        address currency,
        uint256 totalPrice,
        uint256 royaltyPaid,
        uint256 platformFeePaid
    );
    event OrderCancelled(bytes32 indexed orderHash, address indexed maker);
}
