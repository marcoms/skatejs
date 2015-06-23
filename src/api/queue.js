import MutationObserver from '../polyfill/mutation-observer';

var queue = [];
var element = document.createElement('a');
var observer = new MutationObserver(function () {
  queue.forEach(func => func());
  queue = [];
});

observer.observe(element, { attributes: true });

export default function (func) {
  queue.push(func);
  element.setAttribute('a', '');
}
