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

  14 March 2019


  This module is loaded by QEWD-Up when a QEWD Worker starts

  It initialises the OpenId Connect (OIDC) Client which is used for accessing the OIDC Server/Provider
  It uses the "oidc-client" custom configuration details in the /configuration/oidc.json file

  The OIDC Client is added to QEWD's "this" object as this.oidc_client, so it
  becomes available to the handlers within the Authentication MicroService

*/

const Issuer = require('openid-client').Issuer;
var oidc_config = require('/opt/qewd/mapped/configuration/oidc.json');

module.exports = function() {

  console.log('OIDC Client initialising in QEWD Worker Process');

  this.oidc_client = oidc_config;
  var oidc_provider = oidc_config.oidc_provider;

  Issuer.defaultHttpOptions = {
    rejectUnauthorized: oidc_provider.rejectUnauthorized || true
  };

  this.oidc_client.issuer = new Issuer({
    issuer: oidc_provider.host + oidc_provider.urls.issuer,
    authorization_endpoint: oidc_provider.host + oidc_provider.urls.authorization_endpoint,
    token_endpoint: oidc_provider.host + oidc_provider.urls.token_endpoint,
    userinfo_endpoint: oidc_provider.host + oidc_provider.urls.userinfo_endpoint,
    introspection_endpoint: oidc_provider.host + oidc_provider.urls.introspection_endpoint,
    jwks_uri: oidc_provider.host + oidc_provider.urls.jwks_endpoint,
  });
  var issuer = this.oidc_client.issuer;

  this.oidc_client.client = new issuer.Client({
    client_id: oidc_provider.client_id,
    client_secret: oidc_provider.client_secret
  });

  var client = this.oidc_client.client;
  this.oidc_client.getRedirectURL = function(scope) {
    scope = scope || oidc_provider.scope.login;
    return client.authorizationUrl({
      redirect_uri: oidc_config.orchestrator.host + oidc_config.orchestrator.urls.callback_url,
      scope: scope,
    });
  };
  this.oidc_client.callback_url = oidc_config.orchestrator.host + oidc_config.orchestrator.urls.callback_url;
};
