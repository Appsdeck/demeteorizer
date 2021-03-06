var proxyquire = require('proxyquire');
var sinon      = require('sinon');

var cpStub  = {};
var fsStub  = {};
var fstStub = {};

var demeteorizer = proxyquire('../lib/demeteorizer', {
  'child_process' : cpStub,
  'fs'            : fsStub,
  'fs-tools'      : fstStub
});

var context = { options: { input: '' } };

describe('demeteorizer', function () {

  before(function () {
    fsStub.existsSync = sinon.stub().returns(true);
    fstStub.remove = sinon.stub();
  });

  it('should exist', function () {
    demeteorizer.should.be.ok;
  });

  describe('#filterDep', function () {
    it('should filter aws-sdk-browser-builder', function () {
      (demeteorizer.filterDep('aws-sdk-browser-builder', '0.0.0') === null)
        .should.be.true;
    });

    it('should filter any version with 0.0.0', function () {
      (demeteorizer.filterDep('test', '0.0.0-cats') === null)
        .should.be.true;
    });

    it('should filter undefined versions', function () {
      (demeteorizer.filterDep('test', undefined) === null)
        .should.be.true;
    });
  });

  describe('#getMeteorVersion', function () {
    it('should get the correct meteor version', function () {
      cpStub.exec = sinon.stub().yields(null, 'Meteor 0.9.9.2', '');

      demeteorizer.getMeteorVersion(context, function () {
        context.meteorVersion.should.equal('0.9.x');
      });
    });

    it('should return an error if meteor is not installed', function (done) {
      cpStub.exec = sinon.stub().yields('command failed');

      demeteorizer.getMeteorVersion(context, function (err) {
        err.should.be.ok;
        err.message.should.equal(
          'Could not determine Meteor version. Make sure that Meteor is installed.'
        );
        done();
      });
    });
  });

  describe('#getBundleCommand', function () {
    it('should choose meteor bundle for 0.9.x', function () {
      context.meteorVersion = '0.9.x';
      demeteorizer.getBundleCommand(context).should.equal('meteor');
    });

    it('should choose mrt bundle for 0.8.x', function () {
      context.meteorVersion = '0.8.x';
      demeteorizer.getBundleCommand(context).should.equal('mrt');
    });
  });

  describe('#bundle', function () {
    it('should execute with the correct options', function () {
      context.options.output  = '.demeteorized';
      context.options.release = '0.9.x';
      context.options.debug   = true;

      cpStub.exec = sinon.spy();

      demeteorizer.bundle(context, function () {
        cpStub.exec
          .calledWith('cd  && mrt bundle --debug --release 0.9.x --directory .demeteorized')
          .should.be.true;
      });
    });
  });

});
