'use strict';

// TODO: Remove tryCastToInt?
// TODO: Use custom Set implementation only if Set from ES6 isn't supported.

/////////////////////////////////////////////////////////////////////////////
// SetCategory

function SetCategory() {
}

extend(SetCategory, Category, BicompleteCategory);

SetCategory.prototype.object = function (elements) {
  return new Set(elements);
};

SetCategory.prototype.morphism = function (A, B, mapping) {
  return new TotalFunction(A, B, mapping);
};

SetCategory.prototype.id = function (A) {
  return this.morphism(A, A).initId();
};

SetCategory.prototype.compose = function (g, f) {
  return g.compose(f);
};

SetCategory.prototype.hasObject = function (A) {
  return A instanceof Set;
};

SetCategory.prototype.hasMorphism = function (f) {
  return f instanceof TotalFunction && f.isTotal();
};

Category.prototype.equals = function (cat) {
  return this.constructor === cat.constructor;
};

SetCategory.prototype.terminal = function () {
  return new SetTerminalObject(this);
};

SetCategory.prototype.initial = function () {
  return new SetInitialObject(this);
};

SetCategory.prototype.product = function (A, B) {
  return new SetProduct(this, A, B);
};

SetCategory.prototype.coproduct = function (A, B) {
  return new SetCoproduct(this, A, B);
};

SetCategory.prototype.coproductComplement = function (f) {
  return new SetCoproductComplement(this, f);
};

SetCategory.prototype.equalizer = function (f, g) {
  return new SetEqualizer(this, f, g);
};

SetCategory.prototype.coequalizer = function (f, g) {
  return new SetCoequalizer(this, f, g);
};

/////////////////////////////////////////////////////////////////////////////
// Set

function Set(elements) {
  this._set = {};

  if (!isUndefined(elements)) {
    this.addAll(elements);
  }
}

Set.prototype.contains = function (element) {
  return has(this._set, hashCode(element));
};

Set.prototype.add = function (element) {
  var id = hashCode(element);
  assert(!this.contains(id));
  this._set[id] = element;
};

Set.prototype.addAll = function (elements) {
  assert(elements instanceof Array);
  for (var i = 0; i < elements.length; i++) {
    this.add(elements[i]);
  }
};

Set.prototype.getNextId = function () {
  var elements = this.elements();
  for (var i = elements.length - 1; i >= 0; i--) {
    if (typeof elements[i] == 'number') {
      return elements[i] + 1;
    }
  }
  return 1;
};

Set.prototype.ordinal = function (element) {
  var i = 0;
  for (var prop in this._set) {
    if (has(this._set, prop) && prop == hashCode(element)) {
      return i;
    }
    i++;
  }
};

Set.prototype.addNext = function () {
  var id = this.getNextId();
  this.add(id);
  return id;
};

Set.prototype.remove = function (element) {
  delete this._set[hashCode(element)];
};

Set.prototype.removeAll = function (elements) {
  assert(elements instanceof Array);
  for (var i = 0; i < elements.length; i++) {
    this.remove(elements[i]);
  }
};

Set.prototype.diff = function (s) {
  var res = new Set(this.elements());
  res.removeAll(s.elements());
  return res;
};

Set.prototype.union = function (s) {
  var res = new Set(this.elements());
  res.addAll(s.elements());
  return res;
};

Set.prototype.intersection = function (s) {
  var res = new Set();
  this.forEach(function (x) {
    if (s.contains(x)) {
      res.add(x);
    }
  });
  return res;
};

Set.prototype.clear = function () {
  this._set = {};
};

Set.prototype.isEmpty = function () {
  return this.size() > 0 ? false : true;
};

Set.prototype.isSubsetOf = function (s) {
  return this.every(s.contains, s);
};

Set.prototype.hasIntersectionWith = function (s) {
  return this.some(s.contains, s);
};

Set.prototype.equals = function (s) {
  if (!(s instanceof Set)) {
    return false;
  }
  var elements1 = this.elements();
  var elements2 = s.elements();
  if (elements1.length != elements2.length) return false;
  for (var i = 0; i < elements1.length; i++) {
    if (!equals(elements1[i], elements2[i])) return false;
  }
  return true;
};

