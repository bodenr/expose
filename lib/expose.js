
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
        if (!dest[key] && (skipEmpty && src[key] != null && src[key] != undefined)) {
            dest[key] = src[key];
        }
    });
    return dest;
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
 * Import a module into the given scope.
 *
 * @param {String} module The path to the module to require.
 * @param {Object} scope The namespace to import the modules exports into.
 * @api private
 */

function importModule(module, scope) {
    debug("Importing module: " + module);

    var imports = require(module);
    for (k in imports) {
        if (imports.hasOwnProperty(k)) {
            scope[k] = imports[k];
        }
    }
};

/**
 * Perform importing on the given target based on the
 * given options.
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
 * Build and return the default target directory to expose.
 * The default target will be the `./lib` or `./src`
 * directory, whichever exists in that order, or it will
 * be the current working directory if neither of the above
 * exist.
 *
 * @returns {String} The default target dir to expose.
 * @api private
 */

function defaultTarget() {
    [toPath(__dirname, 'lib'), toPath(__dirname, 'src')].forEach(function(target) {
        try {
            if (fs.lstatSync(target).isDirectory()) {
                return target;
            }
        } catch (e) {
            // no path
        }
    });

    return __dirname;
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
 *
 * @api public
 */

exports.expose = function(options) {
    var opts = defaultOpts(options),
        targets = Array.isArray(opts.targets) ? opts.targets : [opts.targets];

    debug("Expose with options:\n", opts);

    targets.forEach(function(target) {
        load(target, opts);
    });
    return opts.scope;
};
