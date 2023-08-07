// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "hardhat/console.sol";

// What do we need to creat a NFT MarketPlace?
// Main functions:
// 1. 'ListItem' : lists NFTs on the marketplace
// 2. 'buyItem' : buys NFTs from the marketplace
// 3. 'cancelItem': cancels a listing
// 4. 'updateListing': updates Price ListItem
// 5. 'withdrawProceeds': withdraws proceeds from sales

error NftMarketplace__Price_Must_Be_Above_Zero();
error NftMarketplace__NFT_Not_Approved_For_Marketplace();
error NftMarketplace__NFT_Already_Listed(address nftAddress, uint256 tokenId);
//error NftMarketplace__NFT_Already_Listed();
error NftMarketplace__Seller_Not_NFT_Owner();
error NftMarketplace__NFT_Not_Listed(address nftAddress, uint256 tokenId);
error NftMarketplace__Price_Not_Met(
    address nftAddress,
    uint256 tokenId,
    uint256 price
);
error NftMarketplace__No_Proceeds_Available_To_Withdraw();
error NftMarketplace__Withdraw_Failed();

contract NFTMarketplace is ReentrancyGuard {
    constructor() {
        console.log("Omar Alhabsh says hello!");
    }

    ////////////////////
    // Events       ///
    ///////////////////

    // We need a type of data structure to list all NFTs in the marketplace. A mapping (a global or state variable)
    // NFT Contract Address -> NFT TokenID -> Listing
    // 0x123... -> 1 -> {price: 100, seller: 0x123...}
    // 0x123... -> 2 -> {price: 200, seller: 0x456...}
    // 0x123... -> 3 -> {price: 300, seller: 0x789...}
    struct Listing {
        uint256 price;
        address seller;
    }
    mapping(address => mapping(uint256 => Listing)) private s_listings;

    // Seller address => Amount earned
    mapping(address => uint256) private s_proceeds;

    ////////////////////
    // Events       ///
    ///////////////////

    event ItemListed(
        address indexed seller,
        address indexed nftAddress,
        uint256 indexed tokenId,
        uint256 price
    );

    event ItemBought(
        address indexed buyer,
        address indexed nftAddress,
        uint256 indexed tokenId,
        uint256 price
    );

    event ItemCanceled(
        address indexed seller,
        address indexed nftAddress,
        uint256 indexed tokenId
    );
    event ItemPriceUpdated(
        address indexed seller,
        address indexed nftAddress,
        uint256 indexed tokenId,
        uint256 price
    );
    event ProceedAmountWithdrawn(address indexed seller, uint256 amount);

    ////////////////////
    // Modifiers    ///
    ///////////////////

    modifier notListed(
        address nftAddress,
        uint256 tokenId,
        address seller
    ) {
        Listing memory listing = s_listings[nftAddress][tokenId];
        if (listing.price > 0) {
            revert NftMarketplace__NFT_Already_Listed(nftAddress, tokenId);
            //revert NftMarketplace__NFT_Already_Listed();
        }
        _;
    }

    modifier isOwner(
        address nftAddress,
        uint256 tokenId,
        address seller
    ) {
        IERC721 nft = IERC721(nftAddress);
        address owner = nft.ownerOf(tokenId);
        if (seller != owner) {
            revert NftMarketplace__Seller_Not_NFT_Owner();
        }
        _;
    }

    modifier isListed(address nftAddress, uint256 tokenId) {
        Listing memory listing = s_listings[nftAddress][tokenId];
        if (listing.price <= 0) {
            revert NftMarketplace__NFT_Not_Listed(nftAddress, tokenId);
        }
        _;
    }

    ////////////////////
    // Main Function //
    ///////////////////

    /*
     * @notice Method for Listing your NFT on the marketplace
     * @param _nftAddress: Address of the NFT contract
     * @param _tokenId: Token ID of the NFT
     * @param _price: Price of the NFT
     * @dev Tchnically, we could have the contract be the escrow for the NFTs
     * but this way peeople can still hold on to their NFTs when they list them.
     */

    function listItem(
        address nftAddress,
        uint256 tokenId,
        uint256 price
    )
        external
        notListed(nftAddress, tokenId, msg.sender)
        isOwner(nftAddress, tokenId, msg.sender)
    {
        // 1. Check if the sender is the owner of the NFT
        // 2. Transfer the NFT to the marketplace
        // 3. Add the item to the mapping
        // 4. Emit the event

        if (price <= 0) {
            revert NftMarketplace__Price_Must_Be_Above_Zero();
        }

        // Tow solutions:
        // 1. Send the NFT to the contract. Transfer -> Contract (MarketPlace)"hold" the NFT
        // 2. Owners can hold  on to their NFT, and gives the marketplacr approval
        // to transfer the NFT on their behalf

        IERC721 nft = IERC721(nftAddress); // Wrap the NFT contract in an interface

        // Check this marketplace (this contract being developped) has the necessary approval to transfer the NFT with the given tokenId ?
        // (In the past, NFT owner has already used the NFT contract's "Approve()" function to grant the marketplace contract the approval to transfer the NFT)

        if (nft.getApproved(tokenId) != address(this)) {
            // address(this) is alwaysthe address of the contract being developed
            revert NftMarketplace__NFT_Not_Approved_For_Marketplace();
        }

        s_listings[nftAddress][tokenId] = Listing(price, msg.sender);
        emit ItemListed(msg.sender, nftAddress, tokenId, price);
    }

    /*
     * @notice Method for buying an NFT from the marketplace
     * @param _nftAddress: Address of the NFT contract
     * @param _tokenId: Token ID of the NFT
     * @dev Tchnically, we could have the contract be the escrow for the NFTs
     * but this way peeople can still hold on to their NFTs when they list them.
     */
    function buyItem(
        address nftAddress,
        uint256 tokenId
    ) external payable nonReentrant isListed(nftAddress, tokenId) {
        // payable permits contracts from outside to pay with layer 1 token on this marketplace
        // 1. Check if the NFT is listed
        // 2. Check if the price is correct
        // 3. Transfer the NFT to the buyer
        // 4. Transfer the funds to the seller
        // 5. Remove the listing

        Listing memory listedItem = s_listings[nftAddress][tokenId];
        if (msg.value < listedItem.price) {
            revert NftMarketplace__Price_Not_Met(
                nftAddress,
                tokenId,
                listedItem.price
            );
        }
        // We don't just send the selller the money...?
        // https://fravoll.github.io/solidity-patterns/pull_over_push.html

        // sending the money to user NOT SAFE
        // Have them withdraw the money
        s_proceeds[listedItem.seller] += msg.value;
        delete (s_listings[nftAddress][tokenId]); // remove the listing from the mapping
        IERC721(nftAddress).safeTransferFrom(
            listedItem.seller, // the seller of the item
            msg.sender, // te buyer of the item (the outside contract communicating with this contract)
            tokenId
        );
        emit ItemBought(msg.sender, nftAddress, tokenId, listedItem.price);
    }

    /*
     * @notice Method for Cancelling an NFT listing on the marketplace
     * @param _nftAddress: Address of the NFT contract
     * @param _tokenId: Token ID of the NFT
     * @dev
     */

    function cancelListing(
        address nftAddress,
        uint256 tokenId
    )
        external
        isOwner(nftAddress, tokenId, msg.sender)
        isListed(nftAddress, tokenId)
    {
        delete (s_listings[nftAddress][tokenId]);
        emit ItemCanceled(msg.sender, nftAddress, tokenId);
    }

    /*
     * @notice Method for updating an NFT listing on the marketplace
     * @dev
     * @param _nftAddress: Address of the NFT contract
     * @param _tokenId: Token ID of the NFT
     * @param _newPrice: New price of the NFT
     */

    function updateListing(
        address nftAddress,
        uint256 tokenId,
        uint256 newPrice
    )
        external
        payable
        nonReentrant
        isOwner(nftAddress, tokenId, msg.sender)
        isListed(nftAddress, tokenId)
    {
        if (newPrice <= 0) {
            revert NftMarketplace__Price_Must_Be_Above_Zero();
        }
        s_listings[nftAddress][tokenId].price = newPrice;
        emit ItemListed(msg.sender, nftAddress, tokenId, newPrice);
    }

    /*
     * @notice Method for withdrawing funds from the marketplace
     * @dev
     * @param _amount: Amount to withdraw
     */

    function withdrawProceeds()
        external
        payable
        nonReentrant
    // isOwner(address(0), 0, msg.sender)
    {
        uint256 proceeds = s_proceeds[msg.sender];
        if (proceeds <= 0) {
            revert NftMarketplace__No_Proceeds_Available_To_Withdraw();
        }
        s_proceeds[msg.sender] = 0;
        (bool success, ) = msg.sender.call{value: proceeds}("");
        if (!success) {
            revert NftMarketplace__Withdraw_Failed();
        } else {
            emit ProceedAmountWithdrawn(msg.sender, proceeds);
        }
    }

    ////////////////////
    // Main Function //
    ///////////////////

    function getListing(
        address nftAddress,
        uint256 tokenId
    ) external view returns (Listing memory) {
        return s_listings[nftAddress][tokenId];
    }

    function getProceeds(address seller) external view returns (uint256) {
        return s_proceeds[seller];
    }

    // Function to receive Ether. msg.data must be empty
    receive() external payable {}

    // Fallback function is called when msg.data is not empty
    fallback() external payable {}
}
