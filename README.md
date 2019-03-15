# oidc-client: OpenId-Connect Client QEWD-Up MicroService
 
Rob Tweed <rtweed@mgateway.com>  
14 March 2019, M/Gateway Developments Ltd [http://www.mgateway.com](http://www.mgateway.com)  

Twitter: @rtweed

Google Group for discussions, support, advice etc: [http://groups.google.co.uk/group/enterprise-web-developer-community](http://groups.google.co.uk/group/enterprise-web-developer-community)

# Background

This is a re-usable QEWD-Up MicroService that provides OpenId-Connect Client functionality, for user authentication etc.

It uses the Node.js [openid-client](https://github.com/panva/node-openid-client) Module.

# Getting Started

Clone this repository into a folder of your choice.  Note that this does not need to be within a QEWD-Up Orchesrator folder: the *oidc-client* MicroService can exist in its own separate folder.  It can also been on a separate machine from the Orchestrator.

To integrate it with a QEWD-Up Orchstrator;

- Edit the *oidc-client* */configuration/config.json* file and add an *ms_name* property.  This should be the name you want to assign to the MicroService - it's up to you what the name is, eg:

        {
          "qewd_up": true,
          "ms_name": "oidc-client"
        }

- Edit the Orchestrator's */configuration/config.json* file to add and import the *oidc_client* microservice, eg:

        {
          "qewd_up": true,
          "orchestrator": {
            "qewd": {
              "serverName": "RPI Orchestrator",
              "poolSize": 3
            }
          },
          "microservices": [
            {
              "name": "oidc-client",
              "host": "192.168.1.97",
              "port": 8080,
              "apis": {
                "import": true
              },
              "qewd": {
                "serverName": "OIDC Client",
                "poolSize": 3
              }
            }
          }
        }

Note the very important microservices.apis.import property.

You can now start the OIDC MicroService, eg:

        docker run -it --name oidc-client --rm -p 8080:8080 -v ~/oidc-client:/opt/qewd/mapped -e mode="microservice" rtweed/qewd-server

Note the *mode="microservice"* parameter.

Then start the Orchestrator, eg:

        docker run -it --name orchestrator --rm -p 8080:8080 -v ~/my-orchestrator:/opt/qewd/mapped rtweed/qewd-server

Modify the port assignments as appropriate: the above example assumes that the Orchestrator and OIDC Client are running on different servers, so each can use port 8080.


You'll see activity in both the Orchestrator and OIDC Client MicroService: the Orchestrator is importing the OIDC Client MicroService's routes, and sending its JWT secret to the OIDC Client MicroService.  Both containers will then shut down.  Simply restart them using the same *docker run* commands, and you'll now have a working, integrated system, with your Orchestrator able to use the OIDC Client's routes.
