// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {IERC1155} from "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import {IERC165} from "@openzeppelin/contracts/utils/introspection/IERC165.sol";
import {IERC2981} from "@openzeppelin/contracts/interfaces/IERC2981.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Address} from "@openzeppelin/contracts/utils/Address.sol";
import {OrderTypes} from "../libs/OrderTypes.sol";
import {Events} from "../libs/Events.sol";
import {Errors} from "../libs/Errors.sol";
import {RoyaltyRegistry} from "../royalty/RoyaltyRegistry.sol";

contract Marketplace is ReentrancyGuard, EIP712, Ownable {
    using ECDSA for bytes32;
    using SafeERC20 for IERC20;

    bytes32 public constant ASK_TYPEHASH = keccak256(
        "Ask(address maker,address collection,uint256 tokenId,uint256 quantity,address currency,uint256 price,uint64 start,uint64 end,uint256 salt,uint256 nonce,uint8 standard,uint8 strategy)"
    );

    // EIP-2981 interface id
    bytes4 private constant _INTERFACE_ID_ERC2981 = 0x2a55205a;

    address public treasury;
    uint96  public platformFeeBps = 200; // 2%
    bool    public takeRoyaltyOnPrimary = false;

    RoyaltyRegistry public royaltyRegistry;

    // maker => nonce => used
    mapping(address => mapping(uint256 => bool)) public nonceUsed;

    // allowed ERC20 currencies (address(0) == native always allowed)
    mapping(address => bool) public currencyAllowed;

    event TreasurySet(address indexed treasury);
    event PlatformFeeSet(uint96 bps);
    event CurrencyAllowed(address indexed token, bool allowed);
    event TakeRoyaltyOnPrimarySet(bool enabled);

    constructor(address _treasury, address _royaltyRegistry, address initialOwner)
        EIP712("ArtMarket", "1")
        Ownable(initialOwner)
    {
        require(_treasury != address(0) && _royaltyRegistry != address(0), "zero addr");
        treasury = _treasury;
        royaltyRegistry = RoyaltyRegistry(_royaltyRegistry);
        currencyAllowed[address(0)] = true; // native
        emit TreasurySet(_treasury);
    }

    // ========= admin =========

    function setTreasury(address t) external onlyOwner {
        if (t == address(0)) revert Errors.ZeroAddress();
        treasury = t;
        emit TreasurySet(t);
    }

    function setPlatformFeeBps(uint96 bps) external onlyOwner {
        require(bps <= 1000, "fee too high");
        platformFeeBps = bps;
        emit PlatformFeeSet(bps);
    }

    function setCurrencyAllowed(address token, bool allowed) external onlyOwner {
        currencyAllowed[token] = allowed;
        emit CurrencyAllowed(token, allowed);
    }

    function setTakeRoyaltyOnPrimary(bool e) external onlyOwner {
        takeRoyaltyOnPrimary = e;
        emit TakeRoyaltyOnPrimarySet(e);
    }

    // ========= core =========

    function hashAsk(OrderTypes.Ask calldata a) public view returns (bytes32) {
        return _hashTypedDataV4(keccak256(abi.encode(
            ASK_TYPEHASH,
            a.maker, a.collection, a.tokenId, a.quantity, a.currency, a.price, a.start, a.end, a.salt, a.nonce, a.standard, a.strategy
        )));
    }

    function cancel(uint256 nonce) external {
        nonceUsed[msg.sender][nonce] = true;
        bytes32 orderHash = keccak256(abi.encodePacked(msg.sender, nonce));
        emit Events.OrderCancelled(orderHash, msg.sender);
    }

    function fill(
        OrderTypes.Ask calldata a,
        bytes calldata sig,
        uint256 takerQuantity
    ) external payable nonReentrant {
        _fillOne(a, sig, takerQuantity, msg.sender);
    }

    function fillMany(
        OrderTypes.Ask[] calldata asks,
        bytes[] calldata sigs,
        uint256[] calldata takerQuantities
    ) external payable nonReentrant {
        uint256 n = asks.length;
        require(sigs.length == n && takerQuantities.length == n, "len mismatch");
        // NOTE: For native currency sweeps, the caller must send the sum total of all orders.
        for (uint256 i; i < n; ++i) {
            _fillOne(asks[i], sigs[i], takerQuantities[i], msg.sender);
        }
    }

    // ========= internals =========

    function _fillOne(
        OrderTypes.Ask calldata a,
        bytes calldata sig,
        uint256 takerQuantity,
        address taker
    ) internal {
        // validate time
        if (a.end != 0 && block.timestamp > a.end) revert Errors.OrderExpired();
        if (a.start != 0 && block.timestamp < a.start) revert Errors.NotStarted();

        // signature
        bytes32 digest = hashAsk(a);
        address recovered = ECDSA.recover(digest, sig);
        if (recovered != a.maker || recovered == address(0)) revert Errors.InvalidSignature();

        // nonce
        if (nonceUsed[a.maker][a.nonce]) revert Errors.NonceUsed();
        nonceUsed[a.maker][a.nonce] = true; // one-time use for simplicity in v1

        // quantity
        if (a.standard == OrderTypes.Standard.ERC721) {
            require(takerQuantity == 1 && a.quantity == 1, "qty=1");
        } else {
            if (takerQuantity == 0 || takerQuantity > a.quantity) revert Errors.InsufficientQuantity();
        }

        // currency
        if (!currencyAllowed[a.currency]) revert Errors.CurrencyNotAllowed();

        // compute totals
        uint256 totalPrice = a.price * takerQuantity;

        // pull funds if ERC20
        if (a.currency != address(0)) {
            IERC20(a.currency).safeTransferFrom(taker, address(this), totalPrice);
        } else {
            // native
            require(msg.value >= totalPrice, "insufficient msg.value");
        }

        // transfer NFT from maker to taker (requires maker approval to this contract)
        if (a.standard == OrderTypes.Standard.ERC721) {
            IERC721(a.collection).safeTransferFrom(a.maker, taker, a.tokenId);
        } else {
            IERC1155(a.collection).safeTransferFrom(a.maker, taker, a.tokenId, takerQuantity, "");
        }

        // payouts
        (address royaltyReceiver, uint256 royaltyAmt) = _computeRoyalty(a.collection, a.tokenId, totalPrice);
        // Primary sales handling: if maker == collection owner/creator logic is off-chain; v1 flag simply toggles on/off.
        if (!takeRoyaltyOnPrimary && _isPrimaryLike(a.maker)) {
            royaltyAmt = 0;
        }

        uint256 platformFee = (totalPrice * platformFeeBps) / 10_000;
        uint256 sellerProceeds = totalPrice - royaltyAmt - platformFee;

        if (a.currency == address(0)) {
            if (royaltyAmt > 0 && royaltyReceiver != address(0)) Address.sendValue(payable(royaltyReceiver), royaltyAmt);
            if (platformFee > 0) Address.sendValue(payable(treasury), platformFee);
            Address.sendValue(payable(a.maker), sellerProceeds);
            // refund dust if overpaid in sweeps
            if (msg.value > totalPrice) {
                Address.sendValue(payable(taker), msg.value - totalPrice);
            }
        } else {
            if (royaltyAmt > 0 && royaltyReceiver != address(0)) IERC20(a.currency).safeTransfer(royaltyReceiver, royaltyAmt);
            if (platformFee > 0) IERC20(a.currency).safeTransfer(treasury, platformFee);
            IERC20(a.currency).safeTransfer(a.maker, sellerProceeds);
        }

        bytes32 orderHash = keccak256(abi.encodePacked(a.maker, a.nonce, digest));
        emit Events.OrderFilled(orderHash, a.collection, a.tokenId, a.maker, taker, takerQuantity, a.currency, totalPrice, royaltyAmt, platformFee);
    }

    function _computeRoyalty(address collection, uint256 tokenId, uint256 salePrice) internal view returns (address, uint256) {
        if (IERC165(collection).supportsInterface(_INTERFACE_ID_ERC2981)) {
            (address recv, uint256 amt) = IERC2981(collection).royaltyInfo(tokenId, salePrice);
            // defensive cap at 10%
            uint256 maxAmt = (salePrice * 1000) / 10_000;
            if (amt > maxAmt) amt = maxAmt;
            return (recv, amt);
        } else {
            (address recv2, uint96 bps) = royaltyRegistry.getRoyalty(collection);
            if (recv2 == address(0) || bps == 0) return (address(0), 0);
            uint256 amt2 = (salePrice * bps) / 10_000;
            return (recv2, amt2);
        }
    }

    // crude heuristic: treat zero-address maker as never primary; real primary detection is app-level for v1.
    function _isPrimaryLike(address /*maker*/) internal pure returns (bool) {
        return false;
    }
}