Set.prototype.elements = function () {
  var keys = [];
  for (var key in this._set) {
    if (has(this._set, key)) {
      keys.push(key);
    }
  }
  keys.sort();
  var arr = [];
  for (var i = 0; i < keys.length; i++) {
    arr.push(this._set[keys[i]]);
  }
  return arr;
};

Set.prototype.forEach = function (callback, context) {
  assert(typeof callback == 'function');
  var f = isUndefined(context)
    ? function (item) { callback(item); }
    : function (item) { callback.call(context, item); };
  for (var prop in this._set) {
    if (has(this._set, prop)) {
      f(this._set[prop]);
    }
  }
};

Set.prototype.every = function (callback, context) {
  assert(typeof callback == 'function');
  var f = isUndefined(context)
    ? function (item) { return callback(item); }
    : function (item) { return callback.call(context, item); };
  for (var prop in this._set) {
    if (has(this._set, prop)) {
      if (!f(this._set[prop])) return false;
    }
  }
  return true;
};

Set.prototype.some = function (callback, context) {
  assert(typeof callback == 'function');
  var f = isUndefined(context)
    ? function (item) { return callback(item); }
    : function (item) { return callback.call(context, item); };
  for (var prop in this._set) {
    if (has(this._set, prop)) {
      if (f(this._set[prop])) return true;
    }
  }
  return false;
};

Set.prototype.representative = function () {
  for (var prop in this._set) {
    if (has(this._set, prop)) {
      return this._set[prop];
    }
  }
};

Set.prototype.random = function (callback, context) {
  // TODO: I hope it could be more effective
  assert(typeof callback == 'function');
  var f = isUndefined(context)
    ? function (item) { return callback(item); }
    : function (item) { return callback.call(context, item); };
  var last;
  var count = 0;
  for (var prop in this._set) {
    if (has(this._set, prop)) {
      if (f(prop)) {
        if (Math.round(Math.random() * count++) === 0) {
          last = prop;
        }
      }
    }
  }
  if (!isUndefined(last)) {
    return this._set[last];
  }
};

Set.prototype.size = function () {
  return this.elements().length;
};

Set.prototype.toString = function () {
  return '{' + this.elements().map(quoteSetElement).join() + '}';
};

/////////////////////////////////////////////////////////////////////////////
// TotalFunction

function TotalFunction(dom, codom, mapping) {
  assert(dom instanceof Set, 'Domain must be a Set');
  assert(codom instanceof Set, 'Codomain must be a Set');

  this._mapping = {};

  this.dom = function () { return dom; };

  this.codom = function () { return codom; };

  if (!isUndefined(mapping)) {
    if (mapping instanceof Array) {
      for (var i=0; i < mapping.length; i++) {
        this.push(mapping[i][0], mapping[i][1]);
      }
    }
    else if (mapping instanceof Object) {
      for (var prop in mapping) {
        if (has(mapping, prop)) {
          this.push(tryCastToInt(prop), mapping[prop]);
        }
      }
    }
    else {
      throw 'Mapping must be an Object or Array';
    }
  }
}

// TODO: What's the difference between equals and commutes?
TotalFunction.prototype.equals = function (f) {
  assert(this.isTotal() && f.isTotal());
  if (!this.dom().equals(f.dom()) || !this.codom().equals(f.codom())) {
    return false;
  }
  var elements1 = this.elements();
  var elements2 = f.elements();
  for (var i in elements1) {
    if (has(elements1, i) && has(elements2, i)) {
      if (elements1[i] !== elements2[i]) return false;
    }
    else if (has(elements1, i) || has(elements2, i)) {
      return false;
    }
  }
  return true;
};

TotalFunction.prototype.forEach = function (f) {
  for (var prop in this._mapping) {
    if (has(this._mapping, prop)) {
      f(tryCastToInt(prop), this._mapping[prop]);
    }
  }
};

// TODO: Use forEach
TotalFunction.prototype.elements = function () {
  return this._mapping;
};

TotalFunction.prototype.image = function (source) {
  if (!isUndefined(source)) {
    if (has(this._mapping, source)) {
      return this._mapping[source];
    }
  }
  else {
    var image = new Set();
    for (var prop in this._mapping) {
      if (has(this._mapping, prop)) {
        image.add(this._mapping[prop]);
      }
    }
    return image;
  }
};

