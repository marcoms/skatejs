import apiWatch from '../api/watch';
import attached from '../lifecycle/attached';
import created from '../lifecycle/created';
import detached from '../lifecycle/detached';
import globals from '../globals';
import ignored from '../util/ignored';
import registry from './registry';
import walkTree from '../util/walk-tree';

var DocumentFragment = window.DocumentFragment;

function getClosestIgnoredElement (element) {
  var parent = element;

  while (parent && parent !== document && !(parent instanceof DocumentFragment)) {
    if (ignored(parent)) {
      return parent;
    }

    parent = parent.parentNode;
  }
}

function documentObserverHandler (addedNodes, removedNodes) {
  // Since siblings are batched together, we check the first node's parent
  // node to see if it is ignored. If it is then we don't process any added
  // nodes. This prevents having to check every node.
  if (addedNodes.length && !getClosestIgnoredElement(addedNodes[0].parentNode)) {
    walkTree(addedNodes, function (element) {
      var components = registry.getForElement(element);
      var componentsLength = components.length;

      for (let a = 0; a < componentsLength; a++) {
        created(components[a]).call(element);
      }

      for (let a = 0; a < componentsLength; a++) {
        attached(components[a]).call(element);
      }
    });
  }

  // We can't check batched nodes here because they won't have a parent node.
  if (removedNodes.length) {
    walkTree(removedNodes, function (element) {
      var components = registry.getForElement(element);
      var componentsLength = components.length;

      for (let a = 0; a < componentsLength; a++) {
        detached(components[a]).call(element);
      }
    });
  }
}

export default globals.registerIfNotExists('observer', {
  observer: undefined,
  register: function () {
    if (!this.observer) {
      this.observer = apiWatch(document, documentObserverHandler, { subtree: true });
    }

    return this;
  },
  unregister: function () {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = undefined;
    }

    return this;
  }
});
