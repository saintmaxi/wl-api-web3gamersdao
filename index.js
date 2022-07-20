const { MerkleTree } = require('merkletreejs')
const keccak256 = require('keccak256')
const { ethers } = require('ethers')
const whitelist = require("./whitelist.json")

const hashedLeaves = whitelist.map(l => ethers.utils.solidityKeccak256(["address", "uint256"], [l.addr, l.qty]));

const tree = new MerkleTree(hashedLeaves, keccak256, {
  sort: true,
  sortLeaves: true,
  sortPairs: true,
});

const root = tree.getHexRoot();

const getProof = async (item) => {
  const proof = tree.getHexProof(ethers.utils.solidityKeccak256(["address", "uint256"], [item.addr, item.qty]));
  return proof;
}

exports.handler = async function (event, context) {
  const headers = {
    "content-type": "application/json",
    "Access-Control-Allow-Origin": "*"
  };

  try {
    let { addr } = event.queryStringParameters || {};
    if (!addr) {
      return { statusCode: 400, headers: headers, body: "Missing query parameters", isBase64Encoded: false };
    }

    let checksumAddr;
    try {
      checksumAddr = ethers.utils.getAddress(addr);
    }
    catch {
      return { statusCode: 200, headers: headers, body: "Invalid address", isBase64Encoded: false };
    }

    let proof;
    let lowercaseAddr = addr.toLowerCase();
    if (whitelist.some(e => e.addr === checksumAddr)) {
      proof = await (getProof(checksumAddr));
    }
    else if (whitelist.some(e => e.addr === checksumAddr)) {
      proof = await (getProof(lowercaseAddr));
    }
    else {
      return { statusCode: 200, headers: headers, body: "Not in whitelist", isBase64Encoded: false };
    }

    return {
      statusCode: 200,
      headers: headers,
      body: JSON.stringify(proof),
      isBase64Encoded: false
    }

  } catch (err) {
    console.log("invocation error:", err);
    return {
      statusCode: 500,
      headers: headers,
      body: err.message,
      isBase64Encoded: false
    };
  }
};