TotalFunction.prototype.imageComplement = function () {
  return new Set(this.codom().diff(this.image()));
};

TotalFunction.prototype.preimage = function (target) {
  var preimage = new Set();
  for (var prop in this._mapping) {
    if (has(this._mapping, prop) && (isUndefined(target) || this._mapping[prop] === target)) {
      preimage.add(tryCastToInt(prop));
    }
  }
  return preimage;
};

TotalFunction.prototype.push = function (source, target) {
  assert(this.dom().contains(source),
    'Element \'' + source + '\' must be contained in a domain ' + this.dom());
  assert(this.codom().contains(target),
    'Element \'' + target + '\' must be contained in a codomain ' + this.codom());
  this._mapping[source] = typeof target == 'number' ? target : target.toString();
};

TotalFunction.prototype.compose = function (f) {
  assertComposable(f, this);
  var h = new TotalFunction(f.dom(), this.codom());
  for (var prop in f._mapping) {
    if (has(f._mapping, prop)) {
      h.push(tryCastToInt(prop), this.image(f._mapping[prop]));
    }
  }
  return h;
};

// TODO: Maybe partial functions must be separated out?
// TODO: Reverse order of functions?
TotalFunction.prototype.composePartial = function (f) {
  //console.log('==', this.codom().toString(), f.dom().toString());
  assert(f.dom().isSubsetOf(this.codom()));
  var h = new TotalFunction(this.dom(), f.codom());
  for (var prop in this._mapping) {
    if (has(this._mapping, prop)) {
      var t = f.image(this._mapping[prop]);
      assert(!isUndefined(t));
      h.push(tryCastToInt(prop), t);
    }
  }
  return h;
};

TotalFunction.prototype.complement = function (f) {
  assert(this.dom().equals(f.dom()));
  assert(this.isTotal());
  assert(f.isTotal());
  var g = new TotalFunction(this.codom(), f.codom());
  this.dom().forEach(function (x) {
    g.push(this.image(x), f.image(x));
  }.bind(this));
  assert(g.isTotal());
  assertCommutes(g.compose(this), f);
  return g;
};

TotalFunction.prototype.union = function (f) {
  assert(!this.dom().hasIntersectionWith(f.dom()));
  var mapping = {};
  this.forEach(function (s, t) { mapping[s] = t; });
  f.forEach(function (s, t) { mapping[s] = t; });
  return new TotalFunction(this.dom().union(f.dom()), this.codom().union(f.codom()), mapping);
};

TotalFunction.prototype.decomposeToEM = function () {
  var image = this.image();
  var e = new TotalFunction(this.dom(), image, this._mapping);
  var m = new TotalFunction(image, this.codom()).initId();
  return {'e': e, 'm': m};
};

TotalFunction.prototype.commutes = function (f) {
  assert(this.dom().equals(f.dom()) && this.codom().equals(f.codom()),
    'Morphisms must has the same domain and codomain');
  assert(this.isTotal() && f.isTotal(),
    'Morphisms must be a total functions');
  return this.preimage().every(function (x) {
    return this.image(x) === f.image(x);
  }.bind(this));
};

TotalFunction.prototype.inv = function () {
  // TODO: Why? I think it must be bijective
  assert(this.isMono(), 'Only a monomorphism has an inversion');
  var f = new TotalFunction(this.codom(), this.dom());
  for (var prop in this._mapping) {
    if (has(this._mapping, prop)) {
      f.push(this._mapping[prop], tryCastToInt(prop));
    }
  }
  return f;
};

// TODO: It's an automorphism
TotalFunction.prototype.initId = function () {
  var dom = this.dom();
  var codom = this.codom();
  assert(dom.isSubsetOf(codom), 'Domain ' + dom + ' must be a subset of a codomain ' + codom);
  this._mapping = {};
  dom.forEach(function (x) { this.push(x, x); }.bind(this));
  return this;
};

TotalFunction.prototype.isId = function () {
  return this.dom().equals(this.codom()) && this.isIso();
};

// TODO: Rename to isInjective? For now TotalFunction implements
//       two interfaces: function and morphism.
TotalFunction.prototype.isMono = function () {
  var image = new Set();
  for (var prop in this._mapping) {
    if (has(this._mapping, prop)) {
      if (image.contains(this._mapping[prop])) return false;
      image.add(this._mapping[prop]);
    }
  }
  return true;
};

