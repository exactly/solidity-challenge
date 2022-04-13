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

def transferTokens( addr , amount ):
    if BE_VERBOSE: print( addr," --> ", amount)
    contractInstance = loadContract(abi=CONTRACT_ABI,contractAddress=CONTRACT_ADDRESS)
    if BE_VERBOSE: print( "CONTRACT LOADED --> ", contractInstance)
    account = setupAccount()
    if BE_VERBOSE: print( "WALLET LOADED --> ", account.address)
    trnxToken = sendTokenToAddr(contractInstance,addr,amount=amount,fromAddress=account.address)
    if BE_VERBOSE: print( "TX SENT (HASH) --> ", w3.toHex(trnxToken))
    receipt = w3.eth.wait_for_transaction_receipt(trnxToken)
    return (receipt,w3.toHex(trnxToken))

def closeAuction( auctionID  ):
    if BE_VERBOSE: print( "AuctionID"," --> ", auctionID)
    contractInstance = loadContract(abi=CONTRACT_ABI,contractAddress=CONTRACT_ADDRESS)
    if BE_VERBOSE: print( "CONTRACT LOADED --> ", contractInstance)
    account = setupAccount()
    if BE_VERBOSE: print( "WALLET LOADED --> ", account.address)
    trnxToken = callCloseAuction(contractInstance,auctionId=auctionID,fromAddress=account.address)
    if BE_VERBOSE: print( "TX SENT (HASH) --> ", w3.toHex(trnxToken))
    receipt = w3.eth.wait_for_transaction_receipt(trnxToken)
    return (receipt,w3.toHex(trnxToken))

def closeAuctionNOWAIT( auctionID  ):
    if BE_VERBOSE: print( "AuctionID"," --> ", auctionID)
    contractInstance = loadContract(abi=CONTRACT_ABI,contractAddress=CONTRACT_ADDRESS)
    if BE_VERBOSE: print( "CONTRACT LOADED --> ", contractInstance)
    account = setupAccount()
    if BE_VERBOSE: print( "WALLET LOADED --> ", account.address)
    trnxToken = callCloseAuction(contractInstance,auctionId=auctionID,fromAddress=account.address)
    if BE_VERBOSE: print( "TX SENT (HASH) --> ", w3.toHex(trnxToken))
    #receipt = w3.eth.wait_for_transaction_receipt(trnxToken)
    return w3.toHex(trnxToken)

def transferClo( addr , amount ):
    if BE_VERBOSE: print( addr," --> ", amount)
    account = setupAccount()
    if BE_VERBOSE: print( "WALLET LOADED --> ", account.address)
    trnxToken = sendCloToAddr(addr,fromAddress=account.address)
    if BE_VERBOSE: print( "TX SENT (HASH) --> ", w3.toHex(trnxToken))
    receipt = w3.eth.wait_for_transaction_receipt(trnxToken)
    return (receipt,w3.toHex(trnxToken))

def getABI(fromFile=None):
    if(fromFile is None):
        r = requests.get(url = API_ENDPOINT)
        response = r.json()
        return response["result"]
    else:
        with open(fromFile) as f:
            info_json = json.load(f)
            return info_json

def callTokenHolders(addr):
    if BE_VERBOSE: print( addr," --> ", "tokenHolders")
    contractInstance = loadContract(abi=CONTRACT_ABI,contractAddress=CONTRACT_ADDRESS)
    if BE_VERBOSE: print( "CONTRACT LOADED --> ", contractInstance)
    tokenHoldersResponse = contractInstance.functions.tokenHolders(addr).call()
    return tokenHoldersResponse

def callAuctions(auctionId):
    if BE_VERBOSE: print( auctionId," --> ", "auctionId")
    contractInstance = loadContract(abi=CONTRACT_ABI,contractAddress=CONTRACT_ADDRESS)
    if BE_VERBOSE: print( "CONTRACT LOADED --> ", contractInstance)
    auctionsResponse = contractInstance.functions.auctions(auctionId).call()
    return auctionsResponse

def sendCloToAddr(addr, fromAddress=None):
    # simple example (Web3.py determines gas and fee)
    #transaction = {
    #    'to': addr,
    #    'from': fromAddress,
    #    'value': w3.toWei('1','gwei')
    #}
    #print(transaction)
    #return w3.eth.send_transaction(transaction)
    #get the nonce.  Prevents one from sending the transaction twice
    nonce = w3.eth.getTransactionCount(fromAddress)

    #build a transaction in a dictionary
    tx = {
        'nonce': nonce,
        'to': addr,
        'value': w3.toWei(1, 'ether'),
        'gas': GASLIMIT_CLO_TRANSFER,
        'gasPrice': int(w3.eth.gas_price*1.1)
    }
    #sign the transaction
    signed_tx = w3.eth.account.sign_transaction(tx, PK)

    #send transaction
    tx_hash = w3.eth.sendRawTransaction(signed_tx.rawTransaction)
    return tx_hash

def setupAccount():
    #acct = Account.privateKeyToAccount(PK)
    acct = w3.eth.account.from_key(PK)
    #acct = w3.eth.account.privateKeyToAccount(PK)
    #w3.eth.default_account = acct
    return acct

def sendTokenToAddr(instance,addr, amount,fromAddress=None):
    nonce = w3.eth.getTransactionCount(fromAddress)
    tx = {
        'nonce': nonce,
        #'to': addr,
        #'value': w3.toWei(1, 'ether'),
        'gas': GASLIMIT_TOKEN_TRANSFER,
        'gasPrice': int(w3.eth.gas_price*1.1)
    }
    transaction = instance.functions.transfer(addr,amount).buildTransaction(tx)
    signed_txn = w3.eth.account.sign_transaction(transaction, PK)
    txn_hash = w3.eth.sendRawTransaction(signed_txn.rawTransaction)
    return txn_hash



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