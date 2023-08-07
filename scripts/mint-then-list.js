const { ethers, network } = require("hardhat")
const { moveBlocks } = require("../utils/move-blocks")

async function mintAndList() {
    // To excute this script on localhost, run the following command:
    // 1. Start a local node: yarn hardhat node
    // 2. On a different terminal : Yarn hardhat run scripts/mint-and-list.js --network localhost
    // const PRICE = ethers.utils.parseEther(
    //     Math.floor(Math.random() * 10).toString()
    // )
    let randomPrice = Math.random() * 10
    const PRICE =
        randomPrice > 0
            ? ethers.utils.parseEther(randomPrice.toString())
            : ethers.utils.parseEther("0.1")

    const nftMarketplace = await ethers.getContract("NFTMarketplace")
    //const basicNFT = await ethers.getContract("BasicNFT")
    const randomNumber = Math.floor(Math.random() * 2)

    let basicNft
    if (randomNumber == 1) {
        basicNft = await ethers.getContract("BasicNFTTwo")
    } else {
        basicNft = await ethers.getContract("BasicNFT")
    }

    console.log("Minting NFT...")
    const mintTx = await basicNft.mintNft()
    const mintTXreceipt = await mintTx.wait(1)
    const tokenId = mintTXreceipt.events[0].args.tokenId
    const tokenURI = await basicNft.tokenURI(tokenId)
    console.log(
        "Minted NFT with tokenId",
        tokenId.toNumber(),
        "and tokenURI",
        tokenURI
    )

    console.log("Approving NFT Marketplace...")
    const approveTx = await basicNft.approve(nftMarketplace.address, tokenId)
    await approveTx.wait(1)
    console.log("Listing NFT...")
    const listingTx = await nftMarketplace.listItem(
        basicNft.address,
        tokenId.toNumber(),
        PRICE
    )
    await listingTx.wait(1)

    console.log("Listed NFT ..")
    if (network.config.chainId == 31337) {
        // Moralis has a hard time if you move more than 1 at once!
        await moveBlocks(1, (sleepAmount = 1000))
    }
}

mintAndList()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
