const { network, ethers } = require("hardhat")
const { developmentChains } = require("../helper-hardhat-config")
const { verify } = require("../utils/verify")

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const { deployer: deployerSigner } = await ethers.getNamedSigners()
    const args = []
    log(` NFTMarketplace deployment ...`)
    const nftMarketplace = await deploy("NFTMarketplace", {
        from: deployer,
        args,
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    })

    console.log("NFTMarketplace deployed to:", nftMarketplace.address)
    if (
        !developmentChains.includes(network.name) &&
        process.env.ETHERSCAN_API_KEY
    ) {
        log("verifying on etherscan ...")
        await verify(nftMarketplace.address, args)
    }
    log("✅ Done")
}

module.exports.tags = ["all", "nftmarketplace"]
