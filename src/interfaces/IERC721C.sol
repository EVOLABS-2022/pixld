// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IERC721C {
    function setRoyaltyInfo(address receiver, uint96 bps) external;
    function freezeTokenURI(uint256 tokenId) external;
    function pause(bool p) external;
}
