// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IAccount} from "@account-abstraction/contracts/interfaces/IAccount.sol";
import {PackedUserOperation} from "@account-abstraction/contracts/interfaces/PackedUserOperation.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {MessageHashUtils} from "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {SIG_VALIDATION_FAILED, SIG_VALIDATION_SUCCESS} from "@account-abstraction/contracts/core/Helpers.sol";
import {IEntryPoint} from "@account-abstraction/contracts/interfaces/IEntryPoint.sol";

contract MinimalAccount is IAccount, Ownable {
    error MinimalAccount__NotFromEntryPoint();
    error MinimalAccount__NotFromEntryPointOrOwner();
    error MiniamlAccount__CallFailed(bytes);

    IEntryPoint private immutable i_entryPoint;

    modifier requireFromEntryPoint() {
        if (msg.sender != address(i_entryPoint)) {
            revert MinimalAccount__NotFromEntryPoint();
        }
        _;
    }

    modifier requireFromEntryPointOrOwner() {
        if (msg.sender != address(i_entryPoint) && msg.sender != owner()) {
            revert MinimalAccount__NotFromEntryPointOrOwner();
        }
        _;
    }

    constructor(address _entryPoint) Ownable(msg.sender) {
        i_entryPoint = IEntryPoint(_entryPoint);
    }

    receive() external payable {}

    /*
     * @param _dest: The destination address of the call
     * @param _value: The value to be transferred
     * @param _functionData: The function data to be executed
     * @dev This function allows the contract to execute transactions
     * @dev It can only be called by the entry point or the owner
     * @dev It forwards the call to the destination address with the specified value and function data
     */
    function execute(
        address _dest,
        uint256 _value,
        bytes calldata _functionData
    ) external requireFromEntryPointOrOwner {
        (bool success, bytes memory result) = _dest.call{value: _value}(
            _functionData
        );
        if (!success) {
            revert MiniamlAccount__CallFailed(result);
        }
    }

    /*
     * @dev This function validates a user operation by checking the signature and ensuring the account has enough funds to cover the operation
     * @dev It can only be called by the entry point
     */
    // A signture is valid if it's the MinimalAccount owner
    function validateUserOp(
        PackedUserOperation calldata userOp,
        bytes32 userOpHash,
        uint256 missingAccountFunds
    ) external requireFromEntryPoint returns (uint256 validationData) {
        validationData = _validateSignature(userOp, userOpHash);
        _payPrefund(missingAccountFunds);
    }

    /*
     * @dev This internal function validates the signature of the user operation
     * @dev It checks if the recovered signer address matches the owner of the contract
     */
    // EIP-191 version of the signed hash
    function _validateSignature(
        PackedUserOperation calldata userOp,
        bytes32 userOpHash
    ) internal view returns (uint256 validationData) {
        bytes32 ethSignedMessageHash = MessageHashUtils.toEthSignedMessageHash(
            userOpHash
        );
        address signer = ECDSA.recover(ethSignedMessageHash, userOp.signature);
        if (signer != owner()) {
            return SIG_VALIDATION_FAILED;
        }
        return SIG_VALIDATION_SUCCESS;
    }

    /*
     * @dev This internal function transfers the missing funds required for the user operation to the entry point contract
     */
    function _payPrefund(uint256 _missingAccountFunds) internal {
        if (_missingAccountFunds != 0) {
            (bool success, ) = payable(msg.sender).call{
                value: _missingAccountFunds,
                gas: type(uint256).max
            }("");
            (success);
        }
    }

    function getEntryPoint() public view returns (IEntryPoint) {
        return i_entryPoint;
    }
}
