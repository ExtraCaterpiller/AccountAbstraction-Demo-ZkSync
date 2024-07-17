# Account Abstraction ZkSync
This is a demo of Account Abstraction in zksync. I followed the zksync official tutorial to get familiar with the account abstraction and its uses.
To run:
1. Clone the repo
2. Install the dependencies:
```
npm install
```
3. Fix environment variables:
```
WALLET_PRIVATE_KEY = <private key of your metamask wallet>
RICH_ACCOUNTS_PRIVATE_KEY = <private key of any zksync inmemory node account>
```
4. Run:
```
npx hardhat node-zksync
```
open another terminal and run:
```
npx hardhat deploy-zksync
```
This will run it in local in memory zksync node
