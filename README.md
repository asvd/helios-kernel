Helios Kernel — include() for JavaScript
========================================

Helios Kernel is a JavaScript module loader and dependency manager
with a simple and isomorphic module format, meaning that it may be
used to build an application which will run both in browser-based
environment and in [Node.js](http://nodejs.org/) without any
conversion. Helios Kernel tracks the dependency graph, loads and
unloads corresponding modules dynamically in the runtime according to
the needs of different and independent parts of an application. It is
smart enough to start initializing the modules which are ready for
that, while others are still being downloaded or parsed, and to handle
some tricky problems such as circular dependencies or broken code
(reporting the problem, but still keeping the application alive). But
the key feature of Helios Kernel is


### Simplicity

Following the [KISS
principle](http://en.wikipedia.org/wiki/KISS_principle), Helios Kernel
provides the necessary features intended to make dependency management
simple and straightforward. Syntax of a module and dependency
declaration is implimented in the classic include-style:

```js
// list of dependencies
include('path/to/someLibrary.js');
include('../path/to/anotherLibrary.js');

init = function() {
    // module code,
    // objects declared in the included modules are available at this point
    someLibrary.sayHello();
}
```

A set of dependencies is listed in the module head using the
`include()` function, where each call stands for a single dependency.
The only argument is the exact path to the source of the needed module
— so that it is always easy to find out the particular dependency
source location.

Module code is located inisde the `init()` function declaration.  It
will be issued by Helios Kernel as soon as all dependencies are
loaded.

This is how `someLibrary.js` included in the module above could look:

```js
init = function() {
    // (globally) declaring a library object
    someLibrary = {};

    // library method
    someLibrary.sayHello = function() {
        console.log('Hello World!');
    }
}
```

In this example the `someLibrary` object is declared as a global. Such
approach is more flexible comparing to exporting, since it does not
force an artificial coupling between a module (library internal
structure) and the exported object (library interface). [This
text](https://gist.github.com/asvd/7619633) explains why exporting
does not give advantages.

The `init()` function may contain any preferred code, its scope may be
used to keep some private data. To make some object available from
outside, it could be declared as a global.

This is basicly everything you need to know to start using Helios
Kernel for setting-up the dependencies in your project. This text
contains the full documentation on Helios Kernel.


### Helios Kernel compared to other approaches

There is no native dependency management solution in browser
environments. To ensure that a set of JavaScript-libraries is loaded,
the libraries are usually listed within a single html-page
header. Managing the dependencies and loading order is too tricky in
this case, and gets more and more complicated along with the project
growth. To solve this problem, several script loading approaches and
libraries exist, one of which is Helios Kernel.

In Node.js there is a native dependency declaration technique — the
`require()` function which implements the specifications suggested by
[CommonJS](http://en.wikipedia.org/wiki/CommonJS) group. Just like as
in most of the browser-based solutions, it introduces object
exporting, which [as mentioned](https://gist.github.com/asvd/7619633)
more likely brings unnecessary complications to dependency management
and objects declaration. Therefore Helios Kernel pretends to be a
simplier and more flexible alternative.

Helios Kernel may be preferred because of its simplicity, or if there
is a need to to have the modules isomorphic and compatible between web
and Node.js environments. Comparing to other dependency-management
solutions, with Helios Kernel it could be more convenient to:

- modify or refactor a list of dependencies, especially when there are
a lot of them (each dependency is just a single `include()` line
referring to a module by its path, which is specified at the module
head, not inside the module body or even some external config)

- create a compound module which should load several modules to be
used at once (such module could simply list all dependencies using
`include()`, without a need to transfer other modules' routines
through the exported objects)

- reuse "ordinary" JavaScript libraries designed to be loaded using
the `<script>` tag in a html-page (module format is very simple, and
such a library could be easily converted to a module by wrapping its
code with an `init()` function declaration)


### How to setup a new project based on the Helios Kernel

- Download the distribution
[here](https://github.com/asvd/helios-kernel/releases/download/v0.9.5/helios-kernel-0.9.5.tar.gz)
and unpack it somewhere, i.e. in `helios-kernel/` directory. You may
also use [npm](https://npmjs.org/) to install Helios Kernel under
Node.js:

```sh
$ npm install helios-kernel
```

- Create the initial module for the project, i.e. `main.js` with the
following content:

```js
// include the needed libraries here

init = function() {
    // start your application code here
    console.log('Hello world!');
}
```

To declare the initial module dependencies, use `include()` function at the
module head

- Create the web-based starting point which will load Helios Kernel
source, and then require the project initial script. Web-based
starting point could be for instance an `index.html` with the
following content:

```html
<script src="helios-kernel/kernel.js"></script>
<script>
    window.onload = function(){
        kernel.require('main.js');
    }
</script>
```

- Create the Node.js starting point which will load Helios Kernel
library, and then require the project initial script. Starting point
for Node.js could be for instance `nodestart.js` with the following
content:

```js
require('helios-kernel/kernel.js');
kernel.require( __dirname + '/main.js');
```

If you have used `npm` to install Helios Kernel, you may also do it
like this:

```js
require('helios-kernel');
kernel.require( __dirname + '/main.js');
```

- To launch the application under web-browser, load the newly created
`index.html`, or set the project directory as a web-server root. To
start the application under node, launch the newly created
`nodestart.js` using Node.js:

```sh
$ nodejs nodestart.js
```


### How to use Kernel-compatible library with an existing project

- Download the Helios Kernel distribution
[here](https://github.com/asvd/helios-kernel/releases/download/v0.9.5/helios-kernel-0.9.5.tar.gz)
and unpack it somwhere. For Node.js you may also use `npm` to install
Helios Kernel:

```sh
$ npm install helios-kernel
```

- Load the Helios Kernel library script `kernel.js` from the
distribution using any technique suitable for your
project/environment. For a browser-based environment you could add a
`<script>` tag to the head of HTML-document. For Node.js you could use
node's `require()` function to load Helios Kernel (see examples in the
previous section).

- After the Helios Kernel is loaded, you may use `kernel.require()`
function to load any Kernel-compatible library.

Optionally you can even convert and merge a Kernel-compatible library
using the [helios-merge](http://asvd.github.io/helios-merge/) tool
into a plain JavaScript bundle suitable for using without Helios
Kernel.


### How to create a Helios Kernel module

Module structure is explained in the first section of this
text. Basically a module consists of the two parts: the list of
dependencies in the module head using the `include()` function, and
the module code inside the `init()` function declaration:

```js
// list of dependencies
include('path/to/someLibrary.js');
include('../path/to/anotherLibrary.js');

init = function() {
    // module code,
    // objects declared in the included modules are available at this point
    someLibrary.sayHello();
}
```

The simpliest approach to make the module data available to other
modules, is to (globally) declare the needed objects.


### Dynamical module loading

To load a module in the runtime, use `kernel.require()` function. It
takes three arguments — absolute path of the module, and the two
callbacks — for a success and for a failure.

Unlike `include()` which is used for declaring a dependency in a
module head, and is mostly intended to work with relative paths,
`kernel.require()` only accepts specifying the absolute path. For a
web environment you may start it with the slash `/` which will stand
for the domain root. To load a remote module, provide the full URL
starting with a protocol (`http://...`). You may also provide an array
of paths to load several modules at once.

Second argument, the success callback, is a function which is called
after all demanded modules and their dependencies are successfully
loaded and initialized. Inside this callback you may start using the
objects provided by the requested modules.

Third argument is a failure callback which will be called in case if
some of the requested modules (or their dependencies has failed to be
loaded. Reasons could be very different (from syntax error to network
problems), therefore you must implement some reasonable fallback or
cancellation behaviour for the loading failure.

The returned value of `kernel.require()` is a reservation ticket, a
special object corresponding to a single `require()` act. You will
need the ticket if you wish to unload the requested modules in the
future when you don't need them anymore.

Therefore, dynamically loading a module looks like this:

```js
var sCallback = function() {
    // the library is loaded, we may use it now
    someLibrary.doSomething();
}

var fCallback = function() {
    // library failed to load, falling back
    console.log('Cannot go any further!');
}

var ticket = kernel.require(
    '/path/to/library.js', sCallback, fCallback
);
```


After you have finished using the requested modules, you may release
the ticket by calling `kernel.release()` function:

```js
kernel.release(ticket);
```

This will not make the Kernel to unload the related modules
immediately, instead the Kernel will know that they are not needed
anymore at the area related to the given ticket, and will unload the
modules after they will be released everywhere else.


### Module uninitializer

Upon the module unload, its code is removed from the Kernel cache. But
Kernel does not track the objects created by the module's initializer,
therefore you may provide an uninitializer function which would remove
the library objects. This function will be called during the module
unload.

Therefore the full version of a library module could look like this:

```js
// module initializer
init = function() {
    // (globally) declaring a library object
    someLibrary = {};

    // library method
    someLibrary.sayHello = function() {
        console.log('Hello World!');
    }
}


// module uninitializer
uninit = function() {
    // removing objects created in the initializer
    someLibrary = null;
    delete someLibrary;
}
```

If a module initializer declares a single compound object
encapsulating all the library routines (the recommended way,
`someLibrary` in the example above), simply clearing that object
should be enough, garbage collector should (hopefully) do the rest.


### How to convert an existing library to a Kernel module

If you have a library of any format, it usually defines a set of
routines which should be used from the outside later. In most of the
web-libraries which are intended to be included using the `<script>`
tag, a set of global objects is defined. In this case it should be
enough to wrap the library code with the `init()` function
declaration. So if the original source was like this:

```js
libraryObject = {
   ...
};

libraryFunction = function() {
   ...
};
```

then it should be remade like this:

```js
init = function() {
    libraryObject = {
       ...
    };

    libraryFunction = function() {
       ...
    }
}
```

Now this is a Helios Kernel compatible module, and could be loaded
using the `include()` function. If you load this module, the code of
library's `init()` function will be issued and initialize the objects
before the `init()` function code of the module which requested the
library.

For the libraries using some kind of export object, the whole code
should also be wrapped with the `init()` function. To make the
exported objects, they could be globally redeclared. For instance, a
CommonJS module could looks like this:

```js
this.someObject = {
   ...
};

this.someFunction = function() {
   ...
};
```

To be converted to the Helios module, it should be remade like this:

```js
init = function() {
    // global library object
    someLibrary = {};

    someLibrary.someObject = {
       ...
    };

    someLibrary.someFunction = function() {
       ...
    }
}
```

After this module is loaded, its routines could be referred to as
`someLibrary.someObject`.



[![Bitdeli Badge](https://d2weczhvl823v0.cloudfront.net/asvd/helios-kernel/trend.png)](https://bitdeli.com/free "Bitdeli Badge")

