// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IERC1155C {
    function setRoyaltyInfo(address receiver, uint96 bps) external;
    function setMaxSupply(uint256 id, uint256 cap) external;
    function setOpenEditionWindow(uint256 id, uint64 start, uint64 end) external;
    function pause(bool p) external;
}
