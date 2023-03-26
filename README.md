## Chillflix Website:
This is a simple Node.js website that uses Express, body-parser, and MongoDB to store and retrieve data.

## Dependencies
This website uses the following dependencies:

- body-parser: A middleware that parses incoming request bodies.
- mongodb: The official MongoDB driver for Node.js.

## Installation
To install the required dependencies, run the following command:

- npm install

This will install the latest version of Express, body-parser, and MongoDB driver in your project's node_modules directory.

## Configuration
By default, the website connects to a MongoDB instance running at mongodb://127.0.0.1:27017 and uses two collections named "userData" and "videoData". You can customize this by updating the databaseModule.js file

## Usage
To start the website, run the following command:
node server.js

This will start the server on port 8080. You can access the website by opening a web browser and navigating to http://localhost:8080




## Contributing
If you find a bug or would like to suggest a new feature, please open an issue or submit a pull request. Contributions are welcome and appreciated!
