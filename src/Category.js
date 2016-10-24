'use strict';

// TODO: Add N-ary limits. For now only binary limits are supported

// TODO: Add illustrative diagrams describing all objects and morphisms.
//       Especially for complements.

// TODO: Replace all properties by property getters?

// TODO: Add prefix I to mixins to distinguish them from classes?

/////////////////////////////////////////////////////////////////////////////
// Category Class

function Category() {
}

Category.prototype.object = function (args) {
  throwNotImplemented();
};

Category.prototype.morphism = function (A, B, args) {
  throwNotImplemented();
};

Category.prototype.id = function (A) {
  throwNotImplemented();
};

Category.prototype.compose = function (g, f) {
  throwNotImplemented();
};

Category.prototype.equals = function (cat) {
  return this.constructor === cat.constructor;
};

/////////////////////////////////////////////////////////////////////////////
// Complete Category Mixin

function CompleteCategory() {
}

CompleteCategory.prototype.initial = function () {
  throwNotImplemented();
};

CompleteCategory.prototype.product = function (A, B) {
  throwNotImplemented();
};

CompleteCategory.prototype.equalizer = function (f, g) {
  throwNotImplemented();
};

CompleteCategory.prototype.pullback = function (f, g) {
  return new Pullback(this).calculate(f, g);
};

/////////////////////////////////////////////////////////////////////////////
// Cocomplete Category Mixin

function CocompleteCategory() {
}

CocompleteCategory.prototype.terminal = function () {
  throwNotImplemented();
};

CocompleteCategory.prototype.coproduct = function (A, B) {
  throwNotImplemented();
};

CocompleteCategory.prototype.coequalizer = function (f, g) {
  throwNotImplemented();
};

CocompleteCategory.prototype.pushout = function (f, g) {
  return new Pushout(this).calculate(f, g);
};

// TODO: Move to the separate Regular Category Mixin?
CocompleteCategory.prototype.pushoutComplement = function (f, p) {
  return new Pushout(this).complement(f, p);
};

/////////////////////////////////////////////////////////////////////////////
// Bicomplete Category Mixin

function BicompleteCategory() {
}

combine(BicompleteCategory, CompleteCategory, CocompleteCategory);

/////////////////////////////////////////////////////////////////////////////
// Pullback Class

function Pullback(cat) {
  this.cat = function () { return cat; };
}

Pullback.prototype.calculate = function (f, g) {
  assertEqualCodom(f, g);
  this.f = f;
  this.g = g;

  var prod = this.cat().product(f.dom(), g.dom());
  this.product = function () { return prod; };

  var eq = this.cat().equalizer(f.compose(prod.f), g.compose(prod.g));
  this.equalizer = function () { return eq; };

  this.p = prod.f.compose(eq.q);
  this.q = prod.g.compose(eq.q);
  this.obj = eq.obj;
  assertCommutes(this.f.compose(this.p), this.g.compose(this.q));
  return this;
}

Pullback.prototype.univ = function (m, n) {
  assertEqualDom(m, n);
  assertEqualCodom(m, this.p);
  assertEqualCodom(n, this.q);
  var u = this.equalizer().univ(this.product().univ(m, n));
  assertCommutes(this.p.compose(u), m);
  assertCommutes(this.q.compose(u), n);
  return u;
};

Pullback.prototype.toString = function () {
  return '<Obj: ' + this.obj + ', p: ' + this.p + ', q: ' + this.q + '>';
};

/////////////////////////////////////////////////////////////////////////////
// Pushout Class

function Pushout(cat, f, g) {
  this.cat = function () { return cat; };
}

Pushout.prototype.calculate = function (f, g) {
  assertEqualDom(f, g);
  this.f = f;
  this.g = g;

  var cp = this.cat().coproduct(f.codom(), g.codom());
  this.coproduct = function () { return cp; };

  var ceq = this.cat().coequalizer(cp.f.compose(f), cp.g.compose(g));
  this.coequalizer = function () { return ceq; };

  this.p = ceq.q.compose(cp.f);
  this.q = ceq.q.compose(cp.g);
  this.obj = ceq.obj;
  assertCommutes(this.p.compose(this.f), this.q.compose(this.g));
  return this;
}

Pushout.prototype.complement = function (f, p) {
  this.f = f;
  this.p = p;

  if (p.isMono()) {
    var cpc = this.cat().coproductComplement(p).g;
    var cp = this.cat().coproduct(f.dom(), cpc.dom());
    this.g = cp.f;
    this.q = cp.univ(p.compose(f), cpc);
  }
  else if (f.isMono() && p.isEpi()) {
    // TODO: Add a check
    var m1 = this.cat().coproductComplement(f).g;
    var m2 = p.compose(m1);
    this.q = this.cat().coproductComplement(m2).g;
    //this.g = f.compose(p).compose(this.q.inv()); // Was before refactoring, recheck
    this.g = this.q.inv().compose(p).compose(f);
  }
  else if (f.isEpi() && p.isEpi()) {
    var obj = p.codom();
    this.g = p.compose(f);
    this.q = this.cat().morphism(obj, obj).initId();
  }
  else {
    f = f.decomposeToEM();
    p = p.decomposeToEM();
    var pc1 = this.cat().pushoutComplement(f.m, p.e);
    var pc2 = this.cat().pushoutComplement(pc1.q, p.m);
    var pc3 = this.cat().pushoutComplement(f.e, pc1.g);
    var pc4 = this.cat().pushoutComplement(pc3.q, pc2.g);
    this.g = pc4.g.compose(pc3.g);
    this.q = pc2.q.compose(pc4.q);
  }
  this.obj = this.g.codom();
  assertCommutes(this.p.compose(this.f), this.q.compose(this.g));
  return this;
}

Pushout.prototype.univ = function (m, n) {
  assertEqualCodom(m, n);
  assertEqualDom(m, this.p);
  assertEqualDom(n, this.q);
  var u = this.coequalizer().univ(this.coproduct().univ(m, n));
  assertCommutes(u.compose(this.p), m);
  assertCommutes(u.compose(this.q), n);
  return u;
};

Pushout.prototype.toString = function () {
  return '<Obj: ' + this.obj + ', p: ' + this.p + ', q: ' + this.q + '>';
};
