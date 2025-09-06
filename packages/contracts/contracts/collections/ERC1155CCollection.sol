// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC1155} from "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import {ERC2981} from "@openzeppelin/contracts/token/common/ERC2981.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {IOperatorAllowlistRegistry} from "../validator/IOperatorAllowlistRegistry.sol";
import {Errors} from "../libs/Errors.sol";
import {Events} from "../libs/Events.sol";

contract ERC1155CCollection is ERC1155, ERC2981, AccessControl, Pausable {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    IOperatorAllowlistRegistry public immutable operatorRegistry;

    string public name;
    string public symbol;
    string public contractURI;

    // supply caps and open-edition windows
    mapping(uint256 => uint256) public maxSupply; // 0 = uncapped
    mapping(uint256 => uint256) public minted;
    struct Window { uint64 start; uint64 end; }
    mapping(uint256 => Window) public oeWindow;

    modifier onlyAdmin() {
        if (!hasRole(ADMIN_ROLE, msg.sender)) revert Errors.NotAuthorized();
        _;
    }

    constructor(
        string memory name_,
        string memory symbol_,
        string memory uri_,
        address admin_,
        address royaltyReceiver_,
        uint96 royaltyBps_,
        address operatorRegistry_,
        string memory contractURI_
    ) ERC1155(uri_) {
        if (admin_ == address(0) || royaltyReceiver_ == address(0) || operatorRegistry_ == address(0)) revert Errors.ZeroAddress();
        name = name_;
        symbol = symbol_;
        contractURI = contractURI_;
        _grantRole(DEFAULT_ADMIN_ROLE, admin_);
        _grantRole(ADMIN_ROLE, admin_);
        operatorRegistry = IOperatorAllowlistRegistry(operatorRegistry_);
        _setDefaultRoyalty(royaltyReceiver_, royaltyBps_);
    }

    // ======== mint/supply ========

    function mintTo(address to, uint256 id, uint256 amount, bytes calldata data) external onlyAdmin whenNotPaused {
        _enforceMintLimits(id, amount);
        minted[id] += amount;
        _mint(to, id, amount, data);
    }

    function batchMintTo(address to, uint256[] calldata ids, uint256[] calldata amounts, bytes calldata data) external onlyAdmin whenNotPaused {
        uint256 len = ids.length;
        for (uint256 i; i < len; ++i) _enforceMintLimits(ids[i], amounts[i]);
        for (uint256 i; i < len; ++i) minted[ids[i]] += amounts[i];
        _mintBatch(to, ids, amounts, data);
    }

    function _enforceMintLimits(uint256 id, uint256 amount) internal view {
        Window memory w = oeWindow[id];
        if (w.start != 0 || w.end != 0) {
            if (block.timestamp < w.start) revert Errors.NotStarted();
            if (block.timestamp > w.end) revert Errors.Ended();
        }
        uint256 cap = maxSupply[id];
        if (cap != 0 && minted[id] + amount > cap) revert Errors.InvalidParams();
    }

    function setMaxSupply(uint256 id, uint256 cap) external onlyAdmin {
        // set before selling; 0 means uncapped (creator must set responsibly)
        maxSupply[id] = cap;
    }

    function setOpenEditionWindow(uint256 id, uint64 start, uint64 end) external onlyAdmin {
        if (end <= start) revert Errors.InvalidParams();
        oeWindow[id] = Window(start, end);
        emit Events.OpenEditionWindowSet(address(this), id, start, end);
    }

    // ======== admin ========

    function setRoyaltyInfo(address receiver, uint96 bps) external onlyAdmin {
        if (receiver == address(0)) revert Errors.ZeroAddress();
        if (bps > 1000) revert Errors.RoyaltyTooHigh();
        _setDefaultRoyalty(receiver, bps);
        emit Events.RoyaltySet(address(this), bps, receiver);
    }

    function setURI(string calldata newURI) external onlyAdmin { _setURI(newURI); }
    function setContractURI(string calldata newURI) external onlyAdmin { contractURI = newURI; }
    function pause(bool p) external onlyAdmin { p ? _pause() : _unpause(); emit Events.CollectionPaused(address(this), p); }

    // ======== approvals & transfers enforcement ========

    function isApprovedForAll(address owner, address operator) public view override returns (bool) {
        return operatorRegistry.isOperatorAllowed(address(this), operator) && super.isApprovedForAll(owner, operator);
    }

    function setApprovalForAll(address operator, bool approved) public override {
        if (approved && !operatorRegistry.isOperatorAllowed(address(this), operator)) {
            revert Errors.OperatorNotAllowed();
        }
        super.setApprovalForAll(operator, approved);
    }

    // NOTE: OZ v5 uses internal hooks for transfer logic. This override enforces allowlist for operator-driven transfers.
    function _update(address from, address to, uint256[] memory ids, uint256[] memory amounts) internal override {
        // owner direct transfer allowed if msg.sender == from
        if (from != address(0) && msg.sender != from) {
            if (!operatorRegistry.isOperatorAllowed(address(this), msg.sender)) revert Errors.OperatorNotAllowed();
        }
        if (paused()) revert Errors.Paused();
        super._update(from, to, ids, amounts);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC1155, ERC2981, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
