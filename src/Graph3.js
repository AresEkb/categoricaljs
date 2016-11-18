'use strict';

/*
NaturalTransformation.prototype.calculate = function (A) {
  this.eta = this.F.codom().morphism(F.objectImage(A), G.objectImage(A));
  this.univ = function (f) {
    assert(f.dom().equals(A));
    var eta = this.F.codom().morphism(F.objectImage(f.codom()), G.objectImage(f.codom()));
    assert(this.F.morphismImage(f).compose(eta).commutes(this.eta.compose(this.G.morphismImage(f))));
    return eta;
  };
};
*/
/*
function Category() {
}
*/

function InitialCategory() {
}

function TerminalCategory() {
}

// 0 -> 1
function IntervalCategory() {
  IntervalCategory.base.constructor.call(this);
}

extend(IntervalCategory, Category);

IntervalCategory.prototype.object = function (x) {
  assert(x === 0 || x === 1);
  return x;
};

IntervalCategory.prototype.initial = function () {
  return 1;
};

IntervalCategory.prototype.terminal = function () {
  return 0;
};

IntervalCategory.prototype.morphism = function (A, B) {
  assert(A === 1 && B === 0);
  return 0;
};

// Diagram (Functor)
function Span() {
  this.A = cat.object();
  this.B = cat.object();
  this.AB = cat.object();
  this.f = cat.morphism(this.AB, this.A);
  this.g = cat.morphism(this.AB, this.B);
}

// Category
// 0 ->> 1
function FreeQuiver() {

}

extend(FreeQuiver, Category);

FreeQuiver.prototype.object = function (name) {
  if (name === 0 || name === 1) {
    return name;
  }
  throw 'Free Quiver Category doesn\'t contain object ' + name;
}

FreeQuiver.prototype.hasObject = function (name) {
console.log(name);
  return name === 0 || name === 1;
}

FreeQuiver.prototype.morphism = function (name) {
  if (name === 's' || name === 't') {
    return { dom : function () { return 0; }, codom : function () { return 1; } }
  }
  throw 'Free Quiver Category doesn\'t contain morphism ' + name;
}

FreeQuiver.prototype.id = function (name) {
  if (name === '0' || name === '1') {
    return { dom : function () { return name; }, codom : function () { return name; } }
  }
  throw 'Free Quiver Category doesn\'t contain object ' + name;
}

FreeQuiver.prototype.compose = function (g, f) {
  throwNotImplemented();
}

// Functor
//   maps E to some object of cat
//   maps V to some object of cat
//   maps s to some morphism of cat
//   maps t to some morphism of cat
function Quiver() {
  // TODO: Don't create new objects each time. Define categories as global objects instead
  // Or use function objects
  // Or use singleton pattern which caches constructions
  Quiver.base.constructor.call(this, new FreeQuiver(), new SetCategory());

  this._objectMap = {};
  this._morphismMap = {};

/*
  this.E = cat.object();
  this.V = cat.object();
  this.s = cat.morphism(this.E, this.V);
  this.t = cat.morphism(this.E, this.V);
*/
}

extend(Quiver, Functor);

Quiver.prototype.mapObject = function (A, target) {
  if (!isUndefined(target)) {
    assert(this.codom().hasObject(target));
    this._objectMap[A] = target;
    return target;
  }
  return this._objectMap[A];
};

Quiver.prototype.mapMorphism = function (f, target) {
  if (!isUndefined(target)) {
    assert(this.codom().hasMorphism(target));
    this._morphismMap[f] = target;
    return target;
  }
  return this._morphismMap[f];
};


function FunctorCategory(C, D) {

}

FunctorCategory.prototype.object = function (x) {
};

FunctorCategory.prototype.morphism = function (A, B) {
};


// Functor category of Quiver(cat)
function Quiv(cat) {
  var freeQuiver = new FreeQuiver();
  Quiv.base.constructor.call(this, freeQuiver, cat);

  this._source = function () { return freeQuiver; }
  this._target = function () { return cat; }
}

extend(Quiv, FunctorCategory);

Quiv.prototype.object = function () {
  return new Quiver(this._target);
};

Quiv.prototype.morphism = function (A, B) {
  return new NaturalTransformation(A, B);
};

var intervalCat = new IntervalCategory();

var setCat = new SetCategory();
var graphCat = new Quiv(setCat);

var graphA = graphCat.object();
graphA.mapObject(0, setCat.object([1]));
graphA.mapObject(1, setCat.object([1,2]));
graphA.mapMorphism('s', setCat.morphism(graphA.mapObject(0), graphA.mapObject(1), {1: 1}));
graphA.mapMorphism('t', setCat.morphism(graphA.mapObject(0), graphA.mapObject(1), {1: 2}));

console.log(graphA);

var graphB = graphCat.object();
graphB.mapObject(0, setCat.object([1,2,3,4,5]));
graphB.mapObject(1, setCat.object([1,2,3,4]));
graphB.mapMorphism('s', setCat.morphism(graphB.mapObject(0), graphB.mapObject(1), {1: 1, 2: 2, 3: 3, 4: 1, 5: 3}));
graphB.mapMorphism('t', setCat.morphism(graphB.mapObject(0), graphB.mapObject(1), {1: 2, 2: 4, 3: 4, 4: 3, 5: 1}));

var fEdgeMap = setCat.morphism(graphA.mapObject(0), graphB.mapObject(0), {1: 1});
var fNodeMap = setCat.morphism(graphA.mapObject(1), graphB.mapObject(1), {1: 1, 2: 2});
var f = graphCat.morphism(graphA, graphB);
f.mapObject(0, fEdgeMap);
f.mapObject(1, fNodeMap);

console.log(f);
