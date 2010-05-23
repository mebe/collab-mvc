/* Copyright (c) 2008, University of Helsinki
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *     * Redistributions of source code must retain the above copyright
 *       notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above copyright
 *       notice, this list of conditions and the following disclaimer in the
 *       documentation and/or other materials provided with the distribution.
 *     * Neither the name of the University of Helsinki nor the
 *       names of its contributors may be used to endorse or promote products
 *       derived from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY University of Helsinki ''AS IS'' AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL University of Helsinki BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND 
 */

YAHOO.lang.augmentObject(Collab, {
    controllers: {},

    Controller: function(name) {
        this.controller = name;
        Collab.controllers[name] = this;
        Collab.controllers[name.charAt(0).toUpperCase() + name.substr(1)] = this;
        this.actions = [];
    },

    dispatch: function() {
        var controller, action, args;

        // Convert arguments into a proper array
        args = Array.prototype.slice.call(arguments);
        controller = args.shift().toLowerCase();
        action = args.shift();

        if (!action) {
            args = controller.split('/');
            controller = unescape(args.shift());
            action = (args[0] ? unescape(args.shift()) : 'index');
        }

        if (!controller) {
            // Don't dispatch if we have nowhere to dispatch to.
            return;
        }

        if (!Collab.controllers.hasOwnProperty(controller)) {
            YAHOO.util.Get.script(Collab.controllersUrl + controller + '.js', {
                onSuccess: function() {
                    Collab.controllers[controller].act(action, args);
                }
            });
        } else {
            Collab.controllers[controller].act(action, args);
        }
    },

    controllersUrl: function() {
        if (typeof COLLAB_CONTROLLERS_PATH != 'undefined') {
            return Collab.baseUrl + COLLAB_CONTROLLERS_PATH;
        } else {
            return Collab.baseUrl + 'controllers/';
        }
    }()
});

Collab.Controller.prototype = {
    action: function(name, fun) {
        this.actions[name] = fun;
    },

    act: function(action, args) {
        // Store the action's name so we know what it is in the renderer
        this.action = action;
        // We need to use apply to ensure proper scoping and passing of the arguments
        this.actions[this.action].apply(this, args);
    },

    render: function(target, data, template) {
        if (!template) {
            template = this.controller.toLowerCase() + '/' + this.action;
        }

        if (!data) {
            data = {};
        }

        var ejs = new EJS({
            url: Collab.baseUrl + 'views/' + template + '.ejs'
        }).update(target, data);
    }
};

Collab.dispatch(Collab.paramsString);
