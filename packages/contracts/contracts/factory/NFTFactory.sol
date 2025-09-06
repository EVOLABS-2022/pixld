// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC721CCollection} from "../collections/ERC721CCollection.sol";
import {ERC1155CCollection} from "../collections/ERC1155CCollection.sol";
import {Events} from "../libs/Events.sol";
import {Errors} from "../libs/Errors.sol";

contract NFTFactory {
    address public immutable operatorRegistry;
    address public immutable platformAdmin;

    constructor(address _operatorRegistry, address _platformAdmin) {
        if (_operatorRegistry == address(0) || _platformAdmin == address(0)) revert Errors.ZeroAddress();
        operatorRegistry = _operatorRegistry;
        platformAdmin = _platformAdmin;
    }

    function createERC721C(
        string calldata name_,
        string calldata symbol_,
        address creatorAdmin,
        address royaltyReceiver,
        uint96 royaltyBps,
        string calldata contractURI_
    ) external returns (address collection) {
        if (royaltyBps > 1000) revert Errors.RoyaltyTooHigh();
        collection = address(new ERC721CCollection(
            name_, symbol_, creatorAdmin, royaltyReceiver, royaltyBps, operatorRegistry, contractURI_
        ));
        emit Events.CollectionCreated(msg.sender, collection, true, royaltyBps, royaltyReceiver);
    }

    function createERC1155C(
        string calldata name_,
        string calldata symbol_,
        string calldata uri_,
        address creatorAdmin,
        address royaltyReceiver,
        uint96 royaltyBps,
        string calldata contractURI_
    ) external returns (address collection) {
        if (royaltyBps > 1000) revert Errors.RoyaltyTooHigh();
        collection = address(new ERC1155CCollection(
            name_, symbol_, uri_, creatorAdmin, royaltyReceiver, royaltyBps, operatorRegistry, contractURI_
        ));
        emit Events.CollectionCreated(msg.sender, collection, false, royaltyBps, royaltyReceiver);
    }
}
