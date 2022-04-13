#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""Script para testear Web3 for Python , invocar el contrato y ver el saldo"""

__author__ = "Matías Araujo"
__copyright__ = "Copyright 2021, RLLabs LLC"
__credits__ = ["Erik", "El Barto"]
__license__ = "GPL"
__version__ = "0.0.1"
__maintainer__ = "Matías Araujo"
__email__ = ["matias.araujo@outlook.com"]
__status__ = "Development"

# SOURCE: https://stackoverflow.com/questions/1523427/what-is-the-common-header-format-of-python-files

#Imports:
from web3 import Web3
from eth_account import Account
import requests
import sys
import logging
import json
import pprint


# Configs:
#logging.basicConfig(level=logging.DEBUG)


# Constantes 
BE_VERBOSE = True
WALLET_MATI = "0xeC11B5Da844605b40c2e1f4201e9e4531648b582"
ETHEREUM_EXPLORER_URL = "https://ropsten.etherscan.io/api"
ETHEREUM_EXPLORER_API = "https://api-ropsten.etherscan.io/api"

#FIXME: Está tomado prestado del explorer
CONTRACT_ADDRESS = "0x40985d7C0357e31332860FfdeA279e23Ec0d5fC3" #Esta es la dirección final
API_ENDPOINT = ETHEREUM_EXPLORER_API+"?module=contract&action=getabi&address="+str(CONTRACT_ADDRESS)
CONTRACT_ABI = "contractAbi.json"

# Seed from file
mnemonic_file = open('..\.secrets', 'r')
mnemonic = mnemonic_file.read()
mnemonic_file.close()

# Infura Key
infura_file = open('..\.infurakey', 'r')
infura_key = infura_file.read()
infura_file.close()

INFURA_RPC_URL = "https://ropsten.infura.io/v3/"+infura_key

#Local: 
#INFURA_RPC_URL = "http://127.0.0.1:8545"
#CONTRACT_ADDRESS = "0xF86028676549f778d2b4EC618f9C69d4b24B9016"

#Address:

#GAS LIMITS:
GASLIMIT_TOKEN_TRANSFER=70000

#Globales para inicializar:

w3= None


def connectToCallisto():
    CloW3 = Web3(Web3.HTTPProvider(INFURA_RPC_URL))
    print("Connected? {}".format(CloW3.isConnected()))
    return CloW3

def loadContract(abi, contractAddress):
    contractAbi = getABI(fromFile=abi)
    contractInstance = w3.eth.contract(
        address=contractAddress,
        abi= contractAbi
    )
    return contractInstance

def getBalanceOfWalletInnovacion(CloW3):
    print("Balance of Wallet Test: {} ropstenETH".format(
        Web3.fromWei(CloW3.eth.get_balance(WALLET_MATI),'ether')))

def getBalanceOfPool( instance ):
    balance = instance.functions.poolStatus().call()
    return balance

def checkAddress(addr):
    return w3.isAddress(addr)


def getABI(fromFile=None):
    if(fromFile is None):
        r = requests.get(url = API_ENDPOINT)
        response = r.json()
        return response["result"]
    else:
        with open(fromFile) as f:
            info_json = json.load(f)
            return info_json

def setupAccount():
    #acct = Account.privateKeyToAccount(PK)
    acct = w3.eth.account.from_key(PK)
    #acct = w3.eth.account.privateKeyToAccount(PK)
    #w3.eth.default_account = acct
    return acct

w3 = connectToCallisto()

if __name__ == "__main__":
    getBalanceOfWalletInnovacion(w3)
    print("Ahora vamos al contrato...")
    contractInstance = loadContract(abi=CONTRACT_ABI,contractAddress=CONTRACT_ADDRESS)


    balanceTokens = getBalanceOfPool(contractInstance)
    poolBalance =  balanceTokens[0]
    rewardsBalance = balanceTokens[1]
    lastRewardMultiplied = balanceTokens[2]
    rewardsCount = balanceTokens[3]
    lastRewardTime = balanceTokens[4]
    status = balanceTokens[5]
    print('Pool Balance: {}'.format(Web3.fromWei(poolBalance,'wei')))
    print('Rewards Balance: {}'.format(Web3.fromWei(rewardsBalance,'wei')))
    print('Last Reward Multiplied: {}'.format(Web3.fromWei(lastRewardMultiplied,'wei')))
    print('Rewards count: {}'.format(Web3.fromWei(rewardsCount,'wei')))
    print('Last Reward Time: {}'.format(Web3.fromWei(lastRewardTime,'wei')))
    print('Status: {}'.format(status))