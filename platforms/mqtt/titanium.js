/*******************************************************************************
Copyright 2015 CREATE-NET
Developed for COMPOSE project (compose-project.eu)

@author Luca Capra <luca.capra@create-net.org>

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
******************************************************************************/


var DEBUG = false;

var d = function(m) { (DEBUG === true || (DEBUG > 19)) && console.log("[mqtt client] " + m); };

var mqtt = require("it.uhopper.mqtt");

var client;
var connected = false;


var adapter = module.exports;

adapter.initialize = function(compose) {

    DEBUG = compose.config.debug;
    var queue = this.queue;

    var request = {
        meta: {
            authorization: compose.config.apiKey
        },
        body: {}
    };

    var ApiTokenKey = compose.config.apiKeyToken;

    var topics = {

        from: "/topic/" + ApiTokenKey + '.from'
        , to: "/topic/" + ApiTokenKey + '.to'

        , stream: function(handler) {
            return "/topic/" + ApiTokenKey + '.' + handler.container().ServiceObject.id +'.streams.'+ handler.stream.name +'.updates';
        }

    };

    adapter.connect = function(handler, connectionSuccess, connectionFail){

        d("Connection requested");

        if(!client || !connected) {
            client = mqtt.registerCallback(ApiTokenKey, {
                success: function(data){
                    d("Response received");
                    d(data);
                    handler.emitter.trigger('connect', client);
                    connected = true;
                    connectionSuccess();
                },
                error: function(data){
                    d("onError");
                    d(data);
                    connected = false;
                    connectionFail(data);
                },
                callback: function(data){

                    d("onCallback");
                    d("notification ");
                    d(data);

                    var messageId = null;
                    if(typeof data.headers.messageId !== 'undefined') {
                        messageId = data.headers.messageId;
                    }
                    if(typeof data.messageId !== 'undefined') {
                        messageId = data.messageId;
                        delete data.messageId;
                    }

                    queue.handleResponse({
                        data: data,
                        messageId: messageId
                    });
                }
            });
        }

    };

    adapter.disconnect = function(connectionSuccess, connectionFail) {
        mqtt.unregisterForNotification({
            success: function(data){
                connected = false;
                client = null;
                connectionSuccess(data);
            },
            error: function(data){
                connected = false;
                client = null;
                connectionFail(data);
            }
        });
    };

    adapter.subscribeToTopic = function(topic) {
        mqtt.subscribeToTopic(topic);
    };

    adapter.unsubscribeFromTopic = function() {
        mqtt.unSubscribeToTopic(topic);
    };

    adapter.request = function(handler) {
//    	d("Request: ")
//        d(handler);

    	request.meta.method = handler.method;
    	request.meta.url = handler.path;

    	if(handler.body){
            request.body = handler.body;
    	}

    	d("Request:");
        d(request);

    	request.meta.messageId = queue.add(handler);

        mqtt.publishData(ApiTokenKey, JSON.stringify(request));
    };


    /*
     * @param {RequestHandler} handler
     */
    adapter.subscribe = function(handler) {

        throw new Exception("Not implemented yet!");

        var topic = topics[ handler.topic ] ? topics[ handler.topic ] : handler.topic;
        if(typeof topic === 'function') {
            topic = topic(handler);
        };

        var uuid = queue.registerSubscription(topic, handler);

        d("[stomp client] Listening to " + topic);
        client.subscribeToTopic(topic);

        client.on('message', function(srctopic, message, response) {
            if(topic === srctopic) {
                d("[stomp client] New message from topic " + topic);
                message.messageId = uuid;
                queue.handleResponse(message);
            }
        });

    };

};