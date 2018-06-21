import EmberObject from '../../../system/object';
import { Mixin, defineProperty, computed, addObserver, addListener, sendEvent } from 'ember-metal';

QUnit.module('EmberObject ES Compatibility');

QUnit.test('extending an Ember.Object', function(assert) {
  let calls = [];

  class MyObject extends EmberObject {
    constructor() {
      calls.push('constructor');
      super(...arguments);
      this.postInitProperty = 'post-init-property';
    }

    init() {
      calls.push('init');
      super.init(...arguments);
      this.initProperty = 'init-property';
    }
  }

  let myObject = MyObject.create({ passedProperty: 'passed-property' });

  assert.deepEqual(calls, ['constructor', 'init'], 'constructor then init called (create)');
  assert.equal(myObject.postInitProperty, 'post-init-property', 'constructor property available on instance (create)');
  assert.equal(myObject.initProperty, 'init-property', 'init property available on instance (create)');
  assert.equal(myObject.passedProperty, 'passed-property', 'passed property available on instance (create)');

  calls = [];
  myObject = new MyObject({ passedProperty: 'passed-property' });

  assert.deepEqual(calls, ['constructor', 'init'], 'constructor then init called (new)');
  assert.equal(myObject.postInitProperty, 'post-init-property', 'constructor property available on instance (new)');
  assert.equal(myObject.initProperty, 'init-property', 'init property available on instance (new)');
  assert.equal(myObject.passedProperty, 'passed-property', 'passed property available on instance (new)');
});

QUnit.test('normal method super', function(assert) {
  let calls = [];

  let Foo = EmberObject.extend({
    method() {
      calls.push('foo');
    },
  });

  let Bar = Foo.extend({
    method() {
      this._super();
      calls.push('bar');
    },
  });

  class Baz extends Bar {
    method() {
      super.method();
      calls.push('baz');
    }
  }

  let Qux = Baz.extend({
    method() {
      this._super();
      calls.push('qux');
    },
  });

  let Quux = Qux.extend({
    method() {
      this._super();
      calls.push('quux');
    },
  });

  class Corge extends Quux {
    method() {
      super.method();
      calls.push('corge');
    }
  }

  let callValues = ['foo', 'bar', 'baz', 'qux', 'quux', 'corge'];

  [Foo, Bar, Baz, Qux, Quux, Corge].forEach((Class, index) => {
    calls = [];
    new Class().method();

    assert.deepEqual(
      calls,
      callValues.slice(0, index + 1),
      'chain of static methods called with super'
    );
  });
});

QUnit.test('@test static method super', function(assert) {
  let calls;

  let Foo = EmberObject.extend();
  Foo.reopenClass({
    method() {
      calls.push('foo');
    },
  });

  let Bar = Foo.extend();
  Bar.reopenClass({
    method() {
      this._super();
      calls.push('bar');
    },
  });

  class Baz extends Bar {
    static method() {
      super.method();
      calls.push('baz');
    }
  }

  let Qux = Baz.extend();
  Qux.reopenClass({
    method() {
      this._super();
      calls.push('qux');
    },
  });

  let Quux = Qux.extend();
  Quux.reopenClass({
    method() {
      this._super();
      calls.push('quux');
    },
  });

  class Corge extends Quux {
    static method() {
      super.method();
      calls.push('corge');
    }
  }

  let callValues = ['foo', 'bar', 'baz', 'qux', 'quux', 'corge'];

  [Foo, Bar, Baz, Qux, Quux, Corge].forEach((Class, index) => {
    calls = [];
    Class.method();

    assert.deepEqual(
      calls,
      callValues.slice(0, index + 1),
      'chain of static methods called with super'
    );
  });
});

QUnit.test('using mixins', function(assert) {
  let Mixin1 = Mixin.create({
    property1: 'data-1'
  });

  let Mixin2 = Mixin.create({
    property2: 'data-2'
  });

  class MyObject extends EmberObject.extend(Mixin1, Mixin2) {}

  let myObject = new MyObject();
  assert.equal(myObject.property1, 'data-1', 'includes the first mixin');
  assert.equal(myObject.property2, 'data-2', 'includes the second mixin');
});

QUnit.test('using instanceof', function(assert) {
  class MyObject extends EmberObject {}

  let myObject1 = MyObject.create();
  let myObject2 = new MyObject();

  assert.ok(myObject1 instanceof MyObject);
  assert.ok(myObject1 instanceof EmberObject);

  assert.ok(myObject2 instanceof MyObject);
  assert.ok(myObject2 instanceof EmberObject);
});

QUnit.test('extending an ES subclass of EmberObject', function(assert) {
  let calls = [];

  class SubEmberObject extends EmberObject {
    constructor() {
      calls.push('constructor');
      super(...arguments);
    }

    init() {
      calls.push('init');
      super.init(...arguments);
    }
  }

  class MyObject extends SubEmberObject {}

  MyObject.create();
  assert.deepEqual(calls, ['constructor', 'init'], 'constructor then init called (create)');

  calls = [];
  new MyObject();
  assert.deepEqual(calls, ['constructor', 'init'], 'constructor then init called (new)');
});

