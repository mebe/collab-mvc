/*
 * Copyright (c) 2008, University of Helsinki
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
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE. 
 */

var Collab = {};

// Fetch name of this script, I hope we don't have any other init.js's...
Collab.script = function (scripts) {
    for (var i = 0; i < scripts.length; ++i) {
        if (scripts[i].src.match(/init.js/)) {
            return scripts[i].src;
        }
    }
}(document.getElementsByTagName('script'));

Collab.baseUrl = function (src) {
    var baseUrl = src.split('?', 2)[0];
    return baseUrl.substring(0, baseUrl.lastIndexOf('/') + 1);
}(Collab.script);

Collab.paramsString = Collab.script.replace(/^[^\?]+\??/, '');

Collab.loader = new YAHOO.util.YUILoader({
    allowRollup: true,
    base: Collab.baseUrl + 'lib/yui/build/',
    onSuccess: function () {
        // Add aliases

        var aliases = {
            Event: YAHOO.util.Event,
            Dom: YAHOO.util.Dom,
            Selector: YAHOO.util.Selector,
            lang: YAHOO.lang
        };

        if (window.Y) {
            YAHOO.lang.augmentObject(window.Y, aliases);
        } else {
            window.Y = aliases;
        }

        if (!window.$) {
            window.$ = function (id, map) {
                return new YAHOO.util.Element(id, map);
            };
        }

        // Add a convenience method for fetching children to YUI Elements
        YAHOO.util.Element.prototype.getChildren = function (selector) {
            var children = Y.Dom.getChildren(this.get('element'));
            if (selector) {
                children = Y.Selector.filter(children, selector);
            }

            for (var i = 0; i < children.length; i++) {
                children[i] = $(children[i]);
            }

            return children;
        };
    }
});


Collab.loader.addModule({
    name: 'inflector',
    type: 'js',
    fullpath: Collab.baseUrl + 'lib/inflector.js'
});

Collab.loader.addModule({
    name: 'ejs',
    type: 'js',
    fullpath: Collab.baseUrl + 'lib/ejs/ejs_production.js'
});

Collab.loader.addModule({
    name: 'model',
    type: 'js',
    fullpath: Collab.baseUrl + 'lib/collab/model.js',
    requires: ['inflector', 'connection', 'json']
});

Collab.loader.addModule({
    name: 'controller',
    type: 'js',
    fullpath: Collab.baseUrl + 'lib/collab/controller.js',
    requires: ['ejs', 'dom', 'element', 'selector']
});

Collab.loader.require('model');
Collab.loader.require('controller');
Collab.loader.insert();

/*
 * The following code is provided under the following license.
 * 
 * Copyright (c) 2005-2008 Sam Stephenson
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:

 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

Function.prototype.bind = function (obj) {
    var method = this, temp = function () {
        return method.apply(obj, arguments);
    };

    return temp;
};