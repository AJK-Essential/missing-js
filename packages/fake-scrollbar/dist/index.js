import { css as et, LitElement as rt, html as nt } from "lit";
import { property as C, state as L, customElement as it } from "lit/decorators.js";
/**
 * Missing JS - @missing-js/fake-scrollbar
 * @license MIT
 * Copyright (c) 2026 Missing JS / AJK-Essential.
 * ---------------------------------------------------------
 * Licensed under the MIT License.
 * Free for personal and commercial use.
 */
/**
 * Missing JS - @missing-js/fake-scrollbar
 * @license MIT
 * Copyright (c) 2026 Missing JS / AJK-Essential.
 * ---------------------------------------------------------
 * Licensed under the MIT License.
 * Free for personal and commercial use.
 */
var M = function(t, r) {
  return M = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(e, n) {
    e.__proto__ = n;
  } || function(e, n) {
    for (var i in n) Object.prototype.hasOwnProperty.call(n, i) && (e[i] = n[i]);
  }, M(t, r);
};
function T(t, r) {
  if (typeof r != "function" && r !== null)
    throw new TypeError("Class extends value " + String(r) + " is not a constructor or null");
  M(t, r);
  function e() {
    this.constructor = t;
  }
  t.prototype = r === null ? Object.create(r) : (e.prototype = r.prototype, new e());
}
function ot(t, r, e, n) {
  function i(o) {
    return o instanceof e ? o : new e(function(s) {
      s(o);
    });
  }
  return new (e || (e = Promise))(function(o, s) {
    function a(l) {
      try {
        u(n.next(l));
      } catch (v) {
        s(v);
      }
    }
    function c(l) {
      try {
        u(n.throw(l));
      } catch (v) {
        s(v);
      }
    }
    function u(l) {
      l.done ? o(l.value) : i(l.value).then(a, c);
    }
    u((n = n.apply(t, r || [])).next());
  });
}
function Q(t, r) {
  var e = { label: 0, sent: function() {
    if (o[0] & 1) throw o[1];
    return o[1];
  }, trys: [], ops: [] }, n, i, o, s = Object.create((typeof Iterator == "function" ? Iterator : Object).prototype);
  return s.next = a(0), s.throw = a(1), s.return = a(2), typeof Symbol == "function" && (s[Symbol.iterator] = function() {
    return this;
  }), s;
  function a(u) {
    return function(l) {
      return c([u, l]);
    };
  }
  function c(u) {
    if (n) throw new TypeError("Generator is already executing.");
    for (; s && (s = 0, u[0] && (e = 0)), e; ) try {
      if (n = 1, i && (o = u[0] & 2 ? i.return : u[0] ? i.throw || ((o = i.return) && o.call(i), 0) : i.next) && !(o = o.call(i, u[1])).done) return o;
      switch (i = 0, o && (u = [u[0] & 2, o.value]), u[0]) {
        case 0:
        case 1:
          o = u;
          break;
        case 4:
          return e.label++, { value: u[1], done: !1 };
        case 5:
          e.label++, i = u[1], u = [0];
          continue;
        case 7:
          u = e.ops.pop(), e.trys.pop();
          continue;
        default:
          if (o = e.trys, !(o = o.length > 0 && o[o.length - 1]) && (u[0] === 6 || u[0] === 2)) {
            e = 0;
            continue;
          }
          if (u[0] === 3 && (!o || u[1] > o[0] && u[1] < o[3])) {
            e.label = u[1];
            break;
          }
          if (u[0] === 6 && e.label < o[1]) {
            e.label = o[1], o = u;
            break;
          }
          if (o && e.label < o[2]) {
            e.label = o[2], e.ops.push(u);
            break;
          }
          o[2] && e.ops.pop(), e.trys.pop();
          continue;
      }
      u = r.call(t, e);
    } catch (l) {
      u = [6, l], i = 0;
    } finally {
      n = o = 0;
    }
    if (u[0] & 5) throw u[1];
    return { value: u[0] ? u[1] : void 0, done: !0 };
  }
}
function k(t) {
  var r = typeof Symbol == "function" && Symbol.iterator, e = r && t[r], n = 0;
  if (e) return e.call(t);
  if (t && typeof t.length == "number") return {
    next: function() {
      return t && n >= t.length && (t = void 0), { value: t && t[n++], done: !t };
    }
  };
  throw new TypeError(r ? "Object is not iterable." : "Symbol.iterator is not defined.");
}
function S(t, r) {
  var e = typeof Symbol == "function" && t[Symbol.iterator];
  if (!e) return t;
  var n = e.call(t), i, o = [], s;
  try {
    for (; (r === void 0 || r-- > 0) && !(i = n.next()).done; ) o.push(i.value);
  } catch (a) {
    s = { error: a };
  } finally {
    try {
      i && !i.done && (e = n.return) && e.call(n);
    } finally {
      if (s) throw s.error;
    }
  }
  return o;
}
function x(t, r, e) {
  if (e || arguments.length === 2) for (var n = 0, i = r.length, o; n < i; n++)
    (o || !(n in r)) && (o || (o = Array.prototype.slice.call(r, 0, n)), o[n] = r[n]);
  return t.concat(o || Array.prototype.slice.call(r));
}
function w(t) {
  return this instanceof w ? (this.v = t, this) : new w(t);
}
function st(t, r, e) {
  if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
  var n = e.apply(t, r || []), i, o = [];
  return i = Object.create((typeof AsyncIterator == "function" ? AsyncIterator : Object).prototype), a("next"), a("throw"), a("return", s), i[Symbol.asyncIterator] = function() {
    return this;
  }, i;
  function s(h) {
    return function(d) {
      return Promise.resolve(d).then(h, v);
    };
  }
  function a(h, d) {
    n[h] && (i[h] = function(p) {
      return new Promise(function(O, E) {
        o.push([h, p, O, E]) > 1 || c(h, p);
      });
    }, d && (i[h] = d(i[h])));
  }
  function c(h, d) {
    try {
      u(n[h](d));
    } catch (p) {
      y(o[0][3], p);
    }
  }
  function u(h) {
    h.value instanceof w ? Promise.resolve(h.value.v).then(l, v) : y(o[0][2], h);
  }
  function l(h) {
    c("next", h);
  }
  function v(h) {
    c("throw", h);
  }
  function y(h, d) {
    h(d), o.shift(), o.length && c(o[0][0], o[0][1]);
  }
}
function ut(t) {
  if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
  var r = t[Symbol.asyncIterator], e;
  return r ? r.call(t) : (t = typeof k == "function" ? k(t) : t[Symbol.iterator](), e = {}, n("next"), n("throw"), n("return"), e[Symbol.asyncIterator] = function() {
    return this;
  }, e);
  function n(o) {
    e[o] = t[o] && function(s) {
      return new Promise(function(a, c) {
        s = t[o](s), i(a, c, s.done, s.value);
      });
    };
  }
  function i(o, s, a, c) {
    Promise.resolve(c).then(function(u) {
      o({ value: u, done: a });
    }, s);
  }
}
function f(t) {
  return typeof t == "function";
}
function ct(t) {
  var r = function(n) {
    Error.call(n), n.stack = new Error().stack;
  }, e = t(r);
  return e.prototype = Object.create(Error.prototype), e.prototype.constructor = e, e;
}
var H = ct(function(t) {
  return function(e) {
    t(this), this.message = e ? e.length + ` errors occurred during unsubscription:
` + e.map(function(n, i) {
      return i + 1 + ") " + n.toString();
    }).join(`
  `) : "", this.name = "UnsubscriptionError", this.errors = e;
  };
});
function z(t, r) {
  if (t) {
    var e = t.indexOf(r);
    0 <= e && t.splice(e, 1);
  }
}
var _ = function() {
  function t(r) {
    this.initialTeardown = r, this.closed = !1, this._parentage = null, this._finalizers = null;
  }
  return t.prototype.unsubscribe = function() {
    var r, e, n, i, o;
    if (!this.closed) {
      this.closed = !0;
      var s = this._parentage;
      if (s)
        if (this._parentage = null, Array.isArray(s))
          try {
            for (var a = k(s), c = a.next(); !c.done; c = a.next()) {
              var u = c.value;
              u.remove(this);
            }
          } catch (p) {
            r = { error: p };
          } finally {
            try {
              c && !c.done && (e = a.return) && e.call(a);
            } finally {
              if (r) throw r.error;
            }
          }
        else
          s.remove(this);
      var l = this.initialTeardown;
      if (f(l))
        try {
          l();
        } catch (p) {
          o = p instanceof H ? p.errors : [p];
        }
      var v = this._finalizers;
      if (v) {
        this._finalizers = null;
        try {
          for (var y = k(v), h = y.next(); !h.done; h = y.next()) {
            var d = h.value;
            try {
              F(d);
            } catch (p) {
              o = o ?? [], p instanceof H ? o = x(x([], S(o)), S(p.errors)) : o.push(p);
            }
          }
        } catch (p) {
          n = { error: p };
        } finally {
          try {
            h && !h.done && (i = y.return) && i.call(y);
          } finally {
            if (n) throw n.error;
          }
        }
      }
      if (o)
        throw new H(o);
    }
  }, t.prototype.add = function(r) {
    var e;
    if (r && r !== this)
      if (this.closed)
        F(r);
      else {
        if (r instanceof t) {
          if (r.closed || r._hasParent(this))
            return;
          r._addParent(this);
        }
        (this._finalizers = (e = this._finalizers) !== null && e !== void 0 ? e : []).push(r);
      }
  }, t.prototype._hasParent = function(r) {
    var e = this._parentage;
    return e === r || Array.isArray(e) && e.includes(r);
  }, t.prototype._addParent = function(r) {
    var e = this._parentage;
    this._parentage = Array.isArray(e) ? (e.push(r), e) : e ? [e, r] : r;
  }, t.prototype._removeParent = function(r) {
    var e = this._parentage;
    e === r ? this._parentage = null : Array.isArray(e) && z(e, r);
  }, t.prototype.remove = function(r) {
    var e = this._finalizers;
    e && z(e, r), r instanceof t && r._removeParent(this);
  }, t.EMPTY = function() {
    var r = new t();
    return r.closed = !0, r;
  }(), t;
}();
_.EMPTY;
function W(t) {
  return t instanceof _ || t && "closed" in t && f(t.remove) && f(t.add) && f(t.unsubscribe);
}
function F(t) {
  f(t) ? t() : t.unsubscribe();
}
var at = {
  Promise: void 0
}, lt = {
  setTimeout: function(t, r) {
    for (var e = [], n = 2; n < arguments.length; n++)
      e[n - 2] = arguments[n];
    return setTimeout.apply(void 0, x([t, r], S(e)));
  },
  clearTimeout: function(t) {
    return clearTimeout(t);
  },
  delegate: void 0
};
function K(t) {
  lt.setTimeout(function() {
    throw t;
  });
}
function q() {
}
function ht(t) {
  t();
}
var U = function(t) {
  T(r, t);
  function r(e) {
    var n = t.call(this) || this;
    return n.isStopped = !1, e ? (n.destination = e, W(e) && e.add(n)) : n.destination = dt, n;
  }
  return r.create = function(e, n, i) {
    return new R(e, n, i);
  }, r.prototype.next = function(e) {
    this.isStopped || this._next(e);
  }, r.prototype.error = function(e) {
    this.isStopped || (this.isStopped = !0, this._error(e));
  }, r.prototype.complete = function() {
    this.isStopped || (this.isStopped = !0, this._complete());
  }, r.prototype.unsubscribe = function() {
    this.closed || (this.isStopped = !0, t.prototype.unsubscribe.call(this), this.destination = null);
  }, r.prototype._next = function(e) {
    this.destination.next(e);
  }, r.prototype._error = function(e) {
    try {
      this.destination.error(e);
    } finally {
      this.unsubscribe();
    }
  }, r.prototype._complete = function() {
    try {
      this.destination.complete();
    } finally {
      this.unsubscribe();
    }
  }, r;
}(_), ft = function() {
  function t(r) {
    this.partialObserver = r;
  }
  return t.prototype.next = function(r) {
    var e = this.partialObserver;
    if (e.next)
      try {
        e.next(r);
      } catch (n) {
        A(n);
      }
  }, t.prototype.error = function(r) {
    var e = this.partialObserver;
    if (e.error)
      try {
        e.error(r);
      } catch (n) {
        A(n);
      }
    else
      A(r);
  }, t.prototype.complete = function() {
    var r = this.partialObserver;
    if (r.complete)
      try {
        r.complete();
      } catch (e) {
        A(e);
      }
  }, t;
}(), R = function(t) {
  T(r, t);
  function r(e, n, i) {
    var o = t.call(this) || this, s;
    return f(e) || !e ? s = {
      next: e ?? void 0,
      error: n ?? void 0,
      complete: i ?? void 0
    } : s = e, o.destination = new ft(s), o;
  }
  return r;
}(U);
function A(t) {
  K(t);
}
function pt(t) {
  throw t;
}
var dt = {
  closed: !0,
  next: q,
  error: pt,
  complete: q
}, j = function() {
  return typeof Symbol == "function" && Symbol.observable || "@@observable";
}();
function vt(t) {
  return t;
}
function mt(t) {
  return t.length === 0 ? vt : t.length === 1 ? t[0] : function(e) {
    return t.reduce(function(n, i) {
      return i(n);
    }, e);
  };
}
var g = function() {
  function t(r) {
    r && (this._subscribe = r);
  }
  return t.prototype.lift = function(r) {
    var e = new t();
    return e.source = this, e.operator = r, e;
  }, t.prototype.subscribe = function(r, e, n) {
    var i = this, o = bt(r) ? r : new R(r, e, n);
    return ht(function() {
      var s = i, a = s.operator, c = s.source;
      o.add(a ? a.call(o, c) : c ? i._subscribe(o) : i._trySubscribe(o));
    }), o;
  }, t.prototype._trySubscribe = function(r) {
    try {
      return this._subscribe(r);
    } catch (e) {
      r.error(e);
    }
  }, t.prototype.forEach = function(r, e) {
    var n = this;
    return e = $(e), new e(function(i, o) {
      var s = new R({
        next: function(a) {
          try {
            r(a);
          } catch (c) {
            o(c), s.unsubscribe();
          }
        },
        error: o,
        complete: i
      });
      n.subscribe(s);
    });
  }, t.prototype._subscribe = function(r) {
    var e;
    return (e = this.source) === null || e === void 0 ? void 0 : e.subscribe(r);
  }, t.prototype[j] = function() {
    return this;
  }, t.prototype.pipe = function() {
    for (var r = [], e = 0; e < arguments.length; e++)
      r[e] = arguments[e];
    return mt(r)(this);
  }, t.prototype.toPromise = function(r) {
    var e = this;
    return r = $(r), new r(function(n, i) {
      var o;
      e.subscribe(function(s) {
        return o = s;
      }, function(s) {
        return i(s);
      }, function() {
        return n(o);
      });
    });
  }, t.create = function(r) {
    return new t(r);
  }, t;
}();
function $(t) {
  var r;
  return (r = t ?? at.Promise) !== null && r !== void 0 ? r : Promise;
}
function yt(t) {
  return t && f(t.next) && f(t.error) && f(t.complete);
}
function bt(t) {
  return t && t instanceof U || yt(t) && W(t);
}
function gt(t) {
  return f(t == null ? void 0 : t.lift);
}
function B(t) {
  return function(r) {
    if (gt(r))
      return r.lift(function(e) {
        try {
          return t(e, this);
        } catch (n) {
          this.error(n);
        }
      });
    throw new TypeError("Unable to lift unknown Observable type");
  };
}
function I(t, r, e, n, i) {
  return new wt(t, r, e, n, i);
}
var wt = function(t) {
  T(r, t);
  function r(e, n, i, o, s, a) {
    var c = t.call(this, e) || this;
    return c.onFinalize = s, c.shouldUnsubscribe = a, c._next = n ? function(u) {
      try {
        n(u);
      } catch (l) {
        e.error(l);
      }
    } : t.prototype._next, c._error = o ? function(u) {
      try {
        o(u);
      } catch (l) {
        e.error(l);
      } finally {
        this.unsubscribe();
      }
    } : t.prototype._error, c._complete = i ? function() {
      try {
        i();
      } catch (u) {
        e.error(u);
      } finally {
        this.unsubscribe();
      }
    } : t.prototype._complete, c;
  }
  return r.prototype.unsubscribe = function() {
    var e;
    if (!this.shouldUnsubscribe || this.shouldUnsubscribe()) {
      var n = this.closed;
      t.prototype.unsubscribe.call(this), !n && ((e = this.onFinalize) === null || e === void 0 || e.call(this));
    }
  }, r;
}(U), St = {
  now: function() {
    return Date.now();
  }
}, Tt = function(t) {
  T(r, t);
  function r(e, n) {
    return t.call(this) || this;
  }
  return r.prototype.schedule = function(e, n) {
    return this;
  }, r;
}(_), V = {
  setInterval: function(t, r) {
    for (var e = [], n = 2; n < arguments.length; n++)
      e[n - 2] = arguments[n];
    return setInterval.apply(void 0, x([t, r], S(e)));
  },
  clearInterval: function(t) {
    return clearInterval(t);
  },
  delegate: void 0
}, Et = function(t) {
  T(r, t);
  function r(e, n) {
    var i = t.call(this, e, n) || this;
    return i.scheduler = e, i.work = n, i.pending = !1, i;
  }
  return r.prototype.schedule = function(e, n) {
    var i;
    if (n === void 0 && (n = 0), this.closed)
      return this;
    this.state = e;
    var o = this.id, s = this.scheduler;
    return o != null && (this.id = this.recycleAsyncId(s, o, n)), this.pending = !0, this.delay = n, this.id = (i = this.id) !== null && i !== void 0 ? i : this.requestAsyncId(s, this.id, n), this;
  }, r.prototype.requestAsyncId = function(e, n, i) {
    return i === void 0 && (i = 0), V.setInterval(e.flush.bind(e, this), i);
  }, r.prototype.recycleAsyncId = function(e, n, i) {
    if (i === void 0 && (i = 0), i != null && this.delay === i && this.pending === !1)
      return n;
    n != null && V.clearInterval(n);
  }, r.prototype.execute = function(e, n) {
    if (this.closed)
      return new Error("executing a cancelled action");
    this.pending = !1;
    var i = this._execute(e, n);
    if (i)
      return i;
    this.pending === !1 && this.id != null && (this.id = this.recycleAsyncId(this.scheduler, this.id, null));
  }, r.prototype._execute = function(e, n) {
    var i = !1, o;
    try {
      this.work(e);
    } catch (s) {
      i = !0, o = s || new Error("Scheduled action threw falsy error");
    }
    if (i)
      return this.unsubscribe(), o;
  }, r.prototype.unsubscribe = function() {
    if (!this.closed) {
      var e = this, n = e.id, i = e.scheduler, o = i.actions;
      this.work = this.state = this.scheduler = null, this.pending = !1, z(o, this), n != null && (this.id = this.recycleAsyncId(i, n, null)), this.delay = null, t.prototype.unsubscribe.call(this);
    }
  }, r;
}(Tt), G = function() {
  function t(r, e) {
    e === void 0 && (e = t.now), this.schedulerActionCtor = r, this.now = e;
  }
  return t.prototype.schedule = function(r, e, n) {
    return e === void 0 && (e = 0), new this.schedulerActionCtor(this, r).schedule(n, e);
  }, t.now = St.now, t;
}(), kt = function(t) {
  T(r, t);
  function r(e, n) {
    n === void 0 && (n = G.now);
    var i = t.call(this, e, n) || this;
    return i.actions = [], i._active = !1, i;
  }
  return r.prototype.flush = function(e) {
    var n = this.actions;
    if (this._active) {
      n.push(e);
      return;
    }
    var i;
    this._active = !0;
    do
      if (i = e.execute(e.state, e.delay))
        break;
    while (e = n.shift());
    if (this._active = !1, i) {
      for (; e = n.shift(); )
        e.unsubscribe();
      throw i;
    }
  }, r;
}(G), xt = new kt(Et), X = function(t) {
  return t && typeof t.length == "number" && typeof t != "function";
};
function Ot(t) {
  return f(t == null ? void 0 : t.then);
}
function At(t) {
  return f(t[j]);
}
function It(t) {
  return Symbol.asyncIterator && f(t == null ? void 0 : t[Symbol.asyncIterator]);
}
function Ct(t) {
  return new TypeError("You provided " + (t !== null && typeof t == "object" ? "an invalid object" : "'" + t + "'") + " where a stream was expected. You can provide an Observable, Promise, ReadableStream, Array, AsyncIterable, or Iterable.");
}
function Lt() {
  return typeof Symbol != "function" || !Symbol.iterator ? "@@iterator" : Symbol.iterator;
}
var _t = Lt();
function Pt(t) {
  return f(t == null ? void 0 : t[_t]);
}
function Ht(t) {
  return st(this, arguments, function() {
    var e, n, i, o;
    return Q(this, function(s) {
      switch (s.label) {
        case 0:
          e = t.getReader(), s.label = 1;
        case 1:
          s.trys.push([1, , 9, 10]), s.label = 2;
        case 2:
          return [4, w(e.read())];
        case 3:
          return n = s.sent(), i = n.value, o = n.done, o ? [4, w(void 0)] : [3, 5];
        case 4:
          return [2, s.sent()];
        case 5:
          return [4, w(i)];
        case 6:
          return [4, s.sent()];
        case 7:
          return s.sent(), [3, 2];
        case 8:
          return [3, 10];
        case 9:
          return e.releaseLock(), [7];
        case 10:
          return [2];
      }
    });
  });
}
function Mt(t) {
  return f(t == null ? void 0 : t.getReader);
}
function Y(t) {
  if (t instanceof g)
    return t;
  if (t != null) {
    if (At(t))
      return zt(t);
    if (X(t))
      return Rt(t);
    if (Ot(t))
      return Dt(t);
    if (It(t))
      return Z(t);
    if (Pt(t))
      return Ut(t);
    if (Mt(t))
      return jt(t);
  }
  throw Ct(t);
}
function zt(t) {
  return new g(function(r) {
    var e = t[j]();
    if (f(e.subscribe))
      return e.subscribe(r);
    throw new TypeError("Provided object does not correctly implement Symbol.observable");
  });
}
function Rt(t) {
  return new g(function(r) {
    for (var e = 0; e < t.length && !r.closed; e++)
      r.next(t[e]);
    r.complete();
  });
}
function Dt(t) {
  return new g(function(r) {
    t.then(function(e) {
      r.closed || (r.next(e), r.complete());
    }, function(e) {
      return r.error(e);
    }).then(null, K);
  });
}
function Ut(t) {
  return new g(function(r) {
    var e, n;
    try {
      for (var i = k(t), o = i.next(); !o.done; o = i.next()) {
        var s = o.value;
        if (r.next(s), r.closed)
          return;
      }
    } catch (a) {
      e = { error: a };
    } finally {
      try {
        o && !o.done && (n = i.return) && n.call(i);
      } finally {
        if (e) throw e.error;
      }
    }
    r.complete();
  });
}
function Z(t) {
  return new g(function(r) {
    Bt(t, r).catch(function(e) {
      return r.error(e);
    });
  });
}
function jt(t) {
  return Z(Ht(t));
}
function Bt(t, r) {
  var e, n, i, o;
  return ot(this, void 0, void 0, function() {
    var s, a;
    return Q(this, function(c) {
      switch (c.label) {
        case 0:
          c.trys.push([0, 5, 6, 11]), e = ut(t), c.label = 1;
        case 1:
          return [4, e.next()];
        case 2:
          if (n = c.sent(), !!n.done) return [3, 4];
          if (s = n.value, r.next(s), r.closed)
            return [2];
          c.label = 3;
        case 3:
          return [3, 1];
        case 4:
          return [3, 11];
        case 5:
          return a = c.sent(), i = { error: a }, [3, 11];
        case 6:
          return c.trys.push([6, , 9, 10]), n && !n.done && (o = e.return) ? [4, o.call(e)] : [3, 8];
        case 7:
          c.sent(), c.label = 8;
        case 8:
          return [3, 10];
        case 9:
          if (i) throw i.error;
          return [7];
        case 10:
          return [7];
        case 11:
          return r.complete(), [2];
      }
    });
  });
}
function N(t, r) {
  return B(function(e, n) {
    var i = 0;
    e.subscribe(I(n, function(o) {
      n.next(t.call(r, o, i++));
    }));
  });
}
var Yt = Array.isArray;
function Ft(t, r) {
  return Yt(r) ? t.apply(void 0, x([], S(r))) : t(r);
}
function qt(t) {
  return N(function(r) {
    return Ft(t, r);
  });
}
function $t(t, r, e, n, i, o, s, a) {
  var c = [], u = 0, l = 0, v = !1, y = function() {
    v && !c.length && !u && r.complete();
  }, h = function(p) {
    return u < n ? d(p) : c.push(p);
  }, d = function(p) {
    u++;
    var O = !1;
    Y(e(p, l++)).subscribe(I(r, function(E) {
      r.next(E);
    }, function() {
      O = !0;
    }, void 0, function() {
      if (O)
        try {
          u--;
          for (var E = function() {
            var P = c.shift();
            s || d(P);
          }; c.length && u < n; )
            E();
          y();
        } catch (P) {
          r.error(P);
        }
    }));
  };
  return t.subscribe(I(r, h, function() {
    v = !0, y();
  })), function() {
  };
}
function tt(t, r, e) {
  return e === void 0 && (e = 1 / 0), f(r) ? tt(function(n, i) {
    return N(function(o, s) {
      return r(n, o, i, s);
    })(Y(t(n, i)));
  }, e) : (typeof r == "number" && (e = r), B(function(n, i) {
    return $t(n, i, t, e);
  }));
}
var Vt = ["addListener", "removeListener"], Gt = ["addEventListener", "removeEventListener"], Jt = ["on", "off"];
function D(t, r, e, n) {
  if (f(e) && (n = e, e = void 0), n)
    return D(t, r, e).pipe(qt(n));
  var i = S(Kt(t) ? Gt.map(function(a) {
    return function(c) {
      return t[a](r, c, e);
    };
  }) : Qt(t) ? Vt.map(J(t, r)) : Wt(t) ? Jt.map(J(t, r)) : [], 2), o = i[0], s = i[1];
  if (!o && X(t))
    return tt(function(a) {
      return D(a, r, e);
    })(Y(t));
  if (!o)
    throw new TypeError("Invalid event target");
  return new g(function(a) {
    var c = function() {
      for (var u = [], l = 0; l < arguments.length; l++)
        u[l] = arguments[l];
      return a.next(1 < u.length ? u : u[0]);
    };
    return o(c), function() {
      return s(c);
    };
  });
}
function J(t, r) {
  return function(e) {
    return function(n) {
      return t[e](r, n);
    };
  };
}
function Qt(t) {
  return f(t.addListener) && f(t.removeListener);
}
function Wt(t) {
  return f(t.on) && f(t.off);
}
function Kt(t) {
  return f(t.addEventListener) && f(t.removeEventListener);
}
function Xt(t, r) {
  return r === void 0 && (r = xt), B(function(e, n) {
    var i = null, o = null, s = null, a = function() {
      if (i) {
        i.unsubscribe(), i = null;
        var u = o;
        o = null, n.next(u);
      }
    };
    function c() {
      var u = s + t, l = r.now();
      if (l < u) {
        i = this.schedule(void 0, u - l), n.add(i);
        return;
      }
      a();
    }
    e.subscribe(I(n, function(u) {
      o = u, s = r.now(), i || (i = r.schedule(c, t), n.add(i));
    }, function() {
      a(), n.complete();
    }, void 0, function() {
      o = i = null;
    }));
  });
}
var Zt = Object.defineProperty, Nt = Object.getOwnPropertyDescriptor, b = (t, r, e, n) => {
  for (var i = n > 1 ? void 0 : n ? Nt(r, e) : r, o = t.length - 1, s; o >= 0; o--)
    (s = t[o]) && (i = (n ? s(r, e, i) : s(i)) || i);
  return n && i && Zt(r, e, i), i;
};
let m = class extends rt {
  constructor() {
    super(...arguments), this.targetScrollHeight = 0, this.targetClientHeight = 0, this.arrowClickScrollTopDelta = 40, this.computedTargetScrollTop = 0, this.trackOffset = 0, this.trackHeight = 0, this.computedThumbSize = 32, this.thumbTop = 0, this.dragging = !1, this.mouseDownOffsetY = 0, this.mouseMoveListener = this.mouseMoveCB.bind(this), this.mouseUpListener = this.mouseUpCB.bind(this), this.resizeObserverListener = this.resizeObserverCB.bind(this), this.resizeObserver = new ResizeObserver(this.resizeObserverListener);
  }
  render() {
    return nt`
      <div
        class="up-arrow"
        @mousedown="${() => {
      this.changeScrollTop(-this.arrowClickScrollTopDelta);
    }}"
      >
        <slot name="up-arrow" />
      </div>
      <div
        part="track"
        class="track"
        style="--track-offset:${this.trackOffset}px"
      >
        <div
          part="thumb"
          class="thumb"
          style="display: ${this.targetScrollHeight > this.targetClientHeight ? "block" : "none"};
          --thumb-height: ${this.computedThumbSize}px;
          --thumb-top: ${this.thumbTop}px
          "
          @pointerdown="${(t) => {
      t.pointerType === "mouse" && this.thumb && (t.preventDefault(), this.thumb.setPointerCapture(t.pointerId), this.initialiseMouseDown(t));
    }}"
        ></div>
      </div>
      <div
        class="down-arrow"
        @mousedown="${() => {
      this.changeScrollTop(this.arrowClickScrollTopDelta);
    }}"
      >
        <slot name="down-arrow"></slot>
      </div>
    `;
  }
  connectedCallback() {
    super.connectedCallback(), this.setAttribute("tabindex", "-1"), this.updateComplete.then(() => {
      this.thumb = this.renderRoot.querySelector(".thumb"), this.track = this.thumb.parentElement, this.resizeObserver.observe(this), this.mouseMoveEventDebounceListener = D(this.thumb, "pointermove").pipe(Xt(70)).subscribe(() => {
        this.dragging && this.dispatchEvent(
          new CustomEvent("drag-stopped", {
            detail: { scrollTop: this.computedTargetScrollTop },
            composed: !0
          })
        );
      });
    });
  }
  disconnectedCallback() {
    var t;
    this.resizeObserver.disconnect(), (t = this.mouseMoveEventDebounceListener) == null || t.unsubscribe(), super.disconnectedCallback();
  }
  updated(t) {
    (t.has("targetClientHeight") || t.has("targetScrollHeight")) && this.reconfigureThumbSize();
  }
  reconfigureThumbSize() {
    const t = this.targetClientHeight / this.targetScrollHeight, r = this.trackHeight * t;
    this.computedThumbSize = r >= 32 ? r : 32;
  }
  initialiseMouseDown(t) {
    this.thumb = this.renderRoot.querySelector(".thumb"), this.track = this.thumb.parentElement;
    const r = this.track.getBoundingClientRect();
    this.trackHeight = r.height, this.trackOffset = r.top, this.dragging = !0, this.mouseDownOffsetY = t.clientY - this.thumb.getBoundingClientRect().top, this.thumb && (this.thumb.removeEventListener("pointermove", this.mouseMoveListener), this.thumb.removeEventListener("pointerup", this.mouseUpListener), this.thumb.addEventListener("pointermove", this.mouseMoveListener), this.thumb.addEventListener("pointerup", this.mouseUpListener));
  }
  mouseMoveCB(t) {
    this.thumbTop = t.clientY - this.mouseDownOffsetY, this.reconfigureThumbSize();
    const r = this.trackHeight - this.computedThumbSize, e = this.thumbTop - this.trackOffset;
    this.computedTargetScrollTop = e / r * (this.targetScrollHeight - this.targetClientHeight), this.computedTargetScrollTop = Math.min(
      Math.max(0, this.computedTargetScrollTop),
      this.targetScrollHeight - this.targetClientHeight
    ), this.dispatchEvent(
      new CustomEvent("dragging", {
        detail: { scrollTop: this.computedTargetScrollTop },
        composed: !0
      })
    );
  }
  mouseUpCB(t) {
    this.dragging = !1, this.thumb && (this.thumb.releasePointerCapture(t.pointerId), this.thumb.removeEventListener("pointermove", this.mouseMoveListener), this.thumb.removeEventListener("pointerup", this.mouseUpListener)), this.dispatchEvent(
      new CustomEvent("dragRelease", {
        detail: { scrollTop: this.computedTargetScrollTop },
        composed: !0
      })
    );
  }
  setToScrollTop(t) {
    const r = Math.min(
      Math.max(0, t),
      this.targetScrollHeight - this.targetClientHeight
    );
    this.computedTargetScrollTop = r;
    const n = (this.trackHeight - this.computedThumbSize) * (r / (this.targetScrollHeight - this.targetClientHeight));
    this.thumbTop = n + this.trackOffset;
  }
  changeScrollTop(t) {
    this.computedTargetScrollTop += t, this.setToScrollTop(this.computedTargetScrollTop), this.dispatchEvent(
      new CustomEvent("dragging", {
        detail: { scrollTop: this.computedTargetScrollTop }
      })
    );
  }
  resizeObserverCB(t) {
    this.thumb = this.renderRoot.querySelector(".thumb"), this.track = this.thumb.parentElement;
    const r = this.track.getBoundingClientRect();
    this.trackHeight = r.height, this.trackOffset = r.top, this.reconfigureThumbSize(), this.setToScrollTop(this.computedTargetScrollTop), this.dispatchEvent(new CustomEvent("resized", { composed: !0 }));
  }
};
m.styles = et`
    * {
      box-sizing: border-box;
    }
    :host {
      display: block;
      height: 100%;
      width: var(--scrollbar-width, 2rem);
      position: absolute;
      --thumb-height: 2rem;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .track {
      width: 100%;
      height: 100%;
      background: var(--track-background, gray);
      position: relative;
      justify-content: center;
      display: flex;
    }
    .thumb {
      width: 100%;
      min-height: 2rem;
      height: var(--thumb-height);
      position: absolute;
      top: clamp(
        0px,
        calc(var(--thumb-top) - calc(var(--track-offset))),
        calc(100% - var(--thumb-height))
      );
      background: var(--thumb-background, teal);
      cursor: grab;
      user-select: none;
      will-change: inset;
    }
    .thumb:active {
      cursor: grabbing;
    }
    .up-arrow,
    .down-arrow {
      width: 100%;
      background-color: black;
    }
  `;
b([
  C({ type: Number, reflect: !0 })
], m.prototype, "targetScrollHeight", 2);
b([
  C({ type: Number, reflect: !0 })
], m.prototype, "targetClientHeight", 2);
b([
  C({
    type: Number,
    reflect: !0,
    attribute: "arrow-click-scroll-delta"
  })
], m.prototype, "arrowClickScrollTopDelta", 2);
b([
  C({ type: Number, reflect: !0 })
], m.prototype, "computedTargetScrollTop", 2);
b([
  L()
], m.prototype, "trackOffset", 2);
b([
  L()
], m.prototype, "trackHeight", 2);
b([
  L()
], m.prototype, "computedThumbSize", 2);
b([
  L()
], m.prototype, "thumbTop", 2);
m = b([
  it("missing-fake-scrollbar")
], m);
export {
  m as MissingFakeScrollbar
};
//# sourceMappingURL=index.js.map
