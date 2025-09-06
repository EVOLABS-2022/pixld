// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

library Errors {
    // generic
    error NotAuthorized();
    error ZeroAddress();
    error InvalidParams();
    error Unsupported();
    error NotStarted();
    error Ended();
    error Paused();
    error NotOwner();

    // marketplace
    error OrderExpired();
    error InvalidSignature();
    error NonceUsed();
    error InsufficientQuantity();
    error NotWhitelistedCollection();
    error CurrencyNotAllowed();

    // validator
    error OperatorNotAllowed();

    // royalties
    error RoyaltyTooHigh(); // > 10%
}
