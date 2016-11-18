'use strict';

/////////////////////////////////////////////////////////////////////////////
// Morphism

function Morphism(A, B) {
  this.dom = function () { return A; };
  this.codom = function () { return B; };
}

/////////////////////////////////////////////////////////////////////////////
// 2-morphism

function Morphism2(f, g) {
  assert(f instanceof Morphism);
  assert(g instanceof Morphism);
  assertParallel(f, g);
  Morphism2.base.constructor.call(this, f, g);
  this.dom0 = function () { return f.dom(); };
  this.codom0 = function () { return f.codom(); };
}

extend(Morphism2, Morphism);

/////////////////////////////////////////////////////////////////////////////
// Functor

// TODO: Add functor composition.
// In general one should use Category::compose() instead of Morphism::compose()

function Functor(C, D, mapObject, mapMorphism) {
  Functor.base.constructor.call(this, C, D);
  if (typeof mapObject == 'function') {
    this.mapObject = function (A) {
      assertHasObject(this.dom(), A);
      var dst = mapObject(A);
      assertHasObject(this.codom(), dst);
      return dst;
    };
  }
  else if (mapObject instanceof Map) {
    mapObject.forEach(function (dst, src) {
      assertHasObject(this.dom(), src);
      assertHasObject(this.codom(), dst);
    }.bind(this));
    this.mapObject = function (A) {
      assertHasObject(this.dom(), A);
      return mapObject.get(A);
    };
  }
  else {
    throw 'The mapObject argument must be either Function or Map';
  }
  if (typeof mapMorphism == 'function') {
    this.mapMorphism = function (f) {
      assertHasMorphism(this.dom(), f);
      var dst = mapMorphism(f);
      assertHasMorphism(this.codom(), dst);
      return dst;
    };
  }
  else if (mapMorphism instanceof Map) {
    mapMorphism.forEach(function (dst, src) {
      assertHasMorphism(this.dom(), src);
      assertHasMorphism(this.codom(), dst);
    }.bind(this));
    this.mapMorphism = function (f) {
      assertHasMorphism(this.dom(), f);
      return mapMorphism.get(f);
    };
  }
  else {
    throw 'The mapMorphism argument must be either Function or Map';
  }
}

extend(Functor, Morphism);

Functor.prototype.compose = function (F) {
  var G = this;
  assertEqualObjects(F.codom(), G.dom());
  var func = new Functor(F.dom(), G.codom());
  func.mapObject = function (A) {
    return G.mapObject(F.mapObject(A));
  };
  func.mapMorphism = function (f) {
    return G.mapMorphism(F.mapMorphism(f));
  };
  return func;
};

function Cat() {
}

extend(Cat, Category);

Cat.prototype.id = function (A) {
  return new IdFunctor(A);
};

Cat.prototype.compose = function (g, f) {
  return g.compose(f);
};

/////////////////////////////////////////////////////////////////////////////
// IdFunctor

function IdFunctor(C) {
  IdFunctor.base.constructor.call(this, C, C);
}

extend(IdFunctor, Functor);

IdFunctor.prototype.mapObject = function (A) {
  return A;
};

IdFunctor.prototype.mapMorphism = function (f) {
  return f;
};

/////////////////////////////////////////////////////////////////////////////
// ConstantFunctor

function ConstantFunctor(C, D, N) {
  assertHasObject(D, N);
  var id = D.id(N);
  var mapObject = function (A) {
    assertHasObject(C, A);
    return N;
  }
  var mapMorphism = function (f) {
    assertHasMorphism(C, f);
    return id;
  }
  ConstantFunctor.base.constructor.call(this, C, D, mapObject, mapMorphism);
}

extend(ConstantFunctor, Functor);

/////////////////////////////////////////////////////////////////////////////
// FunctorCategory

function FunctorCategory(C, D) {

}

extend(FunctorCategory, Category);

/////////////////////////////////////////////////////////////////////////////
// DiagonalFunctor

function DiagonalFunctor(J, C) {
  var CJ = new FunctorCategory(J, C);
  this._J = J;
  DiagonalFunctor.base.constructor.call(this, C, CJ);
}

