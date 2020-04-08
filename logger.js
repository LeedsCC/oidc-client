/*

 ----------------------------------------------------------------------------
 |                                                                          |
 | http://www.synanetics.com                                                |
 | Email: support@synanetics.com                                            |
 |                                                                          |
 | Author: Richard Brown                                                    |
 |                                                                          |
 | Licensed under the Apache License, Version 2.0 (the "License");          |
 | you may not use this file except in compliance with the License.         |
 | You may obtain a copy of the License at                                  |
 |                                                                          |
 |     http://www.apache.org/licenses/LICENSE-2.0                           |
 |                                                                          |
 | Unless required by applicable law or agreed to in writing, software      |
 | distributed under the License is distributed on an "AS IS" BASIS,        |
 | WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. |
 | See the License for the specific language governing permissions and      |
 |  limitations under the License.                                          |
 ----------------------------------------------------------------------------

  17 Mar 2020

*/

'use strict';

const winston = require('winston');
require('winston-daily-rotate-file');

let logger = null;
let loginLogger = null;

var errorTransport = new (winston.transports.DailyRotateFile)({
    filename: 'logs/error-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '2d',
    createSymlink: true,
    symlinkName: 'error.log'
});

var loginTransport = new (winston.transports.DailyRotateFile)({
    filename: 'logs/login-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '2d',
    createSymlink: true,
    symlinkName: 'login.log'
});

function buildLogger(serviceName) {
  if (logger) {
    return
  }
  
  logger = winston.createLogger({
    level: 'error',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
    defaultMeta: { service: serviceName },
    transports: [
        errorTransport
    ]
  });

  // Call exceptions.handle with a transport to handle exceptions
  logger.exceptions.handle(
    errorTransport
  );
}

function buildLoginLogger(serviceName) {
  if (loginLogger) {
    return
  }
  
  loginLogger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
    defaultMeta: { service: serviceName },
    transports: [
        loginTransport
    ]
  });
}

buildLogger("auth_service");
buildLoginLogger("auth_service");

module.exports = { logger, loginLogger };