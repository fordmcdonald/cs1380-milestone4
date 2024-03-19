// store.js
var fs = require('fs');
var path = require('path');
var serialization = require('../util/serialization');
var id = require('../util/id');

// Specify the path to the log file
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

function createStoreService({gid}) {
  const baseDir = path.join(__dirname, 'store', gid);

  // Ensure base directory exists
  if (!fs.existsSync(baseDir)) {
    fs.mkdirSync(baseDir, {recursive: true});
  }

  function sanitizeKey(key) {
    // Ensure key is treated as a string
    return String(key).replace(/[^a-zA-Z0-9]/g, '_');
  }

  function getFilePath(key) {
    return path.join(baseDir, sanitizeKey(key));
  }

  function put(value, key, callback) {
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
    if (key === null) {
      appendLog('GET request with null key');
      // Fetch and return all keys if the key is null
      fs.readdir(baseDir, (err, files) => {
        if (err) {
          callback(err, null);
        } else {
          // Files array contains the names of all files in the directory,
          // which are the keys of stored objects
          appendLog(`Files all store: ${files}`);
          callback({}, files);
        }
      });
    } else {
      const filePath = getFilePath(key);
      appendLog(`Attempting to retrieve key: ${JSON.stringify(key)}`);
      fs.readFile(filePath, (err, data) => {
        if (err) {
          if (err.code === 'ENOENT') {
            appendLog(`Key not found: ${key}`); // Log key not found
            callback(new Error('Key not found'), null);
          } else {
            appendLog(`Error reading file for key ${key}: ${err}`);
            callback(err, null);
          }
        } else {
          appendLog(`Successfully retrieved key: ${key}`);
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

  function reconf(oldGroup, callback) {
    // Step 1: Fetch all keys.
    this.get(null, (error, keys) => {
      const relocatedObjects = [];

      // Step 2: Determine objects to be relocated.
      keys.forEach((key) => {
        const oldNodeId = id.naiveHash(id.getID(key),
            oldGroup.nodes.map((node) => id.getNID(node)));
        const newNodeId = id.naiveHash(id.getID(key),
            this.nodes.map((node) => id.getNID(node)));

        if (oldNodeId !== newNodeId) {
          // This object needs to be relocated.
          relocatedObjects.push(key);
        }
      });

      // Step 3: Relocate each necessary object.
      const relocateNext = () => {
        if (relocatedObjects.length === 0) {
          // All necessary objects have been relocated. Call the callback.
          callback(null, 'Reconfiguration complete');
          return;
        }

        const key = relocatedObjects.shift();
        this.get(key, (getError, object) => {
          if (getError) {
            console.error(`Error fetching object for key ${key}:`, getError);
            return;
          }

          // Delete the object from the current node.
          this.del(key, (delError) => {
            if (delError) {
              console.error(`Error deleting object for key ${key}:`, delError);
              return;
            }

            // Put the object on its new node.
            this.put(object, key, (putError, v) => {
              if (putError) {
                console.error(`Error putting object for key 
                    ${key} on new node:`, putError);
                return;
              }

              // Object relocated, move to the next one.
              relocateNext();
            });
          });
        });
      };

      // Start relocating objects.
      relocateNext();
    });
  }


  return {get, put, del, reconf};
}

module.exports = createStoreService;
