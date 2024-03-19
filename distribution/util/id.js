const assert = require('assert');
var crypto = require('crypto');

// The ID is the SHA256 hash of the JSON representation of the object
function getID(obj) {
  const hash = crypto.createHash('sha256');
  hash.update(JSON.stringify(obj));
  return hash.digest('hex');
}

// The NID is the SHA256 hash of the JSON representation of the node
function getNID(node) {
  node = {ip: node.ip, port: node.port};
  return getID(node);
}

// The SID is the first 5 characters of the NID
function getSID(node) {
  return getNID(node).substring(0, 5);
}


function idToNum(id) {
  let n = parseInt(id, 16);
  assert(!isNaN(n), 'idToNum: id is not in KID form!');
  return n;
}

function naiveHash(kid, nids) {
  nids.sort();
  return nids[idToNum(kid) % nids.length];
}

function consistentHash(kid, nids) {
  const kidNum = parseInt(kid.substring(0, 16), 16);
  const nidsNum = nids.map((nid) =>
    ({nid, num: parseInt(nid.substring(0, 16), 16)}));

  // Combine and sort the list based on the numerical representation
  const combined = nidsNum.concat({nid: kid, num: kidNum});
  combined.sort((a, b) => a.num - b.num);

  // Find the element right after the one corresponding to KID
  const index = combined.findIndex((element) => element.nid === kid);
  const nextIndex = (index + 1) % combined.length;

  // Return the NID of the next element
  return combined[nextIndex].nid;
}


function rendezvousHash(kid, nids) {
  let maxHash = null;
  let chosenNID = null;

  nids.forEach((nid) => {
    // Concatenate KID and NID
    const combinedValue = kid + nid;
    // Hash the combined value
    const hash = getID(combinedValue);

    const numericalHash = parseInt(hash.substring(0, 16), 16);

    // Check if this is the highest hash value so far
    if (maxHash === null || numericalHash > maxHash) {
      maxHash = numericalHash;
      chosenNID = nid;
    }
  });

  return chosenNID;
}

module.exports = {
  getNID: getNID,
  getSID: getSID,
  getID: getID,
  idToNum: idToNum,
  naiveHash: naiveHash,
  consistentHash: consistentHash,
  rendezvousHash: rendezvousHash,
};
