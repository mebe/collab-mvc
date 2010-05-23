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

YAHOO.lang.augmentObject(Collab, {
    Resource: function(name, options) {
        var has, collections;

        this.name = name;

        // Set default options
        if (!options) {
            options = {};
        }

        if (!options.hasOwnProperty('type')) {
            YAHOO.lang.augmentObject(options, {
                plural: name.pluralize(),
                singular: name.singularize(),
                type: name.pluralOrSingular()
            });
        } else {
            YAHOO.lang.augmentObject(options, {
                plural: name,
                singular: name
            });
        }

        YAHOO.lang.augmentObject(options, {
            urls: {},
            methodField: 'emulated_method',
            baseUrl: this.getBaseUrl(options.belongsTo),
            collection: false
        });

        YAHOO.lang.augmentObject(options.urls, this.getDefaultUrls(options));

        for (k in options.urls) {
            if (options.urls.hasOwnProperty(k)) {
                options.urls[k] = options.baseUrl + options.urls[k];
            }
        }

        // And push the options into this
        // (we need the options before sorting out the relations and collections)
        YAHOO.lang.augmentObject(this, options);

        // Sort out the relationships
        if (this.hasOwnProperty('has')) {
            if (!YAHOO.lang.isArray(this.has)) {
                this.has = [this.has];
            }

            // Move the array to make space for real relationships
            has = this.has;
            this.has = {};

            has.forEach(function(i) {
                var name, options;

                if (YAHOO.lang.isString(i)) {
                    name = i;
                    options = {};
                } else {
                    options = i;
                    name = options.name;
                    delete options.name;
                }
                options.belongsTo = this;
                this.has[name] = new Collab.Resource(name, options);

            }, this);
        }

        // Collections are a differerent kind of subresources. They live on the class level,
        // not on the instance level as has-type of subresources. They are meant to implement
        // filtering for collections and will only work on plural resources. They are plural
        // themselves as well.
        //
        // var All = new Collab.Resource('all', {collections: ['keyword']);
        // All.keyword.find('all');
        // --> AJAX will hit '/all/keyword'
        // All.keyword.find('porsche');
        // --> AJAX will hit '/all/keyword/porsche'
        //
        // If a resource is actually a collection, .isCollection() will
        // return true, otherwise it is always false
        if (this.isPlural() && this.hasOwnProperty('collections')) {
            if (!YAHOO.lang.isArray(this.collections)) {
                this.collections = [this.collections];
            }

            collections = this.collections;
            this.collections = {};

            collections.forEach(function(i) {
                var name, options;

                if (YAHOO.lang.isString(i)) {
                    name = i;
                    options = {};
                } else {
                    options = i;
                    name = delete options.name;
                }
                options.type = 'plural';
                options.baseUrl = this.urls.list;
                options.collection = true;
                this[name] = new Collab.Resource(name, options);

            }, this);
        }
    },

    modelsUrl: function() {
        if (typeof COLLAB_MODELS_PATH != 'undefined') {
            return Collab.baseUrl + COLLAB_MODELS_PATH;
        } else {
            return Collab.baseUrl + 'models/';
        }
    }()
});

Collab.Resource.getType = function(url) {
    // FIXME: I don't work properly with nested singular resources!
    if (!YAHOO.lang.isString(url)) {
        if (url.hasOwnProperty('url')) {
            url = url['url'];
        } else {
            return undefined;
        }
    }
    url = url.replace(Collab.Resource.baseUrl, '');
    url = url.replace(new RegExp('^' + Collab.Resource.getTypePrefix), '');
    url = YAHOO.lang.trim(url);
    // Trim prepending and appending slashes
    url = url.match(/(?:^\/?)(.*?)(?:\/?$)/)[1];

    url = url.split('/');

    // We get only even ones, because odd ones should be id's (remember, first one is even)
    return url[url.length - (2 - (url.length % 2))].singularize();
};

