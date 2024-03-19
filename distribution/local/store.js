var fs = require('fs');
var path = require('path');
var serialization = require('../util/serialization');
var id = require('../util/id');

// Define a base directory for stored data; adjust as needed.
const dataDir = path.join(__dirname, 'store');
const baseDir = path.join(dataDir, 'default_gid');

// Ensure the base directory exists
if (!fs.existsSync(baseDir)) {
  fs.mkdirSync(baseDir, {recursive: true});
}

const logFilePath = path.join(__dirname, 'get_requests.log');
// Function to append logs to the file
function appendLog(message) {
  // Include a timestamp and format the message
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] ${message}\n`;

  // Append the log entry to the file
  fs.appendFile(logFilePath, logEntry, (err) => {
    if (err) {
      console.error('Failed to write to log file:', err);
    }
  });
}


function sanitizeKey(key) {
  // Ensure key is treated as a string
  return String(key).replace(/[^a-zA-Z0-9]/g, '_');
}

function getFilePath(key) {
  return path.join(baseDir, sanitizeKey(key));
}

function put(value, key, callback) {
  console.log('Calling PUT');
  if (key === null) {
    key = id.getID(value);
  } else {
    key = sanitizeKey(key);
  }
  const filePath = getFilePath(key);
  fs.writeFile(filePath, serialization.serialize(value), (err) => {
    if (err) return callback(err, null);
    callback(null, value);
  });
}

function get(key, callback) {
  appendLog('Calling local');
  if (key === null) {
    appendLog('GET request with null key');
    // Fetch and return all keys if the key is null
    fs.readdir(baseDir, (err, files) => {
      if (err) {
        callback(err, null);
      } else {
        appendLog(`Files: ${files}`);
        // Files array contains the names of all files in the directory
        callback(null, files);
      }
    });
  } else {
    // Check if 'key' is an object and has a 'key' property
    let actualKey = key;
    if (typeof key === 'object' && key.key) {
      appendLog(`Attempting to retrieve key from object: ${key.key}`);
      actualKey = key.key;
    } else {
      appendLog(`Attempting to retrieve key: ${actualKey}`);
    }

    const filePath = getFilePath(actualKey);

    fs.readFile(filePath, (err, data) => {
      if (err) {
        if (err.code === 'ENOENT') {
          appendLog(`Key not found: ${actualKey}`);
          callback(new Error('Key not found'), null);
        } else {
          appendLog(`Error reading file for key ${actualKey}: ${err}`);
          callback(err, null);
        }
      } else {
        appendLog(`Successfully retrieved key: ${actualKey}`);
        callback(null, serialization.deserialize(data.toString()));
      }
    });
  }
}

function del(key, callback) {
  const filePath = getFilePath(key);
  // First, read the file to get the object to return it after deletion.
  fs.readFile(filePath, (readErr, data) => {
    if (readErr) {
      if (readErr.code === 'ENOENT') {
        callback(new Error('Key not found'), null);
      } else {
        callback(readErr, null);
      }
    } else {
      // Proceed to delete the file now that we have the data.
      fs.unlink(filePath, (unlinkErr) => {
        if (unlinkErr) {
          callback(unlinkErr, null);
        } else {
          // Deserialize the data before sending it back.
          const obj = serialization.deserialize(data.toString());
          callback(null, obj);
        }
      });
    }
  });
}

// Directly export the put, get, and del functions.
module.exports = {put, get, del};