TotalFunction.prototype.isEpi = function () {
  return this.codom().equals(this.image());
};

TotalFunction.prototype.isIso = function () {
  return this.isMono() && this.isEpi();
};

TotalFunction.prototype.isTotal = function () {
  return this.dom().equals(this.preimage());
};

TotalFunction.prototype.toString = function () {
  var arr = [];
  for (var prop in this._mapping) {
    if (has(this._mapping, prop)) {
      arr.push('(' + quoteSetElement(prop) + ',' + quoteSetElement(this._mapping[prop]) + ')');
    }
  }
  return this.dom() + ' -> ' + this.codom() + ' = {' + arr.join() + '}';
};

/////////////////////////////////////////////////////////////////////////////
// SetTerminalObject

function SetTerminalObject(cat) {
  var diagram = new Diagram(null, cat);
  var apex = new Set([1]);
  var component = [];
  SetTerminalObject.base.constructor.call(this, diagram, apex, component);
}

extend(SetTerminalObject, LimitingCone);

SetTerminalObject.prototype.univ = function (A) {
  var apex = A;
  var component = [];
  var cone = new LimitingCone(this.diagram(), apex, component);

  var mapping = {};
  A.forEach(function (el) { mapping[el] = 1; });
  var u = new TotalFunction(apex, this.apex(), mapping);

  return new ConeMorphism(cone, this, u);
}

/////////////////////////////////////////////////////////////////////////////
// SetInitialObject

function SetInitialObject(cat) {
  var diagram = new Diagram(null, cat);
  var apex = new Set();
  var component = [];
  SetInitialObject.base.constructor.call(this, diagram, apex, component);
}

extend(SetInitialObject, ColimitingCocone);

SetInitialObject.prototype.univ = function (A) {
  var apex = A;
  var component = [];
  var cone = new ColimitingCocone(this.diagram(), apex, component);

  var u = new TotalFunction(this.apex(), apex, {});

  return new CoconeMorphism(this, cone, u);
}

/////////////////////////////////////////////////////////////////////////////
// SetProduct

function SetProduct(cat, A, B) {
  var diagram = new Diagram(null, cat, [['A',A],['B',B]]);

  var apex = new Set();
  var mapping1 = {};
  var mapping2 = {};
  A.forEach(function (x) {
    B.forEach(function (y) {
      var z = [x, y].toString();
      apex.add(z);
      mapping1[z] = x;
      mapping2[z] = y;
    });
  });
  var pA = new TotalFunction(apex, A, mapping1);
  var pB = new TotalFunction(apex, B, mapping2);
  var component = [['A',pA],['B',pB]];

  SetProduct.base.constructor.call(this, diagram, apex, component);
}

extend(SetProduct, LimitingCone);

SetProduct.prototype.univ = function (m, n) {
  var apex = m.dom();
  var component = [['A',m],['B',n]];
  var cone = new LimitingCone(this.diagram(), apex, component);

  var f = this.component('A');
  var g = this.component('B');
  var mapping = {};
  apex.forEach(function (x) {
    var s1 = f.preimage(m.image(x));
    var s2 = g.preimage(n.image(x));
    mapping[x] = s1.intersection(s2).representative();
  });
  var u = new TotalFunction(apex, this.apex(), mapping);

  return new ConeMorphism(cone, this, u);
};

/////////////////////////////////////////////////////////////////////////////
// SetCoproduct

function SetCoproduct(cat, A, B) {
  var diagram = new Diagram(null, cat, [['A',A],['B',B]]);

  var apex = new Set();
  var elementCount = 1;
  function createInjection(set, obj) {
    var mapping = {};
    set.forEach(function (x) {
      apex.add(elementCount);
      mapping[x] = elementCount;
      elementCount++;
    });
    return mapping;
  }
  var iA = new TotalFunction(A, apex, createInjection(A, apex));
  var iB = new TotalFunction(B, apex, createInjection(B, apex));
  var component = [['A',iA],['B',iB]];

  SetCoproduct.base.constructor.call(this, diagram, apex, component);
}

extend(SetCoproduct, ColimitingCocone);

