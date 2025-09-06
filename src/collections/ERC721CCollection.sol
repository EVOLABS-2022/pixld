// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC721, ERC721URIStorage} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import {ERC2981} from "@openzeppelin/contracts/token/common/ERC2981.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {IOperatorAllowlistRegistry} from "../validator/IOperatorAllowlistRegistry.sol";
import {Errors} from "../libs/Errors.sol";
import {Events} from "../libs/Events.sol";

/// @notice ERC-721C-like: owner can always transfer; operators must be allowlisted via registry.
/// @dev Approvals restricted to allowlisted operators. 2981 used for UI + payouts.
contract ERC721CCollection is ERC721URIStorage, ERC2981, AccessControl, Pausable {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    IOperatorAllowlistRegistry public immutable operatorRegistry;

    // tokenId => frozen
    mapping(uint256 => bool) public frozen;

    uint256 private _nextId;
    string public contractURI; // optional collection metadata

    modifier onlyAdmin() {
        if (!hasRole(ADMIN_ROLE, msg.sender)) revert Errors.NotAuthorized();
        _;
    }

    constructor(
        string memory name_,
        string memory symbol_,
        address admin_,
        address royaltyReceiver_,
        uint96 royaltyBps_,
        address operatorRegistry_,
        string memory contractURI_
    ) ERC721(name_, symbol_) {
        if (admin_ == address(0) || royaltyReceiver_ == address(0) || operatorRegistry_ == address(0)) revert Errors.ZeroAddress();
        _grantRole(DEFAULT_ADMIN_ROLE, admin_);
        _grantRole(ADMIN_ROLE, admin_);
        operatorRegistry = IOperatorAllowlistRegistry(operatorRegistry_);
        _setDefaultRoyalty(royaltyReceiver_, royaltyBps_); // bps cap enforced in factory/UI
        contractURI = contractURI_;
        _nextId = 1;
    }

    // ======== mint ========

    function mintTo(address to, string calldata tokenURI_) external onlyAdmin whenNotPaused returns (uint256 tokenId) {
        tokenId = _nextId++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, tokenURI_);
        // (emit via standard Transfer event)
    }

    function batchMintTo(address to, string[] calldata tokenURIs) external onlyAdmin whenNotPaused {
        uint256 len = tokenURIs.length;
        for (uint256 i; i < len; ++i) {
            uint256 id = _nextId++;
            _safeMint(to, id);
            _setTokenURI(id, tokenURIs[i]);
        }
    }

    // ======== admin / settings ========

    function setRoyaltyInfo(address receiver, uint96 bps) external onlyAdmin {
        if (receiver == address(0)) revert Errors.ZeroAddress();
        if (bps > 1000) revert Errors.RoyaltyTooHigh();
        _setDefaultRoyalty(receiver, bps);
        emit Events.RoyaltySet(address(this), bps, receiver);
    }

    function setContractURI(string calldata newURI) external onlyAdmin { contractURI = newURI; }

    function freezeTokenURI(uint256 tokenId) external onlyAdmin {
        frozen[tokenId] = true;
        emit Events.TokenFrozen(address(this), tokenId);
    }

    function pause(bool p) external onlyAdmin { p ? _pause() : _unpause(); emit Events.CollectionPaused(address(this), p); }

    // ======== approvals & transfers enforcement ========

    function isApprovedForAll(address owner, address operator) public view override returns (bool) {
        // only allowlisted operators get blanket approval
        return operatorRegistry.isOperatorAllowed(address(this), operator) && super.isApprovedForAll(owner, operator);
    }

    function setApprovalForAll(address operator, bool approved) public override {
        // allow approvals only to allowlisted operators
        if (approved && !operatorRegistry.isOperatorAllowed(address(this), operator)) {
            revert Errors.OperatorNotAllowed();
        }
        super.setApprovalForAll(operator, approved);
    }

    // OZ v5 uses `_update` for transfers; enforce operator or owner-initiated transfers.
    function _update(address to, uint256 tokenId, address auth) internal override(ERC721) returns (address) {
        // owner-to-any: allowed if msg.sender == current owner (auth)
        // otherwise require allowlisted operator.
        if (auth != msg.sender) {
            // operator path
            if (!operatorRegistry.isOperatorAllowed(address(this), msg.sender)) revert Errors.OperatorNotAllowed();
        }
        if (paused()) revert Errors.Paused();
        return super._update(to, tokenId, auth);
    }

    // block URI changes if frozen
    function _setTokenURI(uint256 tokenId, string memory _tokenURI) internal override {
        if (frozen[tokenId]) revert Errors.Unsupported();
        super._setTokenURI(tokenId, _tokenURI);
    }

    // ======== supportsInterface ========

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC2981, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
