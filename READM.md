```javascript
  DragBoard
      .on('#board')     // draggable board selector
      .draggable('.card')   // draggable elements selectors
      .onDragStart(e => {
        // dragstart event
      })
      .onDragEnd(e => {
        // dragend event
      })
      .onDragging(e => {
        // drag event
      })
```