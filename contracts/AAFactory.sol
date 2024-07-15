// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@matterlabs/zksync-contracts/l2/system-contracts/Constants.sol";
import "@matterlabs/zksync-contracts/l2/system-contracts/libraries/SystemContractsCaller.sol";

contract AAFactory {
    error AAFactory__AccountDeployerFailed();

    bytes32 public aaBytecodeHash;

    constructor(bytes32 _aaBytecodeHash) {
        aaBytecodeHash = _aaBytecodeHash;
    }

    function deployAccount(
        bytes32 _salt,
        address _owner1,
        address _owner2
    ) external returns (address accountAddress) {
        (bool success, bytes memory returnData) = SystemContractsCaller
            .systemCallWithReturndata(
                uint32(gasleft()),
                address(DEPLOYER_SYSTEM_CONTRACT),
                uint128(0),
                abi.encodeCall(
                    DEPLOYER_SYSTEM_CONTRACT.create2Account,
                    (
                        _salt,
                        aaBytecodeHash,
                        abi.encode(_owner1, _owner2),
                        IContractDeployer.AccountAbstractionVersion.Version1
                    )
                )
            );

        if (!success) {
            revert AAFactory__AccountDeployerFailed();
        }

        (accountAddress) = abi.decode(returnData, (address));
    }
}
