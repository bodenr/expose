
var expose = require('../..');

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

    it('should honor directory ungrep', function() {
        var imports = expose({ungrep: [/inc/, /node_modules/]});
        imports.should.have.property('a');
        imports.should.have.property('b');
        Object.keys(imports).length.should.equal(2);
    });

    it('should honor single file ungrep', function() {
        var imports = expose({ungrep: [/b.js$/, /node_modules/, /inc/]});
        imports.should.have.property('a');
        Object.keys(imports).length.should.equal(1);
    });

    it('should use specified scope', function() {
        var imports = {};
        expose({scope: imports, ungrep: [/b.js$/, /node_modules/, /inc/]});
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
});
