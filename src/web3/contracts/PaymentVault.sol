// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract PaymentVault {
    mapping(address => uint256) public deposits;
    event Deposited(address indexed user, uint256 amount, uint256 newBalance);
    event Withdrawn(address indexed user, uint256 amount, uint256 remainingBalance);
    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }
    function balanceOf(address user) external view returns (uint256) {
     
    function balanceOf(address user) external view returns (uint256) {
        return deposits[user];
    }

    
    function deposit() external payable {
        require(msg.value > 0, "Deposit amount must be greater than zero");
        deposits[msg.sender] += msg.value;
        emit Deposited(msg.sender, msg.value, deposits[msg.sender]);
    }

    
    function withdraw(uint256 amount) external {
        require(amount > 0, "Withdraw amount must be greater than zero");
        require(deposits[msg.sender] >= amount, "Insufficient deposited balance");

        deposits[msg.sender] -= amount;

        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "ETH transfer failed");

        emit Withdrawn(msg.sender, amount, deposits[msg.sender]);
    }

    
    receive() external payable {
        deposits[msg.sender] += msg.value;
        emit Deposited(msg.sender, msg.value, deposits[msg.sender]);
    }
}
