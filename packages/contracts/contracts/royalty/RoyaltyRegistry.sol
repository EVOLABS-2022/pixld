// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Errors} from "../libs/Errors.sol";

contract RoyaltyRegistry is Ownable {
    struct RoyaltyInfo { address receiver; uint96 bps; } // bps capped elsewhere

    mapping(address => RoyaltyInfo) public fallbackRoyalty; // collection => info

    event FallbackRoyaltySet(address indexed collection, address indexed receiver, uint96 bps);

    constructor(address initialOwner) Ownable(initialOwner) {}

    function setFallbackRoyalty(address collection, address receiver, uint96 bps) external onlyOwner {
        if (collection == address(0) || receiver == address(0)) revert Errors.ZeroAddress();
        if (bps > 1000) revert Errors.RoyaltyTooHigh(); // 10% cap
        fallbackRoyalty[collection] = RoyaltyInfo(receiver, bps);
        emit FallbackRoyaltySet(collection, receiver, bps);
    }

    function getRoyalty(address collection) external view returns (address, uint96) {
        RoyaltyInfo memory info = fallbackRoyalty[collection];
        return (info.receiver, info.bps);
    }
}
