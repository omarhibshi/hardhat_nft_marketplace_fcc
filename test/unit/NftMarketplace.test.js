const { assert, expect } = require("chai")
const { network, deployments, ethers } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("Nft Marketplace Unit Tests", function () {
          let nftMarketplace, nftMarketplaceContract, basicNft, basicNftContract
          const PRICE = ethers.utils.parseEther("0.1")
          const TOKEN_ID = 0

          beforeEach(async () => {
              accounts = await ethers.getSigners() // could also do with getNamedAccounts
              deployer = accounts[0]
              user = accounts[1]
              await deployments.fixture(["all"])
              nftMarketplaceContract = await ethers.getContract(
                  "NFTMarketplace"
              )
              nftMarketplace = nftMarketplaceContract.connect(deployer)
              basicNftContract = await ethers.getContract("BasicNFT")
              basicNft = basicNftContract.connect(deployer)
              await basicNft.mintNft()
              await basicNft.approve(nftMarketplaceContract.address, TOKEN_ID)
          })

          describe("listItem", function () {
              it("emits an event after listing an item", async function () {
                  expect(
                      await nftMarketplace.listItem(
                          basicNft.address,
                          TOKEN_ID,
                          PRICE
                      )
                  ).to.emit("ItemListed")
              })
              it("exclusively items that have been already listed", async function () {
                  await nftMarketplace.listItem(
                      basicNft.address,
                      TOKEN_ID,
                      PRICE
                  )
                  //const error = `NftMarketplace__NFT_Already_Listed ("${basicNft.address}", ${TOKEN_ID})`
                  const error = "NftMarketplace__NFT_Already_Listed"
                  await expect(
                      nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
                  ).to.be.revertedWithCustomError(nftMarketplace, error)
              })
              it("exclusively allows owners to list", async function () {
                  nftMarketplace = nftMarketplaceContract.connect(user)
                  await basicNft.approve(user.address, TOKEN_ID)
                  const error = "NftMarketplace__Seller_Not_NFT_Owner"
                  await expect(
                      nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
                  ).to.be.revertedWithCustomError(nftMarketplaceContract, error)
              })
              it("needs approvals to list item", async function () {
                  await basicNft.approve(ethers.constants.AddressZero, TOKEN_ID) // approving the zero address ('to' = address(0) sol) clears previous approvals.
                  const error =
                      "NftMarketplace__NFT_Not_Approved_For_Marketplace"
                  await expect(
                      nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
                  ).to.be.revertedWithCustomError(nftMarketplace, error)
              })
              it("Updates listing with seller and price", async function () {
                  await nftMarketplace.listItem(
                      basicNft.address,
                      TOKEN_ID,
                      PRICE
                  )
                  const listing = await nftMarketplace.getListing(
                      basicNft.address,
                      TOKEN_ID
                  )
                  //assert(listing.price.toString() == PRICE.toString())
                  //assert(listing.seller.toString() == deployer.address)
                  await expect(
                      nftMarketplace.updateListing(
                          basicNft.address,
                          TOKEN_ID,
                          ethers.utils.parseEther("0.3")
                      )
                  ).to.emit(nftMarketplace, "ItemPriceUpdated")
              })
              it("reverts if the price be 0", async () => {
                  const ZERO_PRICE = ethers.utils.parseEther("0")
                  await expect(
                      nftMarketplace.listItem(
                          basicNft.address,
                          TOKEN_ID,
                          ZERO_PRICE
                      )
                  ).revertedWithCustomError(
                      nftMarketplace,
                      "NftMarketplace__Price_Must_Be_Above_Zero"
                  )
              })
          })
          describe("cancelListing", function () {
              it("reverts if there is no listing", async function () {
                  //const error = `NftMarketplace__NFT_Not_Listed ("${basicNft.address}", ${TOKEN_ID})`
                  const error = "NftMarketplace__NFT_Not_Listed"
                  await expect(
                      nftMarketplace.cancelListing(basicNft.address, TOKEN_ID)
                  ).to.be.revertedWithCustomError(nftMarketplace, error)
              })
              it("reverts if anyone but the owner tries to call", async function () {
                  await nftMarketplace.listItem(
                      basicNft.address,
                      TOKEN_ID,
                      PRICE
                  )
                  nftMarketplace = nftMarketplaceContract.connect(user)
                  await basicNft.approve(user.address, TOKEN_ID)
                  await expect(
                      nftMarketplace.cancelListing(basicNft.address, TOKEN_ID)
                  ).to.be.revertedWithCustomError(
                      nftMarketplace,
                      "NftMarketplace__Seller_Not_NFT_Owner"
                  )
              })
              it("emits event and removes listing", async function () {
                  await nftMarketplace.listItem(
                      basicNft.address,
                      TOKEN_ID,
                      PRICE
                  )
                  expect(
                      await nftMarketplace.cancelListing(
                          basicNft.address,
                          TOKEN_ID
                      )
                  ).to.emit("ItemCanceled")
                  const listing = await nftMarketplace.getListing(
                      basicNft.address,
                      TOKEN_ID
                  )
                  assert(listing.price.toString() == "0")
              })
          })
          describe("buyItem", function () {
              it("reverts if the item isnt listed", async function () {
                  await expect(
                      nftMarketplace.buyItem(basicNft.address, TOKEN_ID)
                  ).to.be.revertedWithCustomError(
                      nftMarketplace,
                      "NftMarketplace__NFT_Not_Listed"
                  )
              })
              it("reverts if the price isnt met", async function () {
                  await nftMarketplace.listItem(
                      basicNft.address,
                      TOKEN_ID,
                      PRICE
                  )
                  await expect(
                      nftMarketplace.buyItem(basicNft.address, TOKEN_ID)
                  ).to.be.revertedWithCustomError(
                      nftMarketplace,
                      "NftMarketplace__Price_Not_Met"
                  )
              })
              it("transfers the nft to the buyer and updates internal proceeds record", async function () {
                  await nftMarketplace.listItem(
                      basicNft.address,
                      TOKEN_ID,
                      PRICE
                  )
                  nftMarketplace = nftMarketplaceContract.connect(user)
                  expect(
                      await nftMarketplace.buyItem(basicNft.address, TOKEN_ID, {
                          value: PRICE,
                      })
                  ).to.emit("ItemBought")
                  const newOwner = await basicNft.ownerOf(TOKEN_ID)
                  const deployerProceeds = await nftMarketplace.getProceeds(
                      deployer.address
                  )
                  assert(newOwner.toString() == user.address)
                  assert(deployerProceeds.toString() == PRICE.toString())
              })
          })
          describe("updateListing", function () {
              it("must be owner and listed", async function () {
                  await expect(
                      nftMarketplace.updateListing(
                          basicNft.address,
                          TOKEN_ID,
                          PRICE
                      )
                  ).to.be.revertedWithCustomError(
                      nftMarketplace,
                      "NftMarketplace__NFT_Not_Listed"
                  )
                  await nftMarketplace.listItem(
                      basicNft.address,
                      TOKEN_ID,
                      PRICE
                  )
                  nftMarketplace = nftMarketplaceContract.connect(user)
                  await expect(
                      nftMarketplace.updateListing(
                          basicNft.address,
                          TOKEN_ID,
                          PRICE
                      )
                  ).to.be.revertedWithCustomError(
                      nftMarketplace,
                      "NftMarketplace__Seller_Not_NFT_Owner"
                  )
              })
              it("reverts if new price is 0", async function () {
                  const updatedPrice = ethers.utils.parseEther("0")
                  await nftMarketplace.listItem(
                      basicNft.address,
                      TOKEN_ID,
                      PRICE
                  )
                  await expect(
                      nftMarketplace.updateListing(
                          basicNft.address,
                          TOKEN_ID,
                          updatedPrice
                      )
                  ).to.be.revertedWithCustomError(
                      nftMarketplace,
                      "NftMarketplace__Price_Must_Be_Above_Zero"
                  )
              })
              it("updates the price of the item", async function () {
                  const updatedPrice = ethers.utils.parseEther("0.2")
                  await nftMarketplace.listItem(
                      basicNft.address,
                      TOKEN_ID,
                      PRICE
                  )
                  expect(
                      await nftMarketplace.updateListing(
                          basicNft.address,
                          TOKEN_ID,
                          updatedPrice
                      )
                  ).to.emit("ItemListed")
                  const listing = await nftMarketplace.getListing(
                      basicNft.address,
                      TOKEN_ID
                  )
                  assert(listing.price.toString() == updatedPrice.toString())
              })
          })
          describe("withdrawProceeds", function () {
              it("doesn't allow 0 proceed withdrawls", async function () {
                  //nftMarketplace = nftMarketplaceContract.connect(user)
                  const proceeds = await nftMarketplace.getProceeds(
                      user.address
                  )
                  await expect(
                      nftMarketplace.withdrawProceeds()
                  ).to.be.revertedWithCustomError(
                      nftMarketplace,
                      "NftMarketplace__No_Proceeds_Available_To_Withdraw"
                  )
              })
              it("withdraws proceeds", async function () {
                  await nftMarketplace.listItem(
                      basicNft.address,
                      TOKEN_ID,
                      PRICE
                  )
                  nftMarketplace = nftMarketplaceContract.connect(user)
                  await nftMarketplace.buyItem(basicNft.address, TOKEN_ID, {
                      value: PRICE,
                  })
                  nftMarketplace = nftMarketplaceContract.connect(deployer)

                  const deployerProceedsBefore =
                      await nftMarketplace.getProceeds(deployer.address)
                  const deployerBalanceBefore = await deployer.getBalance()
                  const txResponse = await nftMarketplace.withdrawProceeds()
                  const transactionReceipt = await txResponse.wait(1)
                  const { gasUsed, effectiveGasPrice } = transactionReceipt
                  const gasCost = gasUsed.mul(effectiveGasPrice)
                  const deployerBalanceAfter = await deployer.getBalance()
                  //      after balanace  = balance before + proceeds - gas cost
                  // =>  after balanace + gas cost === balance before + proceeds
                  assert(
                      deployerBalanceAfter.add(gasCost).toString() ==
                          deployerProceedsBefore
                              .add(deployerBalanceBefore)
                              .toString()
                  )
              })
          })
      })
