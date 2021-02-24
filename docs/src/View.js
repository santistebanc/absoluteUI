import { auto, Component } from "./direct.js";
import { getDiff, parseProps } from "./utils.js";

export default function View(template) {
    let components = new Map();
    const inst = {
      components,
    };
  
    function attach(template, parent, passedProps) {
      let observer;
      const instance = Component(template, passedProps);
      const component = {
        attached: true,
        instance,
        detach: () => {
          component.attached = false;
          component.onDetach && component.onDetach(component);
          observer?.clearDependencies();
        },
        parent,
        children: [],
      };
      components.set(template, component);
      inst.onAttach && inst.onAttach(component);
  
      const children = instance.children?.call();
      if (children) {
        let prevChildren = [];
        observer = auto(() => {
          const currentChildren = instance.children();
          const { added, removed } = getDiff(prevChildren, currentChildren);
          removed.forEach((child) => {
            const comp = components.get(child);
            comp.detach();
            comp.attached = false;
            component.children.splice(component.children.indexOf(comp), 1);
          });
          added.forEach((child, i) => {
            const newComponent = attach(
              child,
              component,
              parseProps(template.childProps(instance.props)(child, i))
            );
  
            component.children.push(newComponent);
            components.set(child, newComponent);
          });
          prevChildren = currentChildren;
        });
      }
  
      return component;
    }
  
    inst.root = attach(template);
  
    return inst;
  }