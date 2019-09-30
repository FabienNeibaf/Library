function attachProps(props, node) {
  const keys = Object.keys(props);
  for (const key of keys) {
    if (key.startsWith('on')) {
      node.addEventListener(key.slice(2), props[prop]);
    } else if (key === 'ref') {
      props[key].current = node;
    } else if (key !== 'children') {
      node.setAttribute(key, props[key]);
    }
  }
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

export function createElement(type, config, ...children) {
  const props = config || {};
  children = Array.isArray(children[0]) ? children[0] : children;
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
  let node = coerce(element);
  if (node) return node;
  const { type, props } = element || {};
  if (type && type.isComponent) return type.new(props).mount();
  if (type && type.name === 'Fragment') {
    node = document.createDocumentFragment();
  } else {
    node = document.createElement(type);
  }
  if (props) {
    if (type.name !== 'Fragment') attachProps(props, node);
    if (props.children) {
      const childNodes = props.children.map(mount);
      childNodes.forEach(child => node.appendChild(child));
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
          if (node.constructor.name === 'DocumentFragment') {
            return (children.item(0) && children.item(0).parentNode) || null;
          }
          return (node && node.parentNode) || null;
        },
        update(props) {
          this.props = Object.assign({}, this.props, props);
          const oldNode = this.node;
          const host = this.getHost();
          if (host) {
            if (this.node.constructor.name === 'DocumentFragment') {
              const oldChildren = this.children;
              this.mount();
              for (let i = 0; i < oldChildren.length - 1; i += 1) {
                host.replaceCHild(this.children[i], oldChildren[i]);
              }
            }
            host.replaceChild(this.mount(), oldNode);
          }
        },
        remove() {
          const host = this.getHost();
          if (this.node.constructor.name === 'DocumentFragment') {
            this.children.forEach(child => host.removeChild(child));
          } else {
            host.removeChild(this.node);
          }
        },
        mount() {
          const { props } = this;
          const node = mount(factory.call(this, this.props));
          if (node.constructor.name === 'DocumentFragment') {
            this.children = node.children;
          }
          node.component = this;
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
const Penina = {
  Component,
  createElement,
  Fragment,
  render,
};

export default Penina;
