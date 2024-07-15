const hre = require("hardhat")
const { Deployer } = require("@matterlabs/hardhat-zksync-deploy")
const { Wallet, utils } = require("zksync-ethers")
const fs = require("fs")
const path = require("path")

module.exports = async () => {
    const wallet = new Wallet(process.env.RICH_ACCOUNTS_PRIVATE_KEY)
    //const wallet = new Wallet(process.env.WALLET_PRIVATE_KEY)
    const deployer = new Deployer(hre, wallet)

    const aaFactoryArtifact = await deployer.loadArtifact("AAFactory")
    const aaTwoUserMultisig = await deployer.loadArtifact("TwoUserMultisigAA")
    
    const bytecodeHash = utils.hashBytecode(aaTwoUserMultisig.bytecode)

    console.log("-----------------------------------")
    
    const deploymentFee = await deployer.estimateDeployFee(aaFactoryArtifact, [bytecodeHash]);
    
    /* const depositHandle = await deployer.zkWallet.deposit({
        token: utils.ETH_ADDRESS,
        amount: deploymentFee * BigInt(2),
        to: deployer.zkWallet.address,
        });
    await depositHandle.waitL1Commit() */
    
    const parsedFee = ethers.formatEther(deploymentFee);
    console.log(`The deployment is estimated to cost ${parsedFee} ETH`);

    console.log("Deploying AAFactory...")
    const aaFactory = await deployer.deploy(
        aaFactoryArtifact,
        [bytecodeHash],
        undefined,
        [aaTwoUserMultisig.bytecode,]
    )

    console.log("-------------------------------------")
    console.log(`AA factory address: ${await aaFactory.getAddress()}`);

    // Updating AAFactory address in address.json
    let addresses = {}

    try {
        addresses = require('../address.json')
    } catch (error) {
        console.error("Error reading existing address file:", error.message)
    }

    const chainId = hre.network.config.chainId
    addresses[chainId] = await aaFactory.getAddress()
    fs.writeFileSync(path.resolve(__dirname, "../address.json"), JSON.stringify(addresses, null, 2))
}

module.exports.tags = ["all", "factory"]