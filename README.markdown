# Annotator

Popover that lets you highlight, share, add notes and tags to any selected text on a page

*Requires jQuery to be loaded on the page. Autocompletion (for tags) requires awesomplete.js*

##### [Demo](http://dvnc.github.io/annotator)


![Annotator Screenshot](./annotator-screenshot.png)


##### Getting started

```
    var annotator = Object.create(Annotator);
    annotator.init({
        containerElement: "#book",
        annotations: annotations, // Serialized annotations
        existingTags: tags, // Array of tags
    });
    annotator.startListening();

```

---------------

##### TODO
- AJAX call to save annotation to server
- Write tests

---------------


##### Development
```
npm install
bowser install
```

```
gulp
```

Visit http://localhost:8080/


---------------
**bharanim / dvnc**
