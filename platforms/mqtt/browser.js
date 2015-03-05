/*******************************************************************************
Copyright 2014 CREATE-NET
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

(function() {

    var mqttlib = {};

    mqttlib.initialize = function(compose) {
        throw new compose.error.ComposeError("Browser support for mqtt has not been implemented yet! Please, use stomp instead");
    };

    //-- multiplatform support
    (function(libname, lib, deps) {
        deps = (deps instanceof Array) ? deps : ['compose'];
        if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
            module.exports = lib;
        }
        else {

            if (typeof define === 'function' && define.amd) {
                define(deps, function(compose) {
                    return lib;
                });
            }
            if(typeof window !== 'undefined') {
                window.__$$composeioRegistry[libname] = lib;
            }
        }
    })
    ('platforms/mqtt/browser', mqttlib);

})();