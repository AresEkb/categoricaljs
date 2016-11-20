'use strict';

/////////////////////////////////////////////////////////////////////////////
// Functor

function Functor(C, D, mapObject, mapMorphism) {
  assert(!isUndefined(mapObject), 'The mapObject argument is required for Functor');
  assert(!isUndefined(mapMorphism), 'The mapMorphism argument is required for Functor');
  assert(typeof mapMorphism == 'function', 'The mapMorphism argument must be a Function');
  assert(typeof mapObject == 'function', 'The mapObject argument must be a Function');
  assert(typeof mapMorphism == 'function', 'The mapMorphism argument must be a Function');
  Functor.base.constructor.call(this, C, D);

  this.mapObject = function (A) {
    assertHasObject(this.dom(), A);
    var dst = mapObject(A);
    assertHasObject(this.codom(), dst);
    return dst;
  };
  this.mapMorphism = function (f) {
    assertHasMorphism(this.dom(), f);
    var dst = mapMorphism(f);
    assertHasMorphism(this.codom(), dst);
    return dst;
  };
}

extend(Functor, Morphism);

Functor.prototype.compose = function (F) {
  var G = this;
  assertEqualObjects(F.codom(), G.dom());
  var mapObject = function (A) {
    return G.mapObject(F.mapObject(A));
  };
  var mapMorphism = function (f) {
    return G.mapMorphism(F.mapMorphism(f));
  };
  return new Functor(F.dom(), G.codom(), mapObject, mapMorphism);
};

/////////////////////////////////////////////////////////////////////////////
// IdFunctor

function IdFunctor(C) {
  var mapObject = function (A) {
    return A;
  };
  var mapMorphism = function (f) {
    return f;
  };
  IdFunctor.base.constructor.call(this, C, C, mapObject, mapMorphism);
}

extend(IdFunctor, Functor);

/////////////////////////////////////////////////////////////////////////////
// ConstantFunctor

function ConstantFunctor(C, D, N) {
  assertHasObject(D, N);
  var id = D.id(N);
  var mapObject = function (A) {
    return N;
  }
  var mapMorphism = function (f) {
    return id;
  }
  ConstantFunctor.base.constructor.call(this, C, D, mapObject, mapMorphism);
}

extend(ConstantFunctor, Functor);

/////////////////////////////////////////////////////////////////////////////
// DiagonalFunctor

function DiagonalFunctor(J, C) {
  var CJ = new FunctorCategory(J, C);
  var mapObject = function (A) {
    return new ConstantFunctor(J, C, A);
  };
  var mapMorphism = function (f) {
    throwNotImplemented();
  };
  DiagonalFunctor.base.constructor.call(this, C, CJ, mapObject, mapMorphism);
}

extend(DiagonalFunctor, Functor);

/////////////////////////////////////////////////////////////////////////////
// CrossProductFunctor

function CrossProductFunctor(C) {
  var mapObject = function (A) {
    return C.product(A, A).apex();
  };
  var mapMorphism = function (f) {
    var pa = C.product(f.dom(), f.dom());
    var pb = C.product(f.codom(), f.codom());
    return pb.univ(f.compose(pa.component('A')), f.compose(pa.component('B'))).morphism();
  };
  CrossProductFunctor.base.constructor.call(this, C, C, mapObject, mapMorphism);
}

extend(CrossProductFunctor, Functor);

/////////////////////////////////////////////////////////////////////////////
// FreeCategoryFunctor

function FreeCategoryFunctor() {
  throwNotImplemented();
}

extend(FreeCategoryFunctor, Functor);

/////////////////////////////////////////////////////////////////////////////
// IndexCategory

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

IndexCategory.prototype.equals = function (C) {
  return this.objects().equals(C.objects()) &&
         this.morphisms().equals(C.morphisms()) &&
         this._source.equals(C._source) &&
         this._target.equals(C._target);
}

IndexCategory.prototype.anyMorphism = function (A, B) {
  assertHasObject(this, A);
  assertHasObject(this, B);
  var edges = this._edges.elements().filter(function (edge) {
    return this._source.image(edge) === A && this._target.image(edge) === B;
  }, this);
  assert(edges.length > 0);
  return edges[0];
}

/////////////////////////////////////////////////////////////////////////////
// Diagram

