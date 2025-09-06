// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IOperatorAllowlistRegistry {
    function isOperatorAllowed(address collection, address operator) external view returns (bool);
    function setOperator(address collection, address operator, bool allowed) external;
}
