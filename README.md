
Helios Kernel
=============

Helios Kernel is an open-source cross-platform javascript module
loader and dependence manager. It works both in browser-based
environment and in [nodejs](http://nodejs.org/). Helios Kernel tracks
modules dependence graph and can (un)load the corresponding modules
dynamically in the runtime according to the needs of different
independent parts of a project. It is smart enough to start
initializing the modules which are ready for that, while others are
still being downloaded or parsed, and to process different tricky
situations such as circular dependences or broken code (reporting the
problem, but still keeping the application alive). But the key feature
of the Helios Kernel is


## Simplicity

Typical module has the following structure:

```js
// dependences
include("path/to/library1.js");
include("../path/to/another/library2.js");

init = function() {
    // module body code which relies on the dependences
    ...
    ...
    ...
}
```

A set of `include()` expressions at the top is similar to including an
external source in many other programming languages/environments.
Helios Kernel will issue the code within the `init()` function of a
module as soon as all dependences included at the module head are
loaded.

The only argument of the `include()` function is the exact relative path
to the module which should be loaded beforehand - so that it is always
easy to find out the particular dependence source locaiton.

Inside the `init()` function of a module, a set of global objects are to
be declared, which will be visible by the dependent modules, and will
thus make up the module interface.

This is basicly everything you need to know to use the Helios Kernel
for setting-up the dependencies in your project. Simplicity of Helios
Kernel is intended to provide an alternative to different
implementatios of
[AMD API](https://github.com/amdjs/amdjs-api/wiki/AMD) for instance,
which are popular nowadays, but seem to be a bit overdesigned.


## How can Kernel be useful for browser-based applications

In the browser environments there is no native dependence management
solution. To ensure that a set of javascript-libraries is loaded, the
libraries are usually listed within a single html-page
header. Managing the dependences and loading order is too tricky in
this case, and gets more and more complicated along with the project
growth.

To solve this problem, several script loading approaches and libraries
exist, one of which is Helios Kernel.


## How can Kernel be useful for nodejs applications

In nodejs there is a native dependence declaration technique - the
`require()` function which implements the specifications suggested by
CommonJS(http://en.wikipedia.org/wiki/CommonJS) group.

Helios Kernel API pretends to be a simplier and more flexible
alternative to the CommonJS specifications.

### What is simplier:

- It is easier to find out where the particular dependence source code
  is located (dependences are always declared by exact path)

- A list of dependences is located in a single place (they are all
  listed in the module head)

- There could be no 'hidden' dependences declared in the middle of a
  code (dynamically loading additional modules is a different use-case
  which is performed by the `kernel.require()` function)

- Cycle dependences considered as an error (this prevents dependence
  mess-up and helps to keep everything in order)

- It is easier keep a library code split between the different modules
  (the routines declared by the library code do not need to be
  'passed' through the exported objects, they are declared as the
  global objects instead - this simplifies the creation of 'compound'
  library module which will simply `include()` all other modules each
  declaring the needed parts of the library)


### What is more flexible:

- It is possible to unload the code which is not needed anymore

- Any javascript library could be easily converted to the Helios
  Kernel module - in most cases its code should simply be wrapped with
  an `init()` function declaration

- Helios Kernel modules format is cross-compatible between browser and
  nodejs enviroment, therefore it is possible to create a library
  which will work unchanged under both environments (of course until
  there is some specific platform-dependent code)



## How to setup a new project based on the Helios Kernel

1. Download the distribution [here](http://localhost) and unpack it somwhere

2. Put your code to main.js inside the `init()` function, this is the
starting point.

3a. To launch the application from nodejs, load nodestart.js:

```bash
$ nodejs nodestart.js
```

3b. To launch the application from a browser environment, open
webstart.html in a browser

4. To declare module dependences, use `include()` function at the module
head (above the `init()` function declaration)




## How to use Helios Kernel compatible modules with existing project

1. Download the Helios Kernel distribution [here](http://localhost) and
unpack it somwhere

2. Load the Helios Kernel code which is located in `kernel/kernel.js`
of the distribution using any technique suitable for your
project/environment. For a browser-based environment you could add a
`<script>` tag to the head of HTML-document (see webstart.html for an
example). For nodejs you could use node's `require()` function to load
kernel.js (see nodestart.js for an example).

3. After the `kernel.js` is loaded, you may use `kernel.require()`
function of Helios Kernel to load any Helios-compatible library.



## How to create a Helios Kernel module

A module code should be located inside the `init()` function body which
is declared globally for each module. Above that function, a set of
dependences are listed using the `include()` function. Inside the `init()`
function, global objects should be declared. These are the objects
provided by the module to other modules which include this module as a
dependence.

For instance, you could have a module library.js providing a library
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



## Dynamical module loading

To load a module in the runtime, use `kernel.require()` function. It
takes three arguments - absolute path of the module, and two callbacks
- for a success and for a failure.

Unlike `include()` which is used for declaring a dependence in a
module head, and is mostly intended to work with relative paths,
`kernel.require()` only accepts specifying the absolute path. For a
web environment you may start it with the slash `/` which will stand
for the domain root. To load a romete module, provide the full URL
starting with a protocol (`http://...`). You may also provide an array
of paths to load several modules at once.

Second argument, the success callback, is a function which is called
after all demanded modules and their dependences are successfully
loaded and initialized. Inside that callback you may start using the
objects provided by the requested modules.

Third argument is a failure callback which will be called in case if
some of the requested modules (or their dependence) has failed to be
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



## Module uninitializer

Upon the module unload, its code is removed from the Kernel module
cache. But the Kernel does not track the objects created by the
module's initializer, therefore you may provide an uninitializer
function which should remove the library objects. This function will
be called during the module unload.

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


// module initializer
uninit = function() {
    // removing objects created in initializer
    myLibrary = null;
    delete myLibrary;
}
```

If the module initializer declares a single compound object containing
all the library routines inside (the recommended way, myLibrary in the
example above), simply clearing that object should be enough, garbage
collector should (hopely) do the rest.



## How to convert existing javascript library to Helios Kernel module

If you have a library of any format, it usually defines a set of
routines which should be later used from outside. In most of the
web-libraries which are intednded to be included using the `<script>`
tag, a set of global objects are simply defined. In this case it
should be enough to wrap the library code with an `init()` function
declaration. So if the original source was like this:

```js
libraryObject = {
   ...
};

libraryFunction = funciton() {
   ...
};
```

then it should be remade like this:

```js
init = function() {
    libraryObject = {
       ...
    };

    libraryFunction = funciton() {
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
should also be wrapped with an `init()` function, and the export object
should be declared globally. For instance, a nodejs module usually
looks like this:

```js
this.someObject = {
   ...
};

this.someFunction = funciton() {
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

    someLibrary.someFunction = funciton() {
       ...
    }
}
```

After this module is loaded, its routines should be refered as
`someLibrary.someObject`.

