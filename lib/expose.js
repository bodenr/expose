
/*!
 * Module dependencies.
 */

var fs = require('fs'),
    path = require('path'),
    env = process.env.NODE_ENV || 'development';

/**
 * Print a debug statement to `console.log` if
 * `process.env.NODE_ENV` is set to `debug` or
 * `trace`.
 *
 *  You can set the NODE_ENV in your calling code
 *  before `require`ing expose, or you can set it
 *  as an env variable prior to invoking `node`.
 *
 *  Examples:
 *
 *  process.env.NODE_ENV = 'debug';
 *  var expose = require('./lib/expose.js').expose;
 *  expose({...});
 *  // => debug messages
 *
 * @api private
 */

function debug() {
    if (env == 'debug' || env == 'trace') {
        console.log.apply(this, arguments);
    }
};

/**
 * Perform a top level mixing between and source
 * and destination object optionally skipping
 * undefined/null properties.
 *
 * Examples:
 *
 *  mixin({a: 'A'}, {b: 'B});
 *  // => {a: 'A', b: 'B'}
 *
 *  mixin({'a': null}, {b: 'B}, true);
 *  // => {b: 'B'}
 *
 * @param {Object} src
 * @param {Object} dest
 * @param {Boolean} skipEmpty
 * @returns {Object}
 * @api private
 */

function mixin(src, dest, skipEmpty) {
    // TODO: refactor into common module
    dest = dest || {}, src = src || {};
    Object.keys(src).forEach(function(key) {
        if (!exists(dest[key]) && (skipEmpty && exists(src[key]))) {
            dest[key] = src[key];
        }
    });
    return dest;
};

/**
 * Determines if a value is non null
 * and defined.
 *
 * @param o
 * @returns {Boolean}
 * @api private
 */

function exists(o) {
    // TODO: common module
    return o !== null && o !== undefined;
};

/**
 * Returns its argument as an array.
 *
 * @param o
 * @returns {Array}
 * @api private
 */

function asArray(o) {
    // TODO: common module
    return Array.isArray(o) ? o : [o];
};

/**
 * Resolve and return an absolute path.
 *
 * @param {String} dir The directory
 * @param {String} file The file in the directory
 * @returns {String} The resolved absolute path.
 * @api private
 */

function toPath(dir, file) {
    // TODO: move into common module
    return path.resolve(dir) + path.sep + file;
};

/**
 * Given a target string, test the string against
 * an array of `RegExp` objects representing patterns
 * to include and an array of `RegExp` objects
 * representing patterns to exclude. Only return
 * `true` when one of the inclusive patterns test
 * and when none of the exlude patterns test.
 *
 * @param {String} target The string to test.
 * @param {Array} grep An array of RegExp objects indicating inclusion.
 * @param {Array} ungrep An array of RegExp objects indicating exclusion.
 * @returns {Boolean} Returns true if 1 include pattern matches and 0 exclusions match.
 * @api private
 */

function test(target, grep, ungrep) {
    function testRegexes(regexes) {
        return regexes.some(function(regex) {
            return regex.test(target);
        });
    }
    return testRegexes(grep) && !testRegexes(ungrep);
};

/**
 * Import a module into the given scope there by
 * `require`ing the module and copying its exports
 * into the given scope object.
 *
 * @param {String} module The path to the module to require.
 * @param {Object} scope The namespace to import the modules exports into.
 * @api private
 */

function importModule(module, scope) {
    debug("Importing module: " + module);

    var imports = require(module);
    for (var k in imports) {
        if (imports.hasOwnProperty(k)) {
            scope[k] = imports[k];
        }
    }
};

/**
 * Perform importing on the given target based on the
 * given options. The target can be a directory to
 * walk or it can be a file.
 *
 * The `opts` passed in should be the same format
 * as those built with `defaultOpts`.
 *
 * @param {String} target The file or dir to target.
 * @param {Object} opts The options to use for importing.
 * @api private
 */

function load(target, opts) {
    target = path.resolve(target);

    debug("Load enter: " + target);

    if (fs.statSync(target).isDirectory()) {
        fs.readdirSync(target).forEach(function(file) {
            var fullPath = target + path.sep + file;

            if (fs.statSync(fullPath).isDirectory() && opts.recurse) {
                load(fullPath, opts);
            } else if (test(fullPath, opts.grep, opts.ungrep)) {
                importModule(fullPath, opts.scope);
            }
        });
    } else if (test(target, opts.grep, opts.ungrep)) {
        importModule(target, opts.scope);
    }
};

/**
 * Returns the grandparent module directory which
 * is assumed to be the requiring module.
 *
 * @returns {String} The grandparent module directory.
 * @api private
 */

function grandparentDir() {
    return path.dirname(module.parent.parent.filename);
};

/**
 * Build and return the default target directory to expose.
 * The default target will be the `lib` or `src`
 * directory of the module requiring expose,
 * whichever exists in that order. If neither of those exist
 * it will be the current working directory as defined by
 * `process.cwd()`.
 *
 * @returns {String} The default target dir to expose.
 * @api private
 */

function defaultTarget() {
    var targetDir = process.cwd();
    [toPath(grandparentDir(), 'lib'), toPath(grandparentDir(), 'src')].some(function(target) {
        try {
            if (fs.statSync(target).isDirectory()) {
                targetDir = target;
                return true;
            }
            return false;
        } catch (e) {
            // no path
        }
    });

    return targetDir;
};

/**
 * Returns the default options for this module merged
 * with the given options passed to this function.
 *
 * The defaults are as follows:
 * - grep: any file ending in `.js`
 * - ungrep: any path including `node_modules`
 * - scope: an empty object
 * - recurse: true
 * - targets: return value from `defaultTargets()`
 *
 * @param {Object} opts The options to merge the defaults into.
 * @returns {Object} The merged options.
 * @api private
 */

function defaultOpts(opts) {
    return mixin({targets: defaultTarget(),
            grep: [/\.js$/],
            ungrep: [/node_modules/],
            scope: {},
            recurse: true},
            opts, true);
};

/**
 * Expose exports from other modules based on the given `options`.
 *
 * The `options` object supports the following properties:
 * - targets: The target path(s) to expose. This can be an
 * array or a single file/dir.
 * - grep: An array of `RegExp` objects which indicate
 * path inclusions to expose.
 * - ungrep: An array of `RegExp` objects which indicate
 * path exclusions for expose.
 * - scope: The namespace scope to expose the exports on.
 * - recurse: A `boolean` indicating if expose should recurse
 * any sub-directories. See the `defaultOpts` function for the
 * defaults used.
 *
 *
 * @param {Object} options The options object to use for expose.
 * @api public
 */

module.exports = function(options) {
    var opts = defaultOpts(options),
        targets = asArray(opts.targets);

    opts.grep = asArray(opts.grep);
    opts.ungrep = asArray(opts.ungrep);

    debug("Expose with options:\n", opts);

    targets.forEach(function(target) {
        load(target, opts);
    });
    return opts.scope;
};
