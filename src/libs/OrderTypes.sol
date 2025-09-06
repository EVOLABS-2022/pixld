// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

library OrderTypes {
    enum Standard { ERC721, ERC1155 }
    enum Strategy { FIXED_PRICE }

    struct Ask {
        address maker;
        address collection;
        uint256 tokenId;
        uint256 quantity;     // 1 for ERC721
        address currency;     // address(0) for native
        uint256 price;        // unit price
        uint64  start;
        uint64  end;
        uint256 salt;         // randomizer
        uint256 nonce;        // cancel domain
        Standard standard;
        Strategy strategy;    // FIXED_PRICE (v1)
    }
}
