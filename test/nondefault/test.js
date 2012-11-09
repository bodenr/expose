var expose = require('../..');

describe('expose()', function() {
    it('should expose /src modules', function () {
        var imports = expose();
        imports.should.have.property('a');
        Object.keys(imports).length.should.equal(1);
    });
});