QUnit.test('calling extend on an ES subclass of EmberObject', function(assert) {
  let calls = [];

  class SubEmberObject extends EmberObject {
    constructor() {
      calls.push('before constructor');
      super(...arguments);
      calls.push('after constructor');
      this.foo = 123;
    }

    init() {
      calls.push('init');
      super.init(...arguments);
    }
  }

  let MyObject = SubEmberObject.extend({});

  MyObject.create();
  assert.deepEqual(
    calls,
    ['before constructor', 'init', 'after constructor'],
    'constructor then init called (create)'
  );

  calls = [];
  new MyObject();
  assert.deepEqual(
    calls,
    ['before constructor', 'init', 'after constructor'],
    'constructor then init called (new)'
  );

  let obj = MyObject.create({
    foo: 456,
    bar: 789,
  });

  assert.equal(obj.foo, 123, 'sets class fields on instance correctly');
  assert.equal(obj.bar, 789, 'sets passed in properties on instance correctly');
});

QUnit.test('calling metaForProperty on a native class works', function (assert) {
  assert.expect(0);

  class SubEmberObject extends EmberObject {}

  defineProperty(
    SubEmberObject.prototype,
    'foo',
    computed('foo', {
      get() {
        return 'bar';
      },
    })
  );

  // able to get meta without throwing an error
  SubEmberObject.metaForProperty('foo');
});

QUnit.test('super and _super interop between old and new methods', function (assert) {
  let calls = [];
  let changes = [];
  let events = [];
  let lastProps;

  class A extends EmberObject {
    init(props) {
      calls.push('A init');
      lastProps = props;
    }
  }

  let Mixin1 = Mixin.create({
    init() {
      calls.push('Mixin1 init before _super');
      this._super(...arguments);
      calls.push('Mixin1 init after _super');
    },
  });

  let Mixin2 = Mixin.create({
    init() {
      calls.push('Mixin2 init before _super');
      this._super(...arguments);
      calls.push('Mixin2 init after _super');
    },
  });

  class B extends A.extend(Mixin1, Mixin2) {
    init() {
      calls.push('B init before super.init');
      super.init(...arguments);
      calls.push('B init after super.init');
    }

    onSomeEvent(evt) {
      events.push(`B onSomeEvent ${evt}`);
    }

    fullNameDidChange() {
      changes.push('B fullNameDidChange');
    }
  }

  // // define a CP
  defineProperty(
    B.prototype,
    'full',
    computed('first', 'last', {
      get() {
        return this.first + ' ' + this.last;
      },
    })
  );

  // Only string observers are allowed for prototypes
  addObserver(B.prototype, 'full', null, 'fullNameDidChange');

  // Only string listeners are allowed for prototypes
  addListener(B.prototype, 'someEvent', null, 'onSomeEvent');

  B.reopen({
    init() {
      calls.push('reopen init before _super');
      this._super(...arguments);
      calls.push('reopen init after _super');
    },
  });

  let C = B.extend({
    init() {
      calls.push('C init before _super');
      this._super(...arguments);
      calls.push('C init after _super');
    },

    onSomeEvent(evt) {
      calls.push('C onSomeEvent before _super');
      this._super(evt);
      calls.push('C onSomeEvent after _super');
    },

    fullNameDidChange() {
      calls.push('C fullNameDidChange before _super');
      this._super();
      calls.push('C fullNameDidChange after _super');
    },
  });

  class D extends C {
    constructor(props) {
      if (props.last === undefined) {
        props.last = 'Jackson';
      }
      super(props);
    }

    init() {
      calls.push('D init before super.init');
      super.init(...arguments);
      calls.push('D init after super.init');
    }

    onSomeEvent(evt) {
      events.push('D onSomeEvent before super.onSomeEvent');
      super.onSomeEvent(evt);
      events.push('D onSomeEvent after super.onSomeEvent');
    }

    fullNameDidChange() {
      changes.push('D fullNameDidChange before super.fullNameDidChange');
      super.fullNameDidChange();
      changes.push('D fullNameDidChange after super.fullNameDidChange');
    }

    triggerSomeEvent(...args) {
      sendEvent(this, 'someEvent', args);
    }
  }

  assert.deepEqual(calls, [], 'nothing has been called');
  assert.deepEqual(changes, [], 'full has not changed');
  assert.deepEqual(events, [], 'onSomeEvent has not been triggered');

  let d = D.create({ first: 'Robert' });

  assert.deepEqual(calls, [
    'D init before super.init',
    'C init before _super',
    'reopen init before _super',
    'B init before super.init',
    'Mixin2 init before _super',
    'Mixin1 init before _super',
    'A init',
    'Mixin1 init after _super',
    'Mixin2 init after _super',
    'B init after super.init',
    'reopen init after _super',
    'C init after _super',
    'D init after super.init',
  ]);
  assert.deepEqual(changes, [], 'full has not changed');
  assert.deepEqual(events, [], 'onSomeEvent has not been triggered');

  assert.deepEqual(lastProps, {
    first: 'Robert',
    last: 'Jackson',
  });

  assert.equal(d.get('full'), 'Robert Jackson');

  d.setProperties({ first: 'Kris', last: 'Selden' });
  assert.deepEqual(changes, [
    'D fullNameDidChange before super.fullNameDidChange',
    'B fullNameDidChange',
    'D fullNameDidChange after super.fullNameDidChange',
  ]);

  assert.equal(d.get('full'), 'Kris Selden');

  d.triggerSomeEvent('event arg');
  assert.deepEqual(events, [
    'D onSomeEvent before super.onSomeEvent',
    'B onSomeEvent event arg',
    'D onSomeEvent after super.onSomeEvent',
  ]);
});
