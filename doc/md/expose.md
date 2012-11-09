

<!-- Start /home/boden/git/expose/lib/expose.js -->

## debug()

Print a debug statement to `console.log` if
`process.env.NODE_ENV` is set to `debug` or
`trace`.

 You can set the NODE_ENV in your calling code
 before `require`ing expose, or you can set it
 as an env variable prior to invoking `node`.

 Examples:

 process.env.NODE_ENV = 'debug';
 var expose = require('./lib/expose.js').expose;
 expose({...});
 // =&gt; debug messages

## mixin(src, dest, skipEmpty)

Perform a top level mixing between and source
and destination object optionally skipping
undefined/null properties.

## Examples

 mixin({a: 'A'}, {b: 'B});
 // =&gt; {a: 'A', b: 'B'}

 mixin({'a': null}, {b: 'B}, true);
 // =&gt; {b: 'B'}

### Params: 

* **Object** *src* 

* **Object** *dest* 

* **Boolean** *skipEmpty* 

## toPath(dir, file)

Resolve and return an absolute path.

### Params: 

* **String** *dir* The directory

* **String** *file* The file in the directory

## test(target, grep, ungrep)

Given a target string, test the string against
an array of `RegExp` objects representing patterns
to include and an array of `RegExp` objects
representing patterns to exclude. Only return
`true` when one of the inclusive patterns test
and when none of the exlude patterns test.

### Params: 

* **String** *target* The string to test.

* **Array** *grep* An array of RegExp objects indicating inclusion.

* **Array** *ungrep* An array of RegExp objects indicating exclusion.

## importModule(module, scope)

Import a module into the given scope there by
`require`ing the module and copying its exports
into the given scope object.

### Params: 

* **String** *module* The path to the module to require.

* **Object** *scope* The namespace to import the modules exports into.

## load(target, opts)

Perform importing on the given target based on the
given options. The target can be a directory to
walk or it can be a file.

The `opts` passed in should be the same format
as those built with `defaultOpts`.

### Params: 

* **String** *target* The file or dir to target.

* **Object** *opts* The options to use for importing.

## grandparentDir()

Returns the grandparent module directory which
is assumed to be the requiring module.

## defaultTarget()

Build and return the default target directory to expose.
The default target will be the `lib` or `src`
directory of the module requiring expose,
whichever exists in that order. If neither of those exist
it will be the current working directory as defined by
`process.cwd()`.

## defaultOpts(opts)

Returns the default options for this module merged
with the given options passed to this function.

## The defaults are as follows
- grep: any file ending in `.js`
- ungrep: any path including `node_modules`
- scope: an empty object
- recurse: true
- targets: return value from `defaultTargets()`

### Params: 

* **Object** *opts* The options to merge the defaults into.

## expose(options)

Expose exports from other modules based on the given `options`.

The `options` object supports the following properties:
- targets: The target path(s) to expose. This can be an
array or a single file/dir.
- grep: An array of `RegExp` objects which indicate
path inclusions to expose.
- ungrep: An array of `RegExp` objects which indicate
path exclusions for expose.
- scope: The namespace scope to expose the exports on.
- recurse: A `boolean` indicating if expose should recurse
any sub-directories. See the `defaultOpts` function for the
defaults used.

### Params: 

* **Object** *options* The options object to use for expose.

<!-- End /home/boden/git/expose/lib/expose.js -->

