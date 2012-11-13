
/*!
 * Module dependencies.
 */

var fs = require('fs'),
    path = require('path'),
    env = process.env.NODE_ENV || 'development';

/*!
 * Node 0.6 does not define path.sep so define it
 * based on platform.
 */

// TODO: common module
var sep = path.sep ? path.sep
        : process.platform === 'win32' ? '\\' : '/';

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
    return Array.isArray(o)
            ? o
            : exists(o) ? [o] : [];
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
    return path.resolve(dir) + sep + file;
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
 * @param {Function} fn The optional callback function to invoke for each imported property.
 * @api private
 */

function importModule(module, scope, fn) {
    debug("Importing module: " + module);

    var imports = require(module),
        name = path.basename(module, path.extname(module));
    for (var k in imports) {
        if (imports.hasOwnProperty(k)) {
            scope[k] = imports[k];
            if (fn) {
                fn(name, k, imports[k]);
            }
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
            var fullPath = target + sep + file;

            if (fs.statSync(fullPath).isDirectory() && opts.recurse) {
                load(fullPath, opts);
            } else if (test(fullPath, opts.grep, opts.ungrep)) {
                importModule(fullPath, opts.scope, opts.fn);
            }
        });
    } else if (test(target, opts.grep, opts.ungrep)) {
        importModule(target, opts.scope, opts.fn);
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
 * Build and return the default target directory to expose
 * by determining the first directory that exists in the
 * following order:
 * `dirname(parentId) + /lib`
 * `dirname(parentId) + /src`
 * `dirname(grandparentDir())/lib`
 * `dirname(grandparentDir())/src`
 * `process.cwd()`
 *
 * @param {String} parentId The path of the requiring module.
 * @returns {String} The default target dir to expose.
 * @api private
 */

function defaultTarget(parentId) {
    var paths = [], targetDir = process.cwd();

    function pushTargets(p) {
        if (p) {
            paths.push(toPath(path.dirname(p), 'lib'));
            paths.push(toPath(path.dirname(p), 'src'));
        }
    }

    pushTargets(parentId);
    pushTargets(grandparentDir());

    paths.some(function(target) {
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
 * @param {String} parentId The path of the requiring module.
 * @returns {Object} The merged options.
 * @api private
 */

function defaultOpts(opts, parentId) {
    var targets = opts.targets && opts.targets.length
            ? asArray(opts.targets)
            : [defaultTarget(parentId)];

    return mixin({targets: targets,
            grep: [/\.js$/],
            ungrep: opts.ungrep && opts.ungrep.length
                    ? asArray(opts.ungrep)
                    : defaultUngrep(targets),
            scope: {},
            recurse: true},
            opts, true);
};


/*!
 * regex for node_modules path segment
 */

var NM_SEG = '(?:' + sep + '?node_modules' + sep + '|' + sep + '?node_modules$){1}';

/**
 * Escape the given string for windows style paths
 * by replacing `\` with `\\`.
 *
 * @param {String} str
 * @returns {String}
 * @api private
 */

function escape(str) {
    if (sep === '\\') {
        return str.replace(/\\/g, '\\\\');
    }
    return str;
};

/**
 * Build default ungrep pattern based on targets.
 *
 * @param {Array} targets
 * @returns {Array} The default ungrep regex in an array.
 * @api private
 */

function defaultUngrep(targets) {
    if (targets && targets.length) {
        var ungreps = [];
        targets.forEach(function(target) {
            target = '(?:^' + path.dirname(target) + sep + '){1}';
            target += '(?:/?.*/?)*' + NM_SEG;
            ungreps.push(new RegExp(escape(target)));
        });
        return ungreps;
    }
    return [new RegExp(escape(NM_SEG))];
};

module.exports = function(callerId) {
    var parentId = callerId;

    /**
     * Expose exports from other modules based on the given `options`.
     *
     * The `options` object supports the following properties:
     *
     * `targets` The target path(s) to expose. This can be an
     * array or a single file/dir. If not specified will
     * use the precedence as noted in the jsdocs for `defaultTarget()`.
     *
     * `grep` A single or array of `RegExp` objects which indicate
     * path inclusions to expose. The regex will be `test`ed
     * against each absolute file path in the `targets`. An
     * absolute path is considered a match if any of the `grep`
     * expressions match and none of the `ungrep` expressions
     * match.
     *
     * `ungrep` A single or array of `RegExp` objects which indicate
     * path exclusions for expose. The regex will be `test`ed
     * against each absolute file path in the `targets`. An
     * absolute path is considered a match if any of the `grep`
     * expressions match and none of the `ungrep` expressions
     * match. By default any sub-directory named `node_modules`
     * under the callers module path will be ignored. If you specify
     * any `ungrep`, your value(s) are used instead.
     *
     * `scope` The namespace scope to expose the exports on. For
     * example this can be the callers `exports` object. If not
     * specified an empty plain object is used and returned.
     *
     * `recurse` A `boolean` indicating if expose should recurse
     * any sub-directories. By default this is set to `true`.
     *
     * `fn` A callback `Function` to invoke for each property imported
     * during the expose process. The callback is invoked with 3 arguments
     * as follows `fn(module, propName, propVal)` where `module` is the
     * stripped (no path or extension) name of the module being imported,
     * `propName` is the name of the property being imported and `propVal`
     * is the actual value being imported.
     *
     * @param {Object} options The options object to use for expose.
     * @returns {Object} The `scope` object which now contains the exposed exports.
     * @api public
     */

    return function(options) {
        var opts = defaultOpts(options || {}, parentId),
            targets = asArray(opts.targets);

        opts.grep = asArray(opts.grep);
        opts.ungrep = asArray(opts.ungrep);

        debug("Expose with options:\n", opts);

        targets.forEach(function(target) {
            load(target, opts);
        });
        return opts.scope;
    };
};
