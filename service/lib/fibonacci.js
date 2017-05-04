// based on https://github.com/fvdm/nodejs-fibonacci
// adapted to run each iteration asynchronuously,
// allowing multiple "concurrent" calls in a nodejs app
let BigNum;
try {
  BigNum = require('./bn.js');
} catch (err) {
  BigNum = require('bn.js');
}

function Fibonacci() {
  const self = this;

  function iterate(limit, timeLimit) {
    const context = {
      limit,
      timeLimit,
      next: new BigNum(1),
      cur: new BigNum(-1),
      last: new BigNum(0),
      loop: new BigNum(0),
      start: new Date().getTime(),
      result: {},
      canceled: false
    };

    context.limit = context.limit && new BigNum(context.limit);

    return {
      cancel: () => {
        context.canceled = true;
      },
      do: () => oneIteration(context)
    };
  }

  function oneIteration(context) {
    while (true) {
      // prev cur -> now last
      // prev next -> now cur
      context.last = context.cur;
      context.cur = context.next;
      context.next = context.cur.add(context.last);

      context.result.number = context.next.toString();
      context.result.length = context.next.toString().length;
      context.result.iterations = context.loop.toString();
      context.result.ms = new Date().getTime() - context.start;

      if (context.canceled) {
        return context.result;
      }

      if (context.timeLimit && context.result.ms >= context.timeLimit) {
        return context.result;
      }

      // found the one
      if (context.limit && context.loop.eq(context.limit)) {
        return context.result;
      }

      // catch infinity
      if (context.next === 'Infinity') {
        context.callback({
          reason: 'infinity',
          max_limit: Number.MAX_LIMIT.toString(),
          last_result: context.result,
          iterations: context.loop.toString(),
          intended: context.limit ? context.limit : null
        });
      }

      // count
      context.loop = context.loop.add(new BigNum(1));
    }
  }

  // Given a number `n` of iteration, it returns the Fibonacci number
  // at position `n` in the sequence.
  self.compute = n => iterate(n, null);

  // Given a duration `t` in milliseconds, it computes the Fibonacci sequence
  // during this duration and returns the value it was able to compute and
  // the iteration number it reached.
  self.computeFor = duration => iterate(null, duration);

  // Generate an html document suitable for registering
  // a Fibonacci service endpoint with the web tester
  self.addEnpointHtml = (name, icon, pingEndpoint, crashEndpoint) => {
    const addEnpoint = 'http://deployment-options-tester.mybluemix.net/?action=add' +
      `&name=${encodeURIComponent(name)}` +
      `&icon=${encodeURIComponent(icon)}` +
      `&iterate=${encodeURIComponent(pingEndpoint)}` +
      `&crash=${encodeURIComponent(crashEndpoint)}`;

    const body = `<html><body><a href="${addEnpoint}">Add this service to the web tester</a></body></html>`;
    return body;
  };
}

module.exports = () => new Fibonacci();
