
Helios Kernel
=============

Helios Kernel is an open-source javascript module loader and
dependency manager. The library itself and its module format are
cross-compatible between the browser-based environment and
[Node.js](http://nodejs.org/). Therefore it is possible to run the same
code without any conversion in both environments. Helios Kernel tracks
the dependency graph and can load and unload corresponding modules
dynamically in the runtime according to the needs of different and
independent parts of an application. It is smart enough to start
initializing the modules which are ready for that, while others are
still being downloaded or parsed, and to handle some tricky problems
such as circular dependencies or broken code (reporting the problem,
but still keeping the application alive). But the key feature of the
Helios Kernel is


### Simplicity

Helios Kernel follows the [KISS
principle](http://en.wikipedia.org/wiki/KISS_principle), which means
that it only contains the necessary features intended to make
dependency management simple and flexible.

Dependency declaration is implemented in the classic
inculde-style. This is an example of a module which includes and
reuses some dependencies:

```js
// list of dependencies
include("path/to/myLibrary.js");
include("../path/to/anotherLibrary.js");

init = function() {
    // module code,
    // objects declared in the included modules are available at this point
    myLibrary.sayHello();
}
```

In the head of a module, a set of dependencies are listed using the
`include()` function. Each call of this function stands for a single
dependency. The code inside the `init()` function declaration is a
module code. It will be issued by Helios Kernel as soon as all
dependencies included at the module head are loaded.

The only argument of the `include()` function is the exact path to the
module which should be loaded beforehand — so that it is always easy
to find out the particular dependency source locaiton.

This is how `myLibrary.js` included in the module above could look:

```js
init = function() {
    // (globally) declaring a library object
    myLibrary = {};

    // library method
    myLibrary.sayHello = function() {
        console.log("Hello World!");
    }
}
```

In this example, the `init()` function declares a global object. This
way of exproting data is considered unsafe sometimes, since it could
lead to data collision.  But in this text such approach is used
because of its simplicity. Helios Kernel does not force a specific way
of exporting: `init()` function may contain any code you
prefer. Particulary it could declare a factory function safely
returning a library object. (But if you only need to keep some private
module data, you may use the `init()` function scope)

This is basicly everything you need to know to start using Helios
Kernel for setting-up dependencies in your project.

This text contains the full documentation on Helios Kernel.


### How can Kernel be useful for browser-based applications

In the browser environments there is no native dependency management
solution. To ensure that a set of javascript-libraries is loaded, the
libraries are usually listed within a single html-page
header. Managing the dependencies and loading order is too tricky in
this case, and gets more and more complicated along with the project
growth.

To solve this problem, several script loading approaches and libraries
exist, one of which is Helios Kernel. This library may be preferred in
case when there is a need to create an application which will be
compatible between web environment and Node.js without any conversion.
One may also choose Helios Kernel because of its simplicity. Comparing
to other approaches which seem a bit overdesigned sometimes, with
Helios Kernel it could be more convenient to:

- modify or refactor a list of dependencies, especially when are a lot
of them (each dependency is just a single `include()` line at the
module head)

- create a compound module which should load several modules used at
once (in Helios Kernel such module could simply list all dependencies
using `include()`, without the need to transfer other modules'
routines through the exported objects)

- reuse "ordinary" javascript libraries designed to be loaded using
the `<script>` tag in a html-page. Helios Kernel module format
is very simple, so such library could be easily converted to a module
by wrapping its code with an `init()` function declaration.



### How can Kernel be useful for Node.js applications

In Node.js there is a native dependency declaration technique — the
`require()` function which implements the specifications suggested by
[CommonJS](http://en.wikipedia.org/wiki/CommonJS) group.

Helios Kernel API pretends to be a simplier and more flexible
alternative to the CommonJS specifications.

#### What is simplier:

- It is easier to see and declare module's dependencies (they are
  always listed in the module head, not inside its body, not in some
  external config)

- There could be no 'hidden' dependencies declared in the middle of a
  code (dynamically loading additional modules is a different use-case
  which is performed by the `kernel.require()` function)

- It is easier to find out where the particular dependency source code
  is located (dependencies are always declared by exact path)

- Module structure, documentation and usage are simplier (there is no
  need to declare a special export object and reuse it in the
  dependent modules, instead library objects are exported using the
  global scope, and they are always referred with the same name)

- Circular dependencies considered as an error (which prevents
  dependency mess-up and helps to keep everything in order)

- It is easier to split the library objects between the different
  modules (since there is no export object, it is easier to create a
  compound library module which will simply include all library
  modules each making up some part of the library)


#### What is more flexible:

- It is possible to unload the code which is not needed anymore

- Any javascript library could be easily converted to the Helios
  Kernel module — in most cases its code should simply be wrapped with
  an `init()` function declaration

- And of course, since the library and the module format are
  cross-compatible both in browser environment, and in Node.js, you may
  also run the same code in a browser without any conversion



### How to setup a new project based on the Helios Kernel

- Download the distribution
[here](https://github.com/asvd/helios-kernel/releases/download/v0.9.5/helios-kernel-0.9.5.tar.gz)
and unpack it somwhere, i.e. in `helios-kernel/` directory. You may
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
    console.log('hello world!');
}
```

To declare the initial module dependencies, use `include()` function at the
module head

- Create the web-based starting point which will load Helios Kernel
source, and then require the project initial script. Web-based
starting point could be for instance `index.html` with the following
content:

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

If you have used npm to install Helios Kernel, you may also do it like
this:

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



### How to use Kernel-compatible modules with an existing project

- Download the Helios Kernel distribution
[here](https://github.com/asvd/helios-kernel/releases/download/v0.9.5/helios-kernel-0.9.5.tar.gz)
and unpack it somwhere. For Node.js you may also use npm to install
Helios Kernel:

```sh
$ npm install helios-kernel
```

- Load the Helios Kernel library script `kernel.js` in the
distribution using any technique suitable for your
project/environment. For a browser-based environment you could add a
`<script>` tag to the head of HTML-document. For Node.js you
could use node's `require()` function to load Helios Kernel (see
examples in the previous section).

- After the Helios Kernel is loaded, you may use `kernel.require()`
function to load any Kernel-compatible library.



### How to create a Helios Kernel module

A module code should be located inside the `init()` function body which
is declared globally for each module. Above that function, a set of
dependencies are listed using the `include()` function. Inside the `init()`
function, global objects could be declared. These are the objects
provided by the module to other modules which include this module as a
dependency.

For instance, you could have a module `library.js` providing a library
function to any module which will include it:

```js
// library.js module initializer
init = function() {
    // global object containing the library routines
    myLibrary = {};

    // function provided by the library
    myLibrary.doSomething = function() {
        console.log('hello');
    }
}
```


And this is how a module using that library should look like:

```js
include("path/to/library.js");

init = function() {
    // library is loaded and we can use it at this point
    myLibrary.doSomething();  // will print 'hello'
}
```



### Dynamical module loading

To load a module in the runtime, use `kernel.require()` function. It
takes three arguments — absolute path of the module, and two callbacks —
for a success and for a failure.

Unlike `include()` which is used for declaring a dependency in a
module head, and is mostly intended to work with relative paths,
`kernel.require()` only accepts specifying the absolute path. For a
web environment you may start it with the slash `/` which will stand
for the domain root. To load a remote module, provide the full URL
starting with a protocol (`http://...`). You may also provide an array
of paths to load several modules at once.

Second argument, the success callback, is a function which is called
after all demanded modules and their dependencies are successfully
loaded and initialized. Inside that callback you may start using the
objects provided by the requested modules.

Third argument is a failure callback which will be called in case if
some of the requested modules (or their dependency) has failed to be
loaded. Reasons could be very different (from syntax error and to
network problems), therefore you must implement some reasonable
fallback or cancellation behaviour for the loading failure.

The returned value of `kernel.require()` is a reservation ticket, a
special object corresponding to the single `require()` act. You will
need the ticket to unload requested modules in the future when you
don't need them anymore.

Therefore, dynamically loading a module looks like this:

```js
var sCallback = function() {
    // the library is loaded, we may use it now
    myLibrary.doSomething();
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

This will not make the Kernel unload the module immediately, instead
the Kernel will know that the module is not needed anymore at the area
related to the given ticket, and will unload the module after it will
be released everywhere else.



### Module uninitializer

Upon the module unload, its code is removed from the Kernel cache. But
the Kernel does not track the objects created by the module's
initializer, therefore you may provide an uninitializer function which
should remove the library objects. This function will be called during
the module unload.

Therefore the full version of a library module will look like this:

```js
// module initializer
init = function() {
    // global object containing the library routines
    myLibrary = {};

    // function provided by the library
    myLibrary.doSomething = function() {
        console.log('hello');
    }
}


// module uninitializer
uninit = function() {
    // removing objects created in initializer
    myLibrary = null;
    delete myLibrary;
}
```

If a module initializer declares a single compound object containing
all the library routines inside (the recommended way, `myLibrary` in
the example above), simply clearing that object should be enough,
garbage collector should (hopely) do the rest.



### How to convert existing javascript library to Kernel module

If you have a library of any format, it usually defines a set of
routines which should be later used from outside. In most of the
web-libraries which are intednded to be included using the
`<script>` tag, a set of global objects are simply defined. In
this case it should be enough to wrap the library code with the
`init()` function declaration. So if the original source was like
this:

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
using `include()` function. If you load this module, the code of
library's `init()` function will be issued and initialize the objects
before the `init()` function code of the module which requested the
library.

For the libraries using some kind of export object, the whole code
should also be wrapped with the `init()` function, and the export
object should be declared globally. For instance, a Node.js module
usually looks like this:

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

After this module is loaded, its routines should be refered as
`someLibrary.someObject`.

