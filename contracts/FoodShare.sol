// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract FoodShare {
    struct FoodListing {
        uint256 id;
        address donor;
        string title;
        string description;
        uint256 quantity;
        uint256 expiry;
        string location;
        bool isClaimed;
        address claimedBy;
        uint256 claimedAt;
    }

    uint256 private listingIdCounter;
    mapping(uint256 => FoodListing) public foodListings;
    mapping(address => uint256[]) public donorListings;
    mapping(address => uint256[]) public receiverClaims;

    event FoodListed(
        uint256 indexed id,
        address indexed donor,
        string title,
        uint256 quantity,
        uint256 expiry
    );

    event FoodClaimed(
        uint256 indexed id,
        address indexed donor,
        address indexed receiver,
        uint256 claimedAt
    );

    function listFood(
        string memory _title,
        string memory _description,
        uint256 _quantity,
        uint256 _expiry,
        string memory _location
    ) external returns (uint256) {
        listingIdCounter++;
        
        foodListings[listingIdCounter] = FoodListing({
            id: listingIdCounter,
            donor: msg.sender,
            title: _title,
            description: _description,
            quantity: _quantity,
            expiry: _expiry,
            location: _location,
            isClaimed: false,
            claimedBy: address(0),
            claimedAt: 0
        });

        donorListings[msg.sender].push(listingIdCounter);

        emit FoodListed(
            listingIdCounter,
            msg.sender,
            _title,
            _quantity,
            _expiry
        );

        return listingIdCounter;
    }

    function claimFood(uint256 _listingId) external {
        require(foodListings[_listingId].id != 0, "Listing does not exist");
        require(!foodListings[_listingId].isClaimed, "Food already claimed");
        require(foodListings[_listingId].expiry > block.timestamp, "Food has expired");

        foodListings[_listingId].isClaimed = true;
        foodListings[_listingId].claimedBy = msg.sender;
        foodListings[_listingId].claimedAt = block.timestamp;

        receiverClaims[msg.sender].push(_listingId);

        emit FoodClaimed(
            _listingId,
            foodListings[_listingId].donor,
            msg.sender,
            block.timestamp
        );
    }

    function getDonorListings(address _donor) external view returns (uint256[] memory) {
        return donorListings[_donor];
    }

    function getReceiverClaims(address _receiver) external view returns (uint256[] memory) {
        return receiverClaims[_receiver];
    }

    function getFoodListing(uint256 _listingId) external view returns (FoodListing memory) {
        return foodListings[_listingId];
    }

    function getTotalListings() external view returns (uint256) {
        return listingIdCounter;
    }
}