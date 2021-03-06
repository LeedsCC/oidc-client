/*

 ----------------------------------------------------------------------------
 | oidc-client: OIDC Client QEWD-Up MicroService                            |
 |                                                                          |
 | Copyright (c) 2019 M/Gateway Developments Ltd,                           |
 | Redhill, Surrey UK.                                                      |
 | All rights reserved.                                                     |
 |                                                                          |
 | http://www.mgateway.com                                                  |
 | Email: rtweed@mgateway.com                                               |
 |                                                                          |
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

  8 April 2019

*/

// Handler for OIDC Callback URL: /auth/token

var jwt = require('jwt-simple');
var uuid = require('uuid/v4');
const request = require("request-promise-native")
const { logger, loginLogger } = require('../../logger');

function completeRequest(args, oidc_client, finished) {

  if (args.req.query.error) {
    var error = args.req.query.error;
    if (args.req.query.error_description) {
      error = error + ': ' + args.req.query.error_description;
    }
    return finished({error: error});
  }

  var orchestrator = oidc_client.orchestrator;
  if (!orchestrator.urls) {
    orchestrator.urls = {
      index_url: '/index.html',
       callback_url: '/api/auth/token'
    }
  }

  var indexUrl = orchestrator.urls.index_url || '/index.html';
  var setCookie = orchestrator.set_cookie;
  var cookiePath;
  var cookieName;
  if (setCookie) {
    if (setCookie.path) {
      cookiePath = setCookie.path;
    }
    if (setCookie.name) {
      cookieName = setCookie.name;
    }
  }
  if (!cookiePath) {
    var pieces = indexUrl.split('/');
    pieces.pop();
    cookiePath = pieces.join('/');
    if (cookiePath === '') cookiePath = '/';
  }
  if (!cookieName) {
    cookieName = 'JSESSIONID';
  }

  var callbackURL = orchestrator.urls.callback_url || '/api/auth/token';
  callbackURL = orchestrator.host + callbackURL;

  oidc_client.client.authorizationCallback(callbackURL, args.req.query)
    .then(function (tokenSet) {

      //console.log('\nTokenSet: ' + JSON.stringify(tokenSet));

      var session = args.session;
      session.authenticated = true;
      var verify_jwt = jwt.decode(tokenSet.id_token, null, true);

      if (!verify_jwt.nhs_number) {
        return finished({
          error: 'The OIDC Provider id_token did not contain an NHS Number'
        });
      }

      session.nhsNumber = verify_jwt.nhs_number.split(' ').join('');
      session.email = verify_jwt.email;

      if (oidc_client.client_config && oidc_client.client_config.timeout) {
        
        session.timeout = oidc_client.client_config.timeout;
      } else if (tokenSet.refresh_expires_in) {
        
        session.timeout = tokenSet.refresh_expires_in;
      } else {
        
        session.timeout = verify_jwt.exp - verify_jwt.iat;
      }

      const { job_credentials } = oidc_client

      request({
          url: job_credentials.host,
          auth: { 
              user: job_credentials.client_id, 
              pass: job_credentials.client_secret 
          },
          method: "POST",
          json: true,
          body: {
              nhsNumber: session.nhsNumber,
              token: tokenSet.access_token
          }
      })

      session.role = 'phrUser';
      session.uid = tokenSet.session_state || uuid();
      session.openid = verify_jwt;
      session.openid.id_token = tokenSet.id_token;

      loginLogger.info({ message: `new login - ${new Date()}` })

      finished({
        ok: true,
        oidc_redirect: indexUrl,
        cookiePath: cookiePath,
        cookieName: cookieName
      });
  });
}

module.exports = function(args, finished) {
  try {
    if (!this.oidc_client.isReady) {
      var _this = this;

      _this.on('oidc_client_ready', function () {
        completeRequest(args, _this.oidc_client, finished);
      })
    } else {
      completeRequest(args, this.oidc_client, finished);
    }
  } catch (error) {
    logger.error("", error);
  }
};
