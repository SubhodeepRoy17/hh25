const { ethers } = require("hardhat");
const { writeFileSync, existsSync, mkdirSync } = require("fs");
const { artifacts } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  const FoodShare = await ethers.getContractFactory("FoodShare");
  const foodShare = await FoodShare.deploy();

  await foodShare.deployed();

  console.log("FoodShare contract deployed to:", foodShare.address);
  
  // Save deployment address to a file for frontend use
  const contractsDir = "./constants";
  
  if (!existsSync(contractsDir)) {
    mkdirSync(contractsDir, { recursive: true });
  }
  
  writeFileSync(
    contractsDir + "/contract-address.json",
    JSON.stringify({ FoodShare: foodShare.address }, undefined, 2)
  );
  
  console.log("Contract address saved to constants/contract-address.json");
  
  // Get the contract artifact using Hardhat's artifacts system
  try {
    const FoodShareArtifact = await artifacts.readArtifact("FoodShare");
    
    writeFileSync(
      contractsDir + "/FoodShare.json",
      JSON.stringify(FoodShareArtifact, null, 2)
    );
    
    console.log("Contract ABI saved to constants/FoodShare.json");
  } catch (error) {
    console.log("Note: Could not save contract artifact. Run 'npx hardhat compile' first to generate artifacts.");
    console.log("Error:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });