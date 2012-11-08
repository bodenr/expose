
var fs = require('fs'),
    path = require('path'),
    env = process.env.NODE_ENV || 'development';

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

function toPath(dir, file) {
    // TODO: move into common module
    return path.resolve(dir) + path.sep + file;
};

function test(target, grep, ungrep) {
    function testRegexes(regexes) {
        return regexes.some(function(regex) {
            return regex.test(target);
        });
    }
    return testRegexes(grep) && !testRegexes(ungrep);
};

function importModule(module, scope) {
    debug("Importing module: " + module);

    var imports = require(module);
    for (k in imports) {
        if (imports.hasOwnProperty(k)) {
            scope[k] = imports[k];
        }
    }
};

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

function defaultOpts(opts) {
    return mixin({targets: defaultTarget(),
            grep: [/\.js$/],
            ungrep: [/node_modules/],
            scope: {},
            recurse: true},
            opts, true);
};

exports.expose = function(options) {
    var opts = defaultOpts(options),
        targets = Array.isArray(opts.targets) ? opts.targets : [opts.targets];

    debug("Expose with options:\n", opts);

    targets.forEach(function(target) {
        load(target, opts);
    });
    return opts.scope;
};
