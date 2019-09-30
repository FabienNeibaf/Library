function attachProps(props, node) {
  Object.keys(props).forEach(prop => {
    if (prop.startsWith('on')) {
      node.addEventListener(prop.slice(2), props[prop]);
    } else if (prop == 'ref') {
      props[prop].current = node;
    } else if (prop != 'children') {
      node.setAttribute(prop, props[prop]);
    }
  });
}

function coerce(element) {
  switch (typeof element) {
    case 'string':
    case 'number':
      return document.createTextNode(element);
    case 'null':
    case 'boolean':
    case 'undefined':
      return document.createDocumentFragment();
    default:
      return null;
  }
}

export function createRef() {
  return Object.seal({ current: null });
}

export function createElement(type, config) {
  const props = config || {};
  const children = Array.isArray(arguments[2])
    ? arguments[2]
    : Array.prototype.slice.call(arguments, 2);
  if (children.length > 0) props.children = children;
  return { type, props };
}

function Fragment(props) {
  return {
    type: 'FRAGMENT',
    props,
  };
}

function mount(element) {
  let node;
  const { type, props } = element || {};
  if (type && type.isComponent) {
    node = type.new(props).mount();
  } else {
    node =
      coerce(element) ||
      (type && type.name == 'Fragment'
        ? document.createDocumentFragment()
        : document.createElement(type));
    if (props) {
      if (type.name != 'Fragment') attachProps(props, node);
      if (props.children) {
        const childNodes = props.children.map(mount);
        childNodes.forEach(child => node.appendChild(child));
      }
    }
  }
  return node;
}

export function Component(factory) {
  return {
    isComponent: true,
    new(props) {
      return {
        node: null,
        props: props || {},
        getHost() {
          const { node, children } = this;
          if (node.constructor.name == 'DocumentFragment') {
            return (children.item(0) && children.item(0).parentNode) || null;
          }
          return (node && node.parentNode) || null;
        },
        update(props) {
          this.props = Object.assign({}, this.props, props);
          const oldNode = this.node;
          const host = this.getHost();
          if (host) {
            if (this.node.constructor.name == 'DocumentFragment') {
              const oldChildren = this.children;
              this.mount();
              for (let i = 0; i < oldChildren.length - 1; i++) {
                host.replaceCHild(this.children[i], oldChildren[i]);
              }
            }
            host.replaceChild(this.mount(), oldNode);
          }
        },
        remove() {
          const host = this.getHost();
          if (this.node.constructor.name == 'DocumentFragment') {
            this.children.forEach(child => host.removeChild(child));
          } else {
            host.removeChild(this.node);
          }
        },
        mount() {
          const { props } = this;
          const node = mount(factory.call(this, this.props));
          if (node.constructor.name == 'DocumentFragment') {
            this.children = node.children;
          }
          node._component = this;
          this.node = node;
          if (props.ref) props.ref.current = node;
          return node;
        },
      };
    },
  };
}

export function render(element, host) {
  host.innerHTML = '';
  const node = mount(element);
  return host.appendChild(node);
}
const Penina = { Component, createElement, Fragment, render };
export default Penina;
