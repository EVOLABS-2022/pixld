// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IOperatorAllowlistRegistry} from "./IOperatorAllowlistRegistry.sol";
import {Errors} from "../libs/Errors.sol";

contract OperatorAllowlistRegistry is IOperatorAllowlistRegistry, Ownable {
    // collection => operator => allowed
    mapping(address => mapping(address => bool)) public allowlist;

    // global operator allow (optional convenience)
    mapping(address => bool) public globalAllowed;

    event GlobalOperatorSet(address indexed operator, bool allowed);

    constructor(address initialOwner) Ownable(initialOwner) {}

    function isOperatorAllowed(address collection, address operator) external view override returns (bool) {
        return allowlist[collection][operator] || globalAllowed[operator];
    }

    function setOperator(address collection, address operator, bool allowed) external override {
        if (collection == address(0) || operator == address(0)) revert Errors.ZeroAddress();
        // NOTE: Expect this to be called by the collection's admin function via a forwarder.
        allowlist[collection][operator] = allowed;
        // Per-collection event will be emitted by the collection that forwards this call.
    }

    function setGlobalOperator(address operator, bool allowed) external onlyOwner {
        if (operator == address(0)) revert Errors.ZeroAddress();
        globalAllowed[operator] = allowed;
        emit GlobalOperatorSet(operator, allowed);
    }
}
