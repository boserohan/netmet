(function(global, factory) {
    typeof exports === "object" && typeof module !== "undefined" ? module.exports = factory() : typeof define === "function" && define.amd ? define(factory) : (global = typeof globalThis !== "undefined" ? globalThis : global || self, global["scroll-reveal"] = factory());
  })(this, function() {
    "use strict";
    const style = "";
    const DEV_COMPONENT_TAG_NAME = "animate-on-reveal";
    const _AnimateOnElementReveal = class _AnimateOnElementReveal2 extends HTMLElement {
      constructor() {
        super();
        if (!this.firstElementChild) {
          return;
        }
        this.nodeToObserve = this.findObservableNodeFromTree(
          this.firstElementChild
        );
        this.intersectionObserver = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                this.setAttribute("revealed", "");
              } else {
                this.removeAttribute("revealed");
              }
            });
          },
          { threshold: 0.5 }
        );
        this.style.display = "contents";
      }
      static registerSelf() {
        if (!window.customElements.get(DEV_COMPONENT_TAG_NAME)) {
          window.customElements.define(
            DEV_COMPONENT_TAG_NAME,
            _AnimateOnElementReveal2
          );
        }
      }
      connectedCallback() {
        if (!this.nodeToObserve) {
          return;
        }
        this.nodeToObserve.style.animationPlayState = "paused";
        this.intersectionObserver.observe(this.nodeToObserve);
      }
      disconnectedCallback() {
        this.intersectionObserver.disconnect();
      }
      findObservableNodeFromTree(node) {
        const style2 = window.getComputedStyle(node);
        if (style2.getPropertyValue("display") !== "contents") {
          return node;
        }
        const children = node.children;
        for (let i = 0; i < children.length; i++) {
          const descendant = this.findObservableNodeFromTree(children[i]);
          if (descendant) {
            return descendant;
          }
        }
        return null;
      }
      attributeChangedCallback(name) {
        switch (name) {
          case "animation":
            this.nodeToObserve.style.animationName = this.getAttribute("animation") || "";
            break;
          case "duration":
            this.nodeToObserve.style.animationDuration = this.getAttribute(name) || "0s";
            break;
          case "delay":
            this.nodeToObserve.style.animationDelay = this.getAttribute(name) || "0s";
            break;
          case "easing":
            this.nodeToObserve.style.animationTimingFunction = this.getAttribute(name) || "ease";
            break;
          case "iteration":
            this.nodeToObserve.style.animationIterationCount = this.getAttribute(name) || "1";
            break;
          case "direction":
            this.nodeToObserve.style.animationDirection = this.getAttribute(name) || "normal";
            break;
          case "revealed":
            this.nodeToObserve.style.animationPlayState = this.hasAttribute(
              "revealed"
            ) ? "running" : "paused";
            break;
        }
      }
    };
    _AnimateOnElementReveal.observedAttributes = [
      "animation",
      "duration",
      "delay",
      "direction",
      "easing",
      "revealed",
      "class",
      "classname",
      "iteration"
    ];
    let AnimateOnElementReveal = _AnimateOnElementReveal;
    AnimateOnElementReveal.registerSelf();
    return AnimateOnElementReveal;
  });