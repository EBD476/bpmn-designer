export class BpmnChangeTracker {
  static elementAdded(element) {
    return `Added element: ${element.type} "${element.name || element.id}"`;
  }

  static elementRemoved(element) {
    return `Removed element: ${element.type} "${element.name || element.id}"`;
  }

  static elementModified(element, changes) {
    const changeList = Object.keys(changes).map(key => 
      `${key}: "${changes[key].oldValue}" → "${changes[key].newValue}"`
    ).join(', ');
    return `Modified ${element.type} "${element.name || element.id}": ${changeList}`;
  }

  static connectionCreated(source, target) {
    return `Created connection: ${source.type} → ${target.type}`;
  }

  static connectionRemoved(source, target) {
    return `Removed connection: ${source.type} → ${target.type}`;
  }

  static diagramImported(name) {
    return `Imported diagram: ${name}`;
  }

  static diagramExported(name) {
    return `Exported diagram: ${name}`;
  }

  static validationError(message) {
    return `Validation Error: ${message}`;
  }

  static warning(message) {
    return `Warning: ${message}`;
  }

  static info(message) {
    return `Info: ${message}`;
  }
}