extend(DiagonalFunctor, Functor);

DiagonalFunctor.prototype.mapObject = function (A) {
  return new ConstantFunctor(this._J, C, A);
};

DiagonalFunctor.prototype.mapMorphism = function (f) {
  throwNotImplemented();
};

/////////////////////////////////////////////////////////////////////////////
// CrossProductFunctor

function CrossProductFunctor(C) {
  CrossProductFunctor.base.constructor.call(this, C, C);
}

extend(CrossProductFunctor, Functor);

CrossProductFunctor.prototype.mapObject = function (A) {
  return this.dom().product(A, A).obj;
};

CrossProductFunctor.prototype.mapMorphism = function (f) {
  var pa = this.dom().product(f.dom(), f.dom());
  var pb = this.dom().product(f.codom(), f.codom());
  return pb.univ(f.compose(pa.f), f.compose(pa.g));
};

/////////////////////////////////////////////////////////////////////////////
// Diagram

function FreeCategoryFunctor() {
}

// IndexCategory = FreeCategory(Graph) ?

function IndexCategory(nodes, edges) {
  this._nodes = new Set(nodes);
  this._edges = new Set();
  this._source = new TotalFunction(this._edges, this._nodes);
  this._target = new TotalFunction(this._edges, this._nodes);

  edges.forEach(function (edge) {
    this._edges.add(edge[0]);
    this._source.push(edge[0], edge[1]);
    this._target.push(edge[0], edge[2]);
  }, this);

  this.objects = function () { return this._nodes; }
  this.morphisms = function () { return this._edges; }
  this.dom = function (f) { return this._source.image(f); }
  this.codom = function (f) { return this._target.image(f); }
}

extend(IndexCategory, Category);

IndexCategory.prototype.hasObject = function (A) {
  return this._nodes.contains(A);
}

IndexCategory.prototype.hasMorphism = function (f) {
  return this._edges.contains(f) &&
         this.hasObject(this._source.image(f)) &&
         this.hasObject(this._target.image(f));
}

function Diagram(C, mapObject, mapMorphism) {
  if (isUndefined(mapObject)) {
    mapObject = [];
  }
  if (isUndefined(mapMorphism)) {
    mapMorphism = [];
  }
  var mapObject2 = new Map(mapObject);
  var mapMorphism2 = new Map();
  mapMorphism.forEach(function (map) {
    mapMorphism2.set(map[0], map[3]);
  });
  var nodes = !isUndefined(mapObject2) ? Array.from(mapObject2.keys()) : [];
  var edges = !isUndefined(mapMorphism) ? mapMorphism : [];
  var indexCategory = new IndexCategory(nodes, edges);

  Diagram.base.constructor.call(this, indexCategory, C, mapObject2, mapMorphism2);

  // TODO: Immutable diagram may be better:
  // https://www.sitepoint.com/immutability-javascript/
  this.clone = function () { return new Diagram(arguments) };
}

extend(Diagram, Functor);

/////////////////////////////////////////////////////////////////////////////
// NaturalTransformation

function NaturalTransformation(F, G, component) {
  NaturalTransformation.base.constructor.call(this, F, G);
  if (typeof component == 'function') {
    this.component = function (A) {
      assertHasObject(this.dom0(), A);
      var dst = component(A);
      assertHasMorphism(this.codom0(), dst);
      return dst;
    };
  }
  else if (component instanceof Map) {
    component.forEach(function (dst, src) {
      assertHasObject(this.dom0(), src);
      assertHasMorphism(this.codom0(), dst);
    }.bind(this));
    this.component = function (A) {
      assertHasObject(this.dom0(), A);
      return component.get(A);
      // TODO: Check result
    };
  }
  else {
    throw 'The component argument must be either Function or Map';
  }
}

extend(NaturalTransformation, Morphism2);

NaturalTransformation.prototype.compose = function (f) {
  var g = this;
  assertComposable(f, g);
  var component = function (A) {
    return g.component(f.component(A));
  };
  return new NaturalTransformation(f.dom(), g.codom(), component);
}