Collab.Resource.prototype = {
    getBaseUrl: function(belongsTo) {
        var baseUrl = '';
        if (belongsTo) {
            baseUrl = belongsTo.urls.show.replace(':id', ':' + belongsTo.singular + '_id');
        } else if (Collab.Resource.baseUrl) {
            baseUrl = Collab.Resource.baseUrl;
        }
        return baseUrl;
    },

    getDefaultUrls: function(options) {
        var urls = {};
        if (options.type == 'plural') {
            urls.show = urls.destroy = urls.update = "/" + options.singular + "/:id";
            urls.list = "/" + options.plural;
            urls.create = '/' + options.singular;
        } else {
            urls.show = urls.create = urls.update = urls.destroy = "/" + options.singular;
        }
        return urls;
    },

    isSingular: function() {
        return this.type == 'singular';
    },

    isPlural: function() {
        return this.type == 'plural';
    },

    isCollection: function() {
        return this.collection;
    },

    find: function() {
        if (this.isPlural() && arguments.length < 3) {
            throw 'Find expects at least three arguments (id, [params, ] onSuccess, onError)';
        } else if (this.isSingular() && arguments.length < 2) {
            throw 'Find expects at least two argument ([params, ] onSuccess, onError)';
        }

        var id, params, onSuccess, onError, url, list;

        // Convert arguments into a proper array
        var args = Array.prototype.slice.call(arguments);

        // Singular resources don't take the id argument
        if (this.isSingular()) {
            id = null;
        } else {
            id = args.shift();
        }

        // Allow params hash to be omitted and callback function given directly
        if (args.length == 2) {
            params = null;
            onSuccess = args[0];
            onError = args[1];
        } else {
            params = args[0];
            onSuccess = args[1];
            onError = args[2];
        }

        // Fetching a list?
        if (this.isPlural() && id == 'all') {
            url = this.urls.list;
            list = true;
        } else {
            url = this.urls.show.replace(':id', id);
            if (this.isCollection()) {
                // Collection is still actually a list
                list = true;
            } else {
                list = false;
            }
        }

        if (params) {
            url += '?' + this.buildQueryString(params);
        }

        YAHOO.util.Connect.asyncRequest('GET', url, {
            argument: {
                list: list,
                onSuccess: onSuccess,
                onError: onError
            },
            success: this.parseResponse.bind(this),
            failure: this.parseFailure.bind(this)
        });
    },

    create: function(form, onSuccess, onError) {
        if (arguments.length < 3) {
            throw 'Create expects exactly three arguments (form, onSuccess, onError)';
        }
        YAHOO.util.Connect.setForm(form);
        YAHOO.util.Connect.asyncRequest('POST', this.urls.create, {
            argument: {
                onSuccess: onSuccess,
                onError: onError
            },
            success: this.parseResponse.bind(this),
            failure: this.parseFailure.bind(this)
        });
    },

    update: function() {
        if (this.isPlural() && arguments.length < 4) {
            throw 'Update expects exactly four arguments (id, form, onSuccess, onError)';
        } else if (this.isSingular() && arguments.length < 3) {
            throw 'Update expects exactly three arguments (form, onSuccess, onError)';
        }

        var id, form, onSuccess, onError;
        var args = Array.prototype.slice.call(arguments);

        // Singular resources don't take the id argument
        if (this.isSingular()) {
            id = null;
        } else {
            id = args.shift();
        }

        form = args[0];
        onSuccess = args[1];
        onError = args[2];

        this.insertMethodField(form, 'put');
        YAHOO.util.Connect.setForm(form);
        YAHOO.util.Connect.asyncRequest('POST', this.urls.update.replace(':id', id), {
            argument: {
                onSuccess: onSuccess,
                onError: onError
            },
            success: function(o) {
                this.removeMethodField(form);
                this.parseResponse.bind(this)(0);
            }.bind(this),
            failure: function(o) {
                this.removeMethodField(form);
                this.parseFailure.bind(this)(o);
            }.bind(this)
        });
    },

    destroy: function() {
        if (this.isPlural() && arguments.length < 3) {
            throw 'Destroy expects exactly three arguments (id, onSuccess, onError)';
        } else if (this.isSingular() && arguments.length < 2) {
            throw 'Destroy expects exactly two arguments (onSuccess, onError)';
        }

        var id, form, callback;
        var args = Array.prototype.slice.call(arguments);

        // Singular resources don't take the id argument
        if (this.isSingular()) {
            id = null;
        } else {
            id = args.shift();
        }

        onSuccess = args[0];
        onError = args[1];

        YAHOO.util.Connect.asyncRequest('POST', this.urls.destroy.replace(':id', id), {
            argument: {
                onSuccess: onSuccess,
                onError: onError
            },
            success: this.parseResponse.bind(this),
            failure: this.parseFailure.bind(this)
        }, this.methodField + '=delete');
    },

    buildQueryString: function(params) {
        var q = '';
        for (param in params) {
            if (params.hasOwnProperty(param)) {
                q += encodeURIComponent(param) + '=' + encodeURIComponent(params[param]) + '&';
            }
        }
        return q.substring(0, q.length - 1);
    },

    insertMethodField: function(form, method) {
        var methodField = document.createElement('input');
        methodField.name = this.methodField;
        methodField.type = 'hidden';
        methodField.value = method;
        YAHOO.util.Dom.insertBefore(methodField, YAHOO.util.Dom.getFirstChild(form));
    },

    removeMethodField: function(form) {
        form = $(form);
        form.removeChild(form.getChildren('input[name=emulated_method][type=hidden]')[0].get('element'));
    },

    parseResponse: function(o) {
        var json = YAHOO.lang.JSON.parse(o.responseText);

        // We need to inject the relations
        if (this.hasOwnProperty('has')) {
            for (hasKey in this.has) {
                if (this.has.hasOwnProperty(hasKey)) {
                    // Plug the original relation in the prototype
                    // chain of an object and instantiate it
                    // to prevent the original attributes
                    // from getting overwritten

                    var relation = function(daddy) {
                        function R() {
                        }

                        ;
                        R.prototype = daddy;
                        return new R();
                    }(this.has[hasKey]);

                    json.objects.forEach(function(obj) {
                        // To prevent the call from leaking through
                        // the prototype chain and updating, the
                        // parent, we need to make a edit copies
                        // of the urls

                        oldUrls = relation.urls;
                        newUrls = {};
                        for (urlKey in oldUrls) {
                            if (oldUrls.hasOwnProperty(urlKey)) {
                                newUrls[urlKey] = oldUrls[urlKey].replace(':' + this.singular + '_id', obj.id);
                            }
                        }
                        relation.urls = newUrls;

                        // Make a backup if we have something by the name of the relation already
                        if (obj.hasOwnProperty(hasKey)) {
                            obj[hasKey + 'Copy'] = obj[hasKey];
                        }
                        obj[hasKey] = relation;
                    }, this);
                }
            }
        }

        // Push in the objects in a property with the name of the resource for EJS
        // and, if we're not a list, get rid of the array
        if (!o.argument.list) {
            json.objects = json.objects[0];
            json.objects[this.singular] = json.objects;
        } else {
            json.objects[this.plural] = json.objects;
        }

        // Push in the extra defined parameters to the objects level
        for (k in json) {
            if (json.hasOwnProperty(k)) {
                json.objects[k] = json[k];
            }
        }

        if (json.objects.hasOwnProperty('errors') && json.objects.errors.length > 0) {
            // The back-end returns a "not-found" error when there are no search
            // results, so we need to check for that (it's not really an error,
            // at least on the front-end side)
            if (json.objects.errors.length == 1 && json.objects.errors[0].type == 'not-found') {
                json.objects.errors = [];
                o.argument.onSuccess(json.objects);
            } else {
                o.argument.onError(json.objects);
            }
        } else {
            o.argument.onSuccess(json.objects);
        }
    },

    parseFailure: function(o) {
        // Let's build an object that looks like a proper, empty response with errors
        // and pass that to the onError callback
        o.argument.onError({
            'pagination': {
                'item_count': 0,
                'page_total': 1,
                'sort_order': 'desc',
                'item_total': 0,
                'page_number': 1,
                'item_offset': 0,
                'sort_by': 'relevance'
            },
            'objects': {},
            'errors': [
                {
                    'type': 'not-found',
                    'value': o.status + ': ' + o.statusText
                }
            ]
        });
    }
};

YAHOO.util.Get.script(Collab.modelsUrl + 'models.js');
