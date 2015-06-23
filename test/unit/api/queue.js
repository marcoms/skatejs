import queue from '../../../src/api/queue';

describe('api/queue', function () {
  it('should enqueue callbacks and execute them in order', function (done) {
    var one, two;

    queue(() => one = true);
    queue(() => two = true);

    setTimeout(function () {
      expect(one).to.equal(true);
      expect(two).to.equal(true);
      done();
    });
  });
});
