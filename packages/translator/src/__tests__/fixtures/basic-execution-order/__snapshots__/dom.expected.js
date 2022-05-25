import { queue as _queue, on as _on, data as _data, setConditionalRenderer as _setConditionalRenderer, queueInBranch as _queueInBranch, register as _register, bind as _bind, queueHydrate as _queueHydrate, write as _write, createRenderer as _createRenderer, createRenderFn as _createRenderFn } from "@marko/runtime-fluurt/src/dom";

function _apply$ifBody_message(_scope, message = _scope._[5]) {
  _data(_scope[0], message.text);
}

function _apply$ifBody(_scope) {
  _queue(_scope, _apply$ifBody_message, 0);
}

const _temp = function (_scope) {
  _queue(_scope, _apply_message, 0, null);

  _queue(_scope, _apply_show, 1, false);
};

function _hydrate(_scope) {
  _on(_scope[0], "click", _bind(_scope, _temp));
}

_register("packages/translator/src/__tests__/fixtures/basic-execution-order/template.marko_0", _hydrate);

function _apply_show(_scope, show) {
  if (_write(_scope, 6, show)) {
    _setConditionalRenderer(_scope, 1, show ? _ifBody : null);
  }
}

function _apply_message(_scope, message) {
  if (_write(_scope, 5, message)) {
    _queueInBranch(_scope, 1, _ifBody, _apply$ifBody_message, 1, 3);
  }
}

function _apply(_scope) {
  _apply_message(_scope, {
    text: "hi"
  });

  _apply_show(_scope, true);

  _queueHydrate(_scope, _hydrate);
}

export const template = "<button>hide</button><!>";
export const walks =
/* get, over(1), replace, skip(3), over(1) */
" b%+b";
export const apply = _apply;

const _ifBody = _createRenderer(" ",
/* get */
" ", _apply$ifBody);

export default _createRenderFn(template, walks, apply);