Copyright (c) 2008, University of Helsinki

A YUI2-based, light-weight JavaScript MVC framework for working with RESTful data sources. The REST back-end must conform to the coding practices defined by this library (so it's not really all that general-purpose).

The framework also uses [http://embeddedjs.com Embedded JavaScript] to separate controller-specific JavaScript code to controllers and pure html markup in templates that are rendered with JSON data to achieve the final view.

# Library code #

## init.js ##

This is the entry point to the MVC. This is the file you include in your base HTML file to use this framework. The file takes a query parameter {controller name}/{action name} to define entry point into the system. If action name is omitted, **index** is assumed. You need to include YUI Loader library before this. Example of a HTML file:

    <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
    <html>
    <head>
      <title>Latest Diggs</title>
      <script src="lib/yui/build/yuiloader/yuiloader-beta.js" type="text/javascript"></script>
      <script src="init.js?stories" type="text/javascript"></script>
    </head>
    <body>
    </body>
    </html>

# Model #
The framework uses the REST to get data from the server.
A JavaScript-object of the type Resource is used to fetch single data entity from the web server via AJAX using the REST interface.

## models/models.js ##

This is used to define resources (or models). The syntax for resource definition is:

    Resource new Collab.resource(<String> name[, <Object> options]);
    
where

<table>
<tr><th>Parameter</th><th>Description</th><th>Optional</th><th>Default value</th></tr>
<tr><td><String> name</td><td>The name of the resource - if in plural, plural resource is created; if in singular, singular resource is created</td><td>False</td><td></td></tr>
<tr><td><Object> options</td><td>An object containing additional options as described below</td><td>true</td><td>see below</td></tr>
</table>

<table>
<tr><th>Option</th><th>Description</th><th>Default value</th></tr>
<tr><td>name</td><td>Same as the first argument (<String name>, but used when creating subresources</td><td></td></tr>
<tr><td>type</td><td>Valid values are "plural" or "singular". Defines the type of the resource to be either a plural one (listable and with id's) or a singular (only one exists, so no list and no id's)</td><td>Based on the singualirty or plurality of **name**</td></tr>
<tr><td>singular</td><td>Singular form of the resource's name</td><td>**name** singularized</td></tr>
<tr><td>plural</td><td>Plural form of the resource's name, used for generating default urls</td><td>**name** pluralized</td></tr>
<tr><td>methodField</td><td>Name of the hidden field used to transfer method data for puts and deletes</td><td>"_method"</td></tr>
<tr><td>urls</td><td>An object containing the url's for different actions, described below</td><td>described below</td></tr>
<tr><td>has</td><td>An array of strings, where each entry creates a new instance level sub-resource. If an array of [string, Object] is passed, the second element is similar options array as on any other resource. The url's are prepended by the mother-resource's show-url</td><td></td></tr>
<tr><td>collection</td><td>Collections are a differerent kind of subresources. They live on the class level, not on the instance level as has-type of subresources. They are meant to implement filtering for collections and will only work on plural resources. They are plural themselves as well.</td><td></td></tr>
</table>

Plural resources have the following urls:

<table>
<tr><th>Action</th><th>Default url</th><th>HTTP method (unchangeable)</th></tr>
<tr><td>show</td><td>"/" + singular resource name + "/:id"</td><td>get</td></tr>
<tr><td>list</td><td>"/" + plural resource name</td><td>get</td></tr>
<tr><td>create</td><td>"/" + singular resource name</td><td>post</td></tr>
<tr><td>update</td><td>"/" + singular resource name + "/:id"</td><td>put</td></tr>
<tr><td>destroy</td><td>"/" + singular resource name + "/:id"</td><td>delete</td></tr>
</table>

Singular resources have the following urls:

<table>
<tr><th>Action</th><th>Default url</th><th>HTTP method (unchangeable)</th></tr>
<tr><td>show</td><td>"/" + resource name</td><td>get</td></tr>
<tr><td>create</td><td>"/" + resource name</td><td>post</td></tr>
<tr><td>update</td><td>"/" + resource name</td><td>put</td></tr>
<tr><td>destroy</td><td>"/" + resource name</td><td>delete</td></tr>
</table>

Creating a resources exposes the following methods:

    Void find(<String|Integer> id[, <Object> params], <Function> onSuccess(<Object> response), <Function> onError(<Object> response));
    Void create(<Element|String> form, <Function> onSuccess(<Object> response), <Function> onError(<Object> response));
    Void update(<Integer> id, <Element|String> form, <Function> onSuccess(<Object> response), <Function> onError(<Object> response));
    Void destroy(<Integer> id, <Function> onSuccess(<Object> response), <Function> onError(<Object> response));

where

<table>
<tr><th>Parameter</th><th>Description</th><th>Optional</th><th>Default value</th></tr>
<tr><td><String|Integer> id</td><td>Either string "all" in which case the list of the resources will be fetched, or an id of a single resource, in which case that particular resource is fetched</td><td>false</td><td></td></tr>
<tr><td><Integer> id</td><td>The id of a single resource to operate upon</td><td>false</td><td></td></tr>
<tr><td><Element|String> form</td><td>An element reference of the form containing the data to be submitted to the server or its id as a string</td><td>false</td><td></td></tr>
<tr><td><Object> params</td><td>Additional query parameters for the AJAX call</td><td>true</td><td></td></tr>
<tr><td><Function> onSuccess(<Object> response)</td><td>Callback function on a succesful query, ie what to do with the response. Receives an object parsed from the JSON received from the server as parameter</td><td>false</td><td></td></tr>
<tr><td><Function> onError(<Object> response)</td><td>Callback function on a failed query</td><td>false</td><td></td></tr>
</table>

Note that singular resources omit the **id** parameter and the rest are shifted left by one!

The JSON response object has some extra syntactic sugar augmented into it:
* if your call is to id "**all**", the response will be an array containing all the results, otherwise it will be just the object referenced by the id
* any sub-resources are available through parameters named after them on all objects
* all the extra properties passed in the JSON are available as properties on the array or, in case of singular fetch, on the object itself

Examples:

    var Story = new Collab.Resource('stories');
    Story.find('all', {item_count: 5}, function(stories) {
	  // Ajax will hit .../stories?item_count=5
      stories.forEach(function(story) {
        ...
      }, this);
    });

    var Post = new Collab.Resource('posts', {has: ['tags', 'comments', 'rating']});
    Post.find(3, function(post) {
      // Ajax will hit .../post/3
      post.tags.find('all', function(tags) {
        // Ajax will hit .../post/3/tags
        tags.forEach(function(tag) {
          ...
        });
      }
    }

    var Car = new Collab.Resource('cars', {collections: ['keyword']});
    Car.keyword.find('driftable', function(drifters) {
      // -> Ajax will hit .../cars/keyword/driftable
      drifters.forEach(function(drifter) {
	    ...
      });
    });

The following convenience methods are available on each resource:

    boolean isPlural();
    boolean isSingular();
    boolean isCollection();

There is also one static method on Collab.Resource:

    String Collab.Resource.getType(<String|Object> url);

The function of this method is to 'reverse' an api url back to a string representing the type of the resource. The only parameter can either be the object received from a resource call or a plain url. The type is returned in singular, lowercase form. For example:

    Collab.Resource.getTypePrefix = '/api';
    Collab.Resource.getType('/api/foos');
    --> 'foo'
    Collab.Resource.getType('/api/bar/34');
    --> 'bar'
    Collab.Resource.getType('/api/banana');
    --> 'banana'

There are two configuration parameters for resources:

    Collab.Resource.baseURL = <String>;
    Collab.Resource.getTypePrefix = <String>;

baseURL is prefixed on all outgoing calls, so it should define the location of the back-end-exposed API.
getTypePrefix is removed from all url's handled with Collab.Resource.getType(), so it should match with any extra prefixes the back-end returns in its url fields.

# Controller #

Controller is used to render data from the backend to the ejs-templates mentioned earlier. Controllers, likewise to Resource-models, are types of JavaScript-objects that are responsible of rendering all the components in the view.

## controllers/*.js ##

These files are used to define your controllers. The convention is to name the JavaScript file after the controller's name. The syntax for controller definition is:

    Controller new Collab.Controller(<String> name);

where

<table>
<tr><th>Parameter</th><th>Description</th><th>Optional</th><th>Default value</th></tr>
<tr><td><String> name</td><td>Name of the controller, used to refer to the controller from other controllers and dispatching</td><td>false</td><td></td></tr>
</table>

After the controller has been defined like this and assigned to a variable, you define actions with

    Void action(<String> name, <Function> action([...[, ...]]));

where

<table>
<tr><th>Parameter</th><th>Description</th><th>Optional</th><th>Default value</th></tr>
<tr><td><String> name</td><td>Name of the action, used to call the action</td><td>false</td><td></td></tr>
<tr><td><Function> action([...[, ...]]))</td><td>The action itself. Takes a freely definable argument list.</td><td>false</td><td></td></tr>
</table>

Consider this:

    var c = new Collab.Controller('stories');

    c.action('index', function() {
      Collab.dispatch('Login', 'show');

      Story.find('all', {
        count: 5
      }, function(stories) {
        this.render('stories', stories);

        var storyElements = $('stories').getChildren();

        storyElements.forEach(function(e) {
          e.on('click', function() {
            Collab.dispatch('stories', 'show', e.get('id').split('_', 2)[1]);
          });
        })
      }.bind(c)); // This is unfortunately required to make the anonymous callback function execute in the correct scope
    });

    c.action('show', function(id) {
      Story.find(id, function(story) {
        alert(story.link);
      });
    });

Observe the bind call on the callback function of the resource used to make it execute in the scope of the controller. This is very important!

A special render-method is available to your controllers. Use this to render EJS templates. The syntax for render is

    Void render(<Element|String> target[, <Object> data[, <String> template]]);

where

<table>
<tr><th>Parameter</th><th>Description</th><th>Optional</th><th>Default value</th></tr>
<tr><td><Element|String> target</td><td>The DOM element or the id of the DOM element inside which the template will be rendered</td><td>false</td><td></td></tr>
<tr><td><Object> data</td><td>A object containing data for the template replacements. Most likely a parsed JSON object returned from a resource fetch</td><td>true</td><td></td></tr>
<tr><td><String> template</td><td>The path to the template file to render, inside the views directory, without file extension</td><td>{controller name}/{action name}</td></tr>
</table>

Method calls to controllers are dispatched with

    Void Collab.dispatch(<String> controller, <String action>[, ...[, ...]])

where the first argument is the name of the controller, the second argument is the name of the action in that controller and the rest of the arguments are arguments to be passed to the action function.