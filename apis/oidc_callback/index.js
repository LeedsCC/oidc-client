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

var errorCallback;

process.on('unhandledRejection', function(reason, p){
  console.log("Possibly Unhandled Rejection at: Promise ", p, " reason: ", reason);
  // application specific logging here
  errorCallback({error: reason});
});

module.exports = function(args, finished) {

  if (args.req.query.error) {
    var error = args.req.query.error;
    if (args.req.query.error_description) {
      error = error + ': ' + args.req.query.error_description;
    }
    return finished({error: error});
  }

  var orchestrator = this.oidc_client.orchestrator;
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

  this.oidc_client.client.authorizationCallback(callbackURL, args.req.query)
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

      //console.log('verify_jwt: ' + JSON.stringify(verify_jwt, null, 2));

      if (tokenSet.refresh_expires_in) {
        session.timeout = tokenSet.refresh_expires_in;
      }
      else {
        session.timeout = verify_jwt.exp - verify_jwt.iat;
      }

      session.role = 'phrUser';
      session.uid = tokenSet.session_state || uuid();
      session.openid = verify_jwt;
      session.openid.id_token = tokenSet.id_token;

      finished({
        ok: true,
        oidc_redirect: indexUrl,
        cookiePath: cookiePath,
        cookieName: cookieName
      });
  });
};