// mapObject:   [[src1,tgt1],[src2,tgt2],...]
// mapMorphism: [[src1,dom1,codom1,tgt1],[src2,dom2,codom2,tgt2],...]
function Diagram(J, C, mapObject, mapMorphism) {
  assert(C instanceof Category, 'The second argument must be a category: ' + C);
  if (isUndefined(mapObject)) { mapObject = []; }
  if (isUndefined(mapMorphism)) { mapMorphism = []; }
  assert(mapObject instanceof Array);
  assert(mapMorphism instanceof Array);

  var mapObject2 = new Map(mapObject);
  var mapMorphism2 = new Map();
  mapMorphism.forEach(function (map) {
    mapMorphism2.set(map[0], map[3]);
  });

  if (J == null) {
    var nodes = !isUndefined(mapObject2) ? Array.from(mapObject2.keys()) : [];
    var edges = mapMorphism;
    J = new IndexCategory(nodes, edges);
  }
  else {
    assert(J instanceof IndexCategory, 'The first argument must be either an index category or null: ' + J);
    // Check that functor is defined for all objects
    J.objects().forEach(function (A) {
      assert(mapObject2.has(A), 'Functor is not defined for object ' + A);
    });
    // Check that functor is defined for all morphisms
    J.morphisms().forEach(function (f) {
      assert(mapMorphism2.has(f), 'Functor is not defined for morphism ' + f);
    });
  }

  // Check that each target object of the functor belongs to the target category
  mapObject2.forEach(function (dst, src) {
    assertHasObject(C, dst);
  });
  // Check that each target morphism of the functor belongs to the target category
  mapMorphism2.forEach(function (dst, src) {
    assertHasMorphism(C, dst);
  });
  // Check that functor preserves domains and codomains of morphisms
  J.morphisms().forEach(function (f) {
    var FA = mapObject2.get(J.dom(f));
    var FB = mapObject2.get(J.codom(f));
    assertEqualObjects(mapMorphism2.get(f).dom(), FA, 'Functor doesn\'t preserve a domain of the morphism ' + f);
    assertEqualObjects(mapMorphism2.get(f).codom(), FB, 'Functor doesn\'t preserve a codomain of the morphism ' + f);
  });

  Diagram.base.constructor.call(this, J, C, mapObject2.get.bind(mapObject2), mapMorphism2.get.bind(mapMorphism2));

  // TODO: Immutable diagram may be better:
  // https://www.sitepoint.com/immutability-javascript/
  //this.clone = function () { return new Diagram(arguments); };
  this.clone = function () { return this; };
}

extend(Diagram, Functor);

Diagram.prototype.equals = function (D) {
  return this.dom().equals(D.dom()) &&
         this.dom().objects().every(function (A) {
           return this.mapObject(A).equals(D.mapObject(A)) }, this) &&
         this.dom().morphisms().every(function (f) {
           return this.mapMorphism(f).equals(D.mapMorphism(f)) }, this);
}

/////////////////////////////////////////////////////////////////////////////
// NaturalTransformation

function NaturalTransformation(F, G, component) {
  NaturalTransformation.base.constructor.call(this, F, G);

  function checkComponent(cat, A, h) {
    assertHasMorphism(cat, h);
    var FA = F.mapObject(A);
    var GA = G.mapObject(A);
    assertEqualObjects(FA, h.dom(), 'The domain of the natural transformation component at object ' + A + ' must be F(' + A + ')');
    assertEqualObjects(GA, h.codom(), 'The codomain of the natural transformation component at object ' + A + ' must be G(' + A + ')');
  }

  if (component instanceof Array) {
    component = new Map(component);
  }

  if (typeof component == 'function') {
    this.component = function (A) {
      assertHasObject(this.dom0(), A);
      var h = component(A);
      checkComponent(this.codom0(), A, h);
      return h;
    };
  }
  else if (component instanceof Map) {
    assert(this.dom0() instanceof IndexCategory, 'The components may be specified as Map only if the domain of the functors is IndexCategory')
    var indexCategory = this.dom0();
    var targetCategory = this.codom0();
    // Check that components are defined for all objects of the source category
    // and check domain and codomain of components
    indexCategory.objects().forEach(function (A) {
      assert(component.has(A), 'The natural transformation doesn\'t has a component for object ' + A + ' of the source category');
      var h = component.get(A);
      checkComponent(targetCategory, A, h);
    });
    // Check that components are defined for objects of the source category
    // and check that components are morphisms of the target category
    component.forEach(function (dst, src) {
      assertHasObject(indexCategory, src);
      assertHasMorphism(targetCategory, dst);
    });
    // Check that all square diagrams of the natural transformation are commutative
    indexCategory.morphisms().forEach(function (f) {
      var Ff = F.mapMorphism(f);
      var Gf = G.mapMorphism(f);
      var hA = component.get(indexCategory.dom(f));
      var hB = component.get(indexCategory.codom(f));
      assertCommutes(hB.compose(Ff), Gf.compose(hA));
    });
    this.component = function (A) {
      assertHasObject(this.dom0(), A);
      return component.get(A);
    };
  }
  else {
    throw 'The component argument must be Function, Map or Array or the form [[A,hA],[B,hB],...]';
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

/////////////////////////////////////////////////////////////////////////////
// FunctorCategory

function FunctorCategory(C, D) {

}

extend(FunctorCategory, Category);