SetCoproduct.prototype.univ = function (m, n) {
  var apex = m.codom();
  var component = [['A',m],['B',n]];
  var cone = new ColimitingCocone(this.diagram(), apex, component);

  var f = this.component('A');
  var g = this.component('B');
  var mapping = {};
  function addMappings(f2, h) {
    h.dom().forEach(function (x) {
      mapping[f2.image(x)] = h.image(x);
    });
  }
  addMappings(f, m);
  addMappings(g, n);
  var u = new TotalFunction(this.apex(), apex, mapping);
  assertCommutes(u.compose(f), m);
  assertCommutes(u.compose(g), n);

  return new CoconeMorphism(this, cone, u);
};

/////////////////////////////////////////////////////////////////////////////
// SetCoproductComplement

function SetCoproductComplement(cat, f) {
  assertHasMorphism(cat, f);

  var apex = f.codom();
  var A = f.dom();
  var B = apex.diff(f.image());
  var g = new TotalFunction(B, apex).initId();

  var diagram = new Diagram(null, cat, [['A',A],['B',B]]);

  var component = [['A',f],['B',g]];

  // It's not an error, we call the base constructor of the base here
  SetCoproduct.base.constructor.call(this, diagram, apex, component);

  this.complement = function () { return B; }
}

extend(SetCoproductComplement, SetCoproduct);

/////////////////////////////////////////////////////////////////////////////
// SetEqualizer

function SetEqualizer(cat, f, g) {
  var A = f.dom();
  var B = f.codom();
  var diagram = new Diagram(null, cat, [['A',A],['B',B]],
    [['f','A','B',f],
     ['g','A','B',g]]);

  var apex = new Set();
  var codom = f.dom();
  var q = new TotalFunction(apex, codom);
  f.dom().forEach(function (x) {
    if (f.image(x) == g.image(x)) {
      apex.add(x);
      q.push(x, x);
    }
  });
  var component = [['A',q],['B',f.compose(q)]];

  SetEqualizer.base.constructor.call(this, diagram, apex, component);
}

extend(SetEqualizer, LimitingCone);

SetEqualizer.prototype.univ = function (m) {
  var apex = m.dom();
  // TODO: I guess missing components must be calculated automatically?
  var edge = this.diagram().dom().anyMorphism('A', 'B');
  var f = this.diagram().mapMorphism(edge);
  var component = [['A',m],['B',f.compose(m)]];
  var cone = new LimitingCone(this.diagram(), apex, component);

  var q = this.component('A');
  var mapping = {};
  m.forEach(function (x, y) {
    mapping[x] = q.preimage(y).representative();
  });
  var u = new TotalFunction(apex, this.apex(), mapping);

  return new ConeMorphism(cone, this, u);
};

/////////////////////////////////////////////////////////////////////////////
// SetCoequalizer

function SetCoequalizer(cat, f, g) {
  var A = f.dom();
  var B = f.codom();
  var diagram = new Diagram(null, cat, [['A',A],['B',B]],
    [['f','A','B',f],
     ['g','A','B',g]]);

  var apex = new Set();
  var dom = f.codom();
  var eq = {};
  f.dom().forEach(function (x) {
    var fx = f.image(x);
    var gx = g.image(x);
    eq[fx] = eq[gx] = has(eq, fx) ? eq[fx] : has(eq, gx) ? eq[gx] : fx;
  });
  var q = new TotalFunction(dom, apex);
  dom.forEach(function (s) {
    var t = eq[s] || s;
    apex.add(t);
    q.push(s, t);
  });
  var component = [['A',q.compose(f)],['B',q]];

  SetCoequalizer.base.constructor.call(this, diagram, apex, component);
}

extend(SetCoequalizer, ColimitingCocone);

SetCoequalizer.prototype.univ = function (m) {
  var apex = m.codom();
  // TODO: I guess missing components must be calculated automatically?
  var edge = this.diagram().dom().anyMorphism('A', 'B');
  var f = this.diagram().mapMorphism(edge);
  var component = [['A',m.compose(f)],['B',m]];
  var cone = new ColimitingCocone(this.diagram(), apex, component);

  var q = this.component('B');
  var mapping = {};
  m.dom().forEach(function (x) {
    mapping[q.image(x)] = m.image(x);
  });
  var u = new TotalFunction(this.apex(), apex, mapping);

  return new CoconeMorphism(this, cone, u);
};
