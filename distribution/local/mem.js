var crypto = require('crypto');
var serialization = require('../util/serialization');
var id = require('../util/id')

// Shared storage for all instances, ensuring "node-local" behavior within the process.
let storage = new Map();

function generateKey(object) {
    const dataString = serialization.serialize(object); // Assuming this serializes your object into a string
    return crypto.createHash('sha256').update(dataString).digest('hex');
}

function put(value, key, callback) {
    // If no key is explicitly provided, use the SHA-256 hash of the serialized object as the key.
    if (!key) {
        key = id.getID(value);
    }
    storage.set(key, value);
    callback(null, value); // Return the original object as required by the test case.
}

function get(key, callback) {
    if (key === null) {
        // Return all keys as an array if the key is null
        const allKeys = Array.from(storage.keys());
        callback(null, allKeys);
    } else if (storage.has(key)) {
        callback(null, storage.get(key));
    } else {
        callback(new Error('Key not found'), null);
    }
}

function del(key, callback) {
    if (storage.has(key)) {
        const value = storage.get(key);
        storage.delete(key);
        callback(null, value); // Return the deleted object.
    } else {
        callback(new Error('Key not found'), null);
    }
}

// Directly export the put, get, and del functions.
module.exports = { put, get, del };
