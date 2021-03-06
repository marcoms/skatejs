import fixture from '../../lib/fixture';
import helperElement from '../../lib/element';
import helperFixture from '../../lib/fixture';
import skate from '../../../src/index';

describe('api/property', function () {
  var elem;

  beforeEach(function () {
    elem = helperElement();
  });

  it('no arguments', function () {
    skate(elem.safe, {
      properties: {
        propName1: undefined
      }
    });

    var el = elem.create();
    el.propName1 = 'testing';
    expect(el.propName1).to.equal('testing', 'Value should just be passed through');
    expect(el.hasAttribute('prop-name1')).to.equal(false, 'Attribute linking should be off by default');
  });

  it('type', function () {
    skate(elem.safe, {
      properties: {
        propName1: Boolean,
        propName2: {
          type: Boolean
        }
      }
    });

    var el = elem.create();
    el.propName1 = '';
    el.propName2 = 'something';
    expect(el.propName1).to.equal(false, 'Type function can be specified instead of object');
    expect(el.propName2).to.equal(true, 'Object with only type definition can be specified');
  });

  it('attribute (Boolean)', function () {
    skate(elem.safe, {
      properties: {
        propName1: {
          attr: true
        }
      }
    });

    var el = fixture(`<${elem.safe} prop-name1="test1"></${elem.safe}>`).querySelector(elem.safe);
    skate.init(el);
    expect(el.propName1).to.equal('test1', 'property initialised from attribute');
    expect(el.getAttribute('prop-name1')).to.equal('test1', 'attribute matches initial value');
    el.propName1 = 'test2';
    expect(el.propName1).to.equal('test2', 'property updated to new value');
    expect(el.getAttribute('prop-name1')).to.equal('test2', 'attribute updated to new value');
  });

  it('attribute (String)', function () {
    skate(elem.safe, {
      properties: {
        propName1: {
          attr: 'my-attr'
        }
      }
    });

    var el = fixture(`<${elem.safe} my-attr="test1"></${elem.safe}>`).querySelector(elem.safe);
    skate.init(el);
    expect(el.propName1).to.equal('test1', 'property initialised from attribute');
    expect(el.getAttribute('my-attr')).to.equal('test1', 'attribute matches initial value');
    el.propName1 = 'test2';
    expect(el.propName1).to.equal('test2', 'property updated to new value');
    expect(el.getAttribute('my-attr')).to.equal('test2', 'attribute updated to new value');
  });

  it('attribute - removing', function () {
    skate(elem.safe, {
      properties: {
        propName1: {
          attr: true
        }
      }
    });

    var el = elem.create();
    el.propName1 = 'test';
    el.removeAttribute('prop-name1');
    expect(el.propName1).to.equal(undefined);

    el.propName1 = 'test';
    el.setAttribute('prop-name1', '');
    expect(el.propName1).to.equal('');
  });

  it('Boolean + attribute', function () {
    skate(elem.safe, {
      properties: {
        propName1: {
          attr: true,
          type: Boolean
        }
      }
    });

    var el = elem.create();

    el.propName1 = 'something';
    expect(el.propName1).to.equal(true, 'Value should just be converted to boolean true');
    expect(el.getAttribute('prop-name1')).to.equal('', 'Attribute should be added but no value should be set');

    el.propName1 = '';
    expect(el.propName1).to.equal(false, 'Value should be converted to boolean false');
    expect(el.hasAttribute('prop-name1')).to.equal(false, 'Attribute should be removed if value is false');
  });

  it('events', function () {
    var triggered = 0;

    skate(elem.safe, {
      properties: {
        propName1: null
      }
    });

    var el = elem.create();
    el.addEventListener('skate.property', () => ++triggered);
    el.propName1 = true;
    expect(triggered).to.equal(1);
  });

  it('dependencies', function () {
    var triggered = 0;

    skate(elem.safe, {
      properties: {
        propName1: null,
        propName2: {
          deps: 'propName1',
          set: function () {
            ++triggered;
          }
        }
      }
    });

    var el = elem.create();

    // Triggered twice. Once for propName1 and once for propName2.
    el.addEventListener('skate.property', () => ++triggered);

    // Will notify propName2.
    el.propName1 = true;

    // Twice for `skate.property` and once for the `propName2` setter.
    expect(triggered).to.equal(3);
  });

  it('dependencies (deep; elements must be in DOM)', function () {
    var triggeredNumber = 0;
    var triggeredTarget;
    var elem2 = helperElement();

    skate(elem.safe, {
      properties: {
        propName1: {
          deps: `propName1 > *`,
          set: () => ++triggeredNumber
        }
      }
    });

    skate(elem2.safe, {
      properties: {
        propName1: {}
      }
    });

    var el1 = elem.create();
    var el2 = elem2.create();

    el1.appendChild(el2);
    helperFixture().appendChild(el1);

    // We need to check the number of calls as well which element triggered the
    // property event.
    el1.addEventListener('skate.property', () => ++triggeredNumber);
    el1.addEventListener('skate.property', e => triggeredTarget = e.target);

    // Will notify el1.propName1.
    el2.propName1 = true;

    // One for the property, and two for the event triggered once by the
    // descendant and once by the host.
    expect(triggeredNumber).to.equal(3);
    expect(triggeredTarget).to.equal(el1);
  });

  it('attribute triggers property change', function () {
    var triggered;

    skate(elem.safe, {
      properties: {
        propName1: {
          attr: true,
          type: Boolean
        }
      }
    });

    var el = elem.create();
    el.addEventListener('skate.property', e => triggered = e.detail.newValue);
    el.setAttribute('prop-name1', '');
    expect(triggered).to.equal(true);
  });

  it('default value (scalar)', function () {
    skate(elem.safe, {
      properties: {
        propName1: {
          value: 'test'
        }
      }
    });

    var el = elem.create();
    expect(el.propName1).to.equal('test');
  });

  it('default value (function)', function () {
    skate(elem.safe, {
      properties: {
        propName1: {
          value: function () {
            return 'test';
          }
        }
      }
    });

    var el = elem.create();
    expect(el.propName1).to.equal('test');
  });

  it('should not notify if set to a falsy value', function () {
    var triggered = false;

    skate(elem.safe, {
      properties: {
        prop: {
          notify: false
        }
      }
    });

    var el = elem.create();
    el.addEventListener('skate.property', () => triggered = true);
    el.prop = true;
    expect(triggered).to.equal(false);
  });

  it('initial value should not trump existing attribute values', function () {
    skate(elem.safe, {
      properties: {
        trump: {
          attr: true,
          value: 'property'
        }
      }
    });

    helperFixture(`<${elem.safe} trump="attribute"></${elem.safe}>`);
    skate.init(helperFixture());
    var el = helperFixture().querySelector(elem.safe);
    expect(el.getAttribute('trump')).to.equal('attribute');
    expect(el.trump).to.equal('attribute');
  });

  it('internal values should not leak to other element instances of the same type', function () {
    skate(elem.safe, {
      properties: {
        prop1: {}
      }
    });

    var el1 = elem.create({ prop1: 'test1' });
    var el2 = elem.create({ prop1: 'test2' });
    expect(el1.prop1).to.equal('test1');
    expect(el2.prop1).to.equal('test2');
  });

  it('passing undefined should remove the linked attribute', function () {
    skate(elem.safe, {
      properties: {
        prop1: {
          attr: true
        }
      }
    });

    var el = elem.create({ prop1: 'test1' });
    expect(el.prop1).to.equal('test1');
    el.prop1 = undefined;
    expect(el.hasAttribute('prop1')).to.equal(false);
  });

  it('passing null should remove the linked attribute', function () {
    skate(elem.safe, {
      properties: {
        prop1: {
          attr: true
        }
      }
    });

    var el = elem.create({ prop1: 'test1' });
    expect(el.prop1).to.equal('test1');
    el.prop1 = null;
    expect(el.hasAttribute('prop1')).to.equal(false);
  });

  it('passing an empty string shoud not remove the linked attribute', function () {
    skate(elem.safe, {
      properties: {
        prop1: {
          attr: true
        }
      }
    });

    var el = elem.create({ prop1: 'test1' });
    expect(el.prop1).to.equal('test1');
    el.prop1 = '';
    expect(el.getAttribute('prop1')).to.equal('');
  });
});
