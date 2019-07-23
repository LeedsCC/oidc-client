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

  9 April 2019

*/

var request = require('request');

function completeRequest(args, oidc_client, finished) {
  var oidc_provider = oidc_client.oidc_provider;

  // Some OIDC Providers don't specify an end session endpoint
  // in which case just redirect to the OIDC provider again

  if (!oidc_provider.urls.end_session_endpoint) {
    // redirect to login endpoint instead
    args.session.authenticated = false;
    return finished({
      redirectURL: oidc_client.getRedirectURL()
    });
  }


  var orchestrator = oidc_client.orchestrator;
  var redirectUri = orchestrator.host + orchestrator.urls.post_logout_redirect_uri;
  var endSessionEndpoint = oidc_provider.host + oidc_provider.urls.end_session_endpoint;

  var id_token = args.session.openid.id_token;

  if (oidc_provider.logout_approach === 'client') {

    var uri = endSessionEndpoint + '?id_token_hint=' + id_token;
    uri = uri + '&post_logout_redirect_uri=' + redirectUri;

    return finished({
      redirectURL: uri
    });
  }

  if (args.session.openid && args.session.openid.id_token) {

    var options = {
      url: endSessionEnpoint,
      method: 'GET',
      qs: {
        id_token_hint: id_token,
        //post_logout_redirect_uri: redirectUri
      },
      json: true
    };

    console.log('**** OpenId end session / logout: options - ' + JSON.stringify(options, null, 2));

    request(options, function(error, response, body) {
      console.log('*** logout - response = ' + JSON.stringify(response));

      finished({
        ok: true,
        redirectURL: redirectUri,
      });
    });
  }
  else {
    finished({
      ok: false
    });
  }
}

module.exports = function(args, finished) {

  if (!this.oidc_client.isReady) {
    var _this = this;

    _this.oidc_client.on('oidc_client_ready', function () {
      completeRequest(args, _this.oidc_client, finished);
    })
  } else {
    completeRequest(args, this.oidc_client, finished);
  }
};
