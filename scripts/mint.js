const { ethers, network } = require("hardhat")
const { moveBlocks } = require("../utils/move-blocks")

async function mint() {
    //
    const randomNumber = Math.floor(Math.random() * 2)
    //
    let basicNft
    if (randomNumber == 1) {
        basicNft = await ethers.getContract("BasicNFTTwo")
    } else {
        basicNft = await ethers.getContract("BasicNFT")
    }
    //
    console.log("Minting NFT...")
    const mintTx = await basicNft.mintNft()
    const mintTXreceipt = await mintTx.wait(1)
    const tokenId = mintTXreceipt.events[0].args.tokenId
    console.log(`Minted NFT with tokenId ${tokenId.toNumber()}`)
    console.log(`NFT Address: ${basicNft.address}`)
    //
    if (network.config.chainId == 31337) {
        // Moralis has a hard time if you move more than 1 at once!
        await moveBlocks(1, (sleepAmount = 1000))
    }
}

mint()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
