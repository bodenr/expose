
var expose = require('../..'),
    path = require('path');

var sep = path.sep ? path.sep
        : process.platform === 'win32' ? '\\' : '/';

function subdirPattern(dir) {
    // TODO: refactor into common module
    var pat = '(?:^' + __dirname + sep + '){1}';
    pat += '(?:/?.*/?)*' +
            '(?:' + sep + '?' + dir + sep + '|' + sep + '?' + dir +'$){1}';
    if (sep === '\\') {
        pat = pat.replace(/\\/g, '\\\\');
    }
    return new RegExp(pat);
}

describe('expose()', function() {

    it('should import all of /lib by default', function() {
        var imports = expose();
        imports.should.have.property('a');
        imports.should.have.property('b');
        imports.should.have.property('c');
        Object.keys(imports).length.should.equal(3);
    });

    it('should honor no recurse', function() {
        var imports = expose({recurse: false});
        imports.should.have.property('a');
        imports.should.have.property('b');
        Object.keys(imports).length.should.equal(2);
    });

    it('should honor single file grep', function() {
        var imports = expose({grep: /a.js$/});
        imports.should.have.property('a');
        Object.keys(imports).length.should.equal(1);
    });

    it('should honor directory grep', function() {
        var imports = expose({grep: /\inc/});
        imports.should.have.property('c');
        Object.keys(imports).length.should.equal(1);
    });

    var ungrepMods = subdirPattern('node_modules');
    var ungrepInc = subdirPattern('inc');

    it('should honor directory ungrep', function() {
        var imports = expose({ungrep: [ungrepInc, ungrepMods]});
        imports.should.have.property('a');
        imports.should.have.property('b');
        Object.keys(imports).length.should.equal(2);
    });

    it('should honor single file ungrep', function() {
        var imports = expose({ungrep: [/b.js$/, ungrepMods, ungrepInc]});
        imports.should.have.property('a');
        Object.keys(imports).length.should.equal(1);
    });

    it('should use specified scope', function() {
        var imports = {};
        expose({scope: imports, ungrep: [/b.js$/, ungrepMods, ungrepInc]});
        imports.should.have.property('a');
        Object.keys(imports).length.should.equal(1);
    });

    it('should use multiple target dirs', function() {
        var imports = expose({targets: ['./test/defaults/lib/inc',
                                        './test/defaults/lib/node_modules'],
                              ungrep: []});
        imports.should.have.property('c');
        imports.should.have.property('d');
        Object.keys(imports).length.should.equal(2);
    });

    it('should permit non array target', function() {
        var imports = expose({targets: './test/defaults/lib/inc'});
        imports.should.have.property('c');
        Object.keys(imports).length.should.equal(1);
    });

    it('should permit non array ungrep', function() {
        var imports = expose({ungrep: /c.js$/});
        imports.should.have.property('a');
        imports.should.have.property('b');
        imports.should.have.property('d');
        Object.keys(imports).length.should.equal(3);
    });
});
