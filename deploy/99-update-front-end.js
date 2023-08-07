const { ethers } = require("hardhat")
const fs = require("fs-extra")
const { FRONT_END_CONTRACTS_FILE } = require("../helper-hardhat-config")
const { FRONT_END_ABI_FILE } = require("../helper-hardhat-config")

module.exports = async function () {
    if (process.env.UPDATE_FRONT_END) {
        console.log("Updating front end")
        await updateContractAddresses()
        await updateAbi()
        //await updateAbi()
        console.log("Front end written!")
    }
}

async function updateAbi() {
    const nftMarketplace = await ethers.getContract("NFTMarketplace")
    fs.writeFileSync(
        `${FRONT_END_ABI_FILE}NFTMarketplace.json`,
        nftMarketplace.interface.format(ethers.utils.FormatTypes.json)
    )

    const basicNft = await ethers.getContract("BasicNFT")
    fs.writeFileSync(
        `${FRONT_END_ABI_FILE}BasicNFT.json`,
        basicNft.interface.format(ethers.utils.FormatTypes.json)
    )
}

async function updateContractAddresses() {
    const chainId = network.config.chainId.toString()
    const nftMarketplace = await ethers.getContract("NFTMarketplace")
    const JSONContent = fs.readFileSync(FRONT_END_CONTRACTS_FILE, "utf8")
    const contractAddresses = JSON.parse(JSONContent)

    if (chainId in contractAddresses) {
        if (
            !contractAddresses[chainId]["NFTMarketplace"].includes(
                nftMarketplace.address
            )
        ) {
            contractAddresses[chainId]["NFTMarketplace"].push(
                nftMarketplace.address
            )
        }
    } else {
        contractAddresses[chainId] = {
            NFTMarketplace: [nftMarketplace.address],
        }
    }
    fs.writeFileSync(
        FRONT_END_CONTRACTS_FILE,
        JSON.stringify(contractAddresses, null, 4)
    )
}

module.exports.tags = ["all", "frontend"]
