var id = require('../util/id');

// This is the main function that will be exported. It accepts a config object.
function createStorageService({gid}) {
  let storage = new Map();


  // Define the put, get, and del methods inside the main function.
  function put(value, key, callback) {
    if (key === null) {
      key = id.getID(value);
    }
    storage.set(key, value);
    callback(null, value);
  }

  function get(key, callback) {
    if (key === null) {
      // Fetch all keys and return them with an empty object for error,
      // which is unconventional and not recommended.
      const allKeys = Array.from(storage.keys());
      callback({}, allKeys); // Note: Passing {} as error is unconventional.
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
      callback(null, value);
    } else {
      callback(new Error('Key not found'), null);
    }
  }

  // Assign the methods to the main function object.
  const serviceFunction = function(config) {
    // You can add logic here if you need to handle the config.
    console.log('Received config:', config);
  };

  // Attach methods to the callable function.
  serviceFunction.get = get;
  serviceFunction.put = put;
  serviceFunction.del = del;

  // Return the callable function with attached methods.
  return serviceFunction;
}

// Export the main function.
module.exports = createStorageService;
