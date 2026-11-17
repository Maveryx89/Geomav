/*
 * Control por giroscopio para Marzipano. Basado en la demo "device-orientation"
 * de Marzipano (Apache-2.0, Copyright 2016 Google Inc.), adaptado con permiso
 * explícito para iOS 13+ (DeviceOrientationEvent.requestPermission).
 */
(function () {
  'use strict';

  function rotateEuler(euler, result) {
    var heading, bank, attitude,
      ch = Math.cos(euler.yaw), sh = Math.sin(euler.yaw),
      ca = Math.cos(euler.pitch), sa = Math.sin(euler.pitch),
      cb = Math.cos(euler.roll), sb = Math.sin(euler.roll),
      m = [
        sh * sb - ch * sa * cb, -ch * ca, ch * sa * sb + sh * cb,
        ca * cb, -sa, -ca * sb,
        sh * sa * cb + ch * sb, sh * ca, -sh * sa * sb + ch * cb
      ];
    if (m[3] > 0.9999) { heading = Math.atan2(m[2], m[8]); attitude = Math.PI / 2; bank = 0; }
    else if (m[3] < -0.9999) { heading = Math.atan2(m[2], m[8]); attitude = -Math.PI / 2; bank = 0; }
    else { heading = Math.atan2(-m[6], m[0]); bank = Math.atan2(-m[5], m[4]); attitude = Math.asin(m[3]); }
    result.yaw = heading; result.pitch = attitude; result.roll = bank;
  }

  function GyroControlMethod() {
    this._dynamics = { yaw: new Marzipano.Dynamics(), pitch: new Marzipano.Dynamics() };
    this._handler = this._onData.bind(this);
    this._previous = {}; this._current = {}; this._tmp = {};
    window.addEventListener('deviceorientation', this._handler);
  }
  Marzipano.dependencies.eventEmitter(GyroControlMethod);

  GyroControlMethod.prototype.destroy = function () {
    window.removeEventListener('deviceorientation', this._handler);
  };

  GyroControlMethod.prototype._onData = function (e) {
    if (e.alpha == null) return;
    var p = this._previous, c = this._current, t = this._tmp;
    t.yaw = Marzipano.util.degToRad(e.alpha);
    t.pitch = Marzipano.util.degToRad(e.beta);
    t.roll = Marzipano.util.degToRad(e.gamma);
    rotateEuler(t, c);
    if (p.yaw != null) {
      this._dynamics.yaw.offset = -(c.yaw - p.yaw);
      this._dynamics.pitch.offset = (c.pitch - p.pitch);
      this.emit('parameterDynamics', 'yaw', this._dynamics.yaw);
      this.emit('parameterDynamics', 'pitch', this._dynamics.pitch);
    }
    p.yaw = c.yaw; p.pitch = c.pitch; p.roll = c.roll;
  };

  // API pública: window.TourGyro
  window.TourGyro = {
    supported: function () { return 'DeviceOrientationEvent' in window && ('ontouchstart' in window || navigator.maxTouchPoints > 0); },
    // Debe llamarse dentro de un gesto del usuario (clic) por el permiso de iOS.
    request: function () {
      var D = window.DeviceOrientationEvent;
      if (D && typeof D.requestPermission === 'function') {
        return D.requestPermission().then(function (r) { return r === 'granted'; });
      }
      return Promise.resolve(true);
    },
    create: function () { return new GyroControlMethod(); }
  };
})